import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CONFIDENCE_SWITCH_THRESHOLD,
  EMA_ALPHA,
  FRAME_SIMILARITY_RATIO,
  MIN_ANALYZE_GAP_LOCKED_MS,
  MIN_ANALYZE_GAP_SCAN_MS,
  MIN_BUFFER_SAMPLES,
  MONITOR_SWITCH_SAMPLES,
  PREDICTION_BUFFER_SIZE,
} from '../utils/constants'
import { fingerprintBlob, isFrameSimilar } from '../utils/frameFingerprint'
import {
  canLockFromBuffer,
  getMajorityVote,
  pushSample,
} from '../utils/predictionBuffer'
import { ema } from '../utils/smoothing'
import { analyzePostureImage } from '../services/api'

const initialDisplay = {
  pose: '—',
  confidence: 0,
  posture_score: null,
  feedback: [],
  matched: false,
  locked: false,
  poseLocked: false,
  rawPose: '—',
}

/**
 * Continuous camera + throttled intelligent analysis (rAF loop).
 * Freezes readout only when locked; camera stays live.
 */
export function useLivePosePrediction(enabled, getFrameBlob, onPoseLocked) {
  const [display, setDisplay] = useState(initialDisplay)
  const [engineStatus, setEngineStatus] = useState('idle')
  const [poseLocked, setPoseLocked] = useState(false)

  const phaseRef = useRef('scanning')
  const bufferRef = useRef([])
  const frozenRef = useRef(null)
  const lockedMudraRef = useRef(null)
  const switchStreakRef = useRef({ pose: null, count: 0 })
  const smoothConf = useRef(null)
  const smoothScore = useRef(null)
  const gen = useRef(0)
  const busy = useRef(false)
  const lastAnalyzeAt = useRef(0)
  const lastFingerprint = useRef(null)
  const lastBackendSignature = useRef(null)

  const onLockRef = useRef(onPoseLocked)
  const getFrameRef = useRef(getFrameBlob)

  useEffect(() => {
    onLockRef.current = onPoseLocked
  }, [onPoseLocked])

  useEffect(() => {
    getFrameRef.current = getFrameBlob
  }, [getFrameBlob])

  const buildSnapshot = useCallback((raw, blob, locked) => {
    const conf = Number(raw.confidence) || 0
    const score = Number(raw.posture_score)
    const rawPose = String(raw.pose ?? 'none')

    smoothConf.current = ema(smoothConf.current, conf, EMA_ALPHA)
    smoothScore.current = ema(
      smoothScore.current,
      Number.isFinite(score) ? score : smoothScore.current ?? 0,
      EMA_ALPHA
    )

    const poseLabel = rawPose === 'none' ? '—' : rawPose

    return {
      pose: poseLabel,
      confidence: smoothConf.current ?? conf,
      posture_score: Math.round(smoothScore.current ?? score ?? 0),
      feedback: Array.isArray(raw.feedback) ? raw.feedback : [],
      matched: Boolean(raw.matched),
      locked: Boolean(raw.locked) || locked,
      model_loaded: raw.model_loaded !== false,
      predicted_pose: raw.predicted_pose ?? null,
      poseLocked: locked,
      rawPose,
      frameBlob: blob,
    }
  }, [])

  const applyLock = useCallback(
    (snapshot) => {
      const mudra = snapshot.pose
      if (!mudra || mudra === '—' || mudra === 'none') return

      phaseRef.current = 'locked'
      frozenRef.current = {
        ...snapshot,
        pose: mudra,
        locked: true,
        poseLocked: true,
        matched: true,
      }
      lockedMudraRef.current = mudra
      switchStreakRef.current = { pose: null, count: 0 }
      bufferRef.current = []

      setPoseLocked(true)
      setDisplay(frozenRef.current)
      setEngineStatus('locked')

      onLockRef.current?.({
        pose: mudra,
        confidence: snapshot.confidence,
        posture_score: snapshot.posture_score,
        feedback: snapshot.feedback,
        matched: true,
        locked: true,
        frameBlob: snapshot.frameBlob,
      })
    },
    []
  )

  const tryLock = useCallback(
    (raw, blob) => {
      const conf = Number(raw.confidence) || 0
      const rawPose = String(raw.pose ?? 'none')
      const matched =
        (Boolean(raw.matched) || Boolean(raw.locked)) &&
        rawPose !== 'none' &&
        conf >= CONFIDENCE_SWITCH_THRESHOLD

      if (!matched) return false

      bufferRef.current = pushSample(
        bufferRef.current,
        { pose: rawPose, confidence: conf },
        PREDICTION_BUFFER_SIZE
      )

      const vote = canLockFromBuffer(bufferRef.current, MIN_BUFFER_SAMPLES)
      if (!vote || vote.pose !== rawPose) return false

      const snapshot = buildSnapshot(raw, blob, true)
      snapshot.pose = vote.pose
      applyLock(snapshot)
      return true
    },
    [applyLock, buildSnapshot]
  )

  const trySwitchWhileLocked = useCallback(
    (raw, blob) => {
      const conf = Number(raw.confidence) || 0
      const rawPose = String(raw.pose ?? 'none')
      const current = lockedMudraRef.current

      if (
        !raw.matched &&
        !raw.locked &&
        conf < CONFIDENCE_SWITCH_THRESHOLD
      ) {
        switchStreakRef.current = { pose: null, count: 0 }
        return false
      }

      if (!rawPose || rawPose === 'none' || rawPose === current) {
        switchStreakRef.current = { pose: null, count: 0 }
        return false
      }

      if (switchStreakRef.current.pose === rawPose) {
        switchStreakRef.current.count += 1
      } else {
        switchStreakRef.current = { pose: rawPose, count: 1 }
      }

      bufferRef.current = pushSample(
        bufferRef.current,
        { pose: rawPose, confidence: conf },
        PREDICTION_BUFFER_SIZE
      )

      const vote = getMajorityVote(bufferRef.current)
      const stable =
        switchStreakRef.current.count >= MONITOR_SWITCH_SAMPLES &&
        vote?.pose === rawPose &&
        vote.confidence >= CONFIDENCE_SWITCH_THRESHOLD

      if (!stable) return false

      const snapshot = buildSnapshot(raw, blob, true)
      snapshot.pose = vote.pose
      applyLock(snapshot)
      return true
    },
    [applyLock, buildSnapshot]
  )

  const resetSession = useCallback(() => {
    gen.current += 1
    phaseRef.current = 'scanning'
    bufferRef.current = []
    frozenRef.current = null
    lockedMudraRef.current = null
    switchStreakRef.current = { pose: null, count: 0 }
    smoothConf.current = null
    smoothScore.current = null
    busy.current = false
    lastAnalyzeAt.current = 0
    lastFingerprint.current = null
    lastBackendSignature.current = null
    setPoseLocked(false)
    setDisplay(initialDisplay)
    setEngineStatus('idle')
  }, [])

  useEffect(() => {
    if (!enabled) {
      resetSession()
      return undefined
    }

    const myGen = ++gen.current
    phaseRef.current = 'scanning'
    bufferRef.current = []
    frozenRef.current = null
    lockedMudraRef.current = null
    lastAnalyzeAt.current = 0
    lastFingerprint.current = null
    lastBackendSignature.current = null
    setPoseLocked(false)
    setEngineStatus('watching')

    let rafId = 0

    const runAnalysis = async () => {
      if (myGen !== gen.current || busy.current) return

      const now = performance.now()
      const gap =
        phaseRef.current === 'locked'
          ? MIN_ANALYZE_GAP_LOCKED_MS
          : MIN_ANALYZE_GAP_SCAN_MS
      if (now - lastAnalyzeAt.current < gap) return

      busy.current = true
      const isLocked = phaseRef.current === 'locked'

      try {
        if (!isLocked) setEngineStatus('analyzing')

        const blob = await getFrameRef.current()
        if (myGen !== gen.current || !blob) {
          if (!isLocked) setEngineStatus('watching')
          return
        }

        const fp = await fingerprintBlob(blob)
        if (isFrameSimilar(lastFingerprint.current, fp, FRAME_SIMILARITY_RATIO)) {
          if (isLocked && frozenRef.current) {
            setDisplay(frozenRef.current)
            setEngineStatus('locked')
          } else if (!isLocked) {
            setEngineStatus('watching')
          }
          return
        }
        lastFingerprint.current = fp
        lastAnalyzeAt.current = now

        const raw = await analyzePostureImage(blob)
        if (myGen !== gen.current) return

        if (
          isLocked &&
          raw?.frame_signature &&
          raw.frame_signature === lastBackendSignature.current
        ) {
          setDisplay(frozenRef.current)
          setEngineStatus('locked')
          return
        }
        if (raw?.frame_signature) lastBackendSignature.current = raw.frame_signature

        if (raw?.error) {
          if (!frozenRef.current) {
            setEngineStatus('api_error')
            setDisplay((d) => ({
              ...d,
              feedback: [String(raw.error)],
              matched: false,
              locked: false,
              poseLocked: false,
            }))
          } else {
            setEngineStatus('locked')
          }
          return
        }

        if (phaseRef.current === 'scanning') {
          if (tryLock(raw, blob)) return
          const preview = buildSnapshot(raw, blob, false)
          preview.pose = preview.rawPose === 'none' ? '—' : preview.pose
          setDisplay(preview)
          setEngineStatus('watching')
          return
        }

        if (phaseRef.current === 'locked') {
          if (trySwitchWhileLocked(raw, blob)) return
          setDisplay(frozenRef.current)
          setPoseLocked(true)
          setEngineStatus('locked')
        }
      } catch {
        if (myGen === gen.current && !frozenRef.current) {
          setEngineStatus('network_error')
        }
      } finally {
        busy.current = false
      }
    }

    const loop = () => {
      if (myGen !== gen.current) return
      rafId = requestAnimationFrame(loop)
      void runAnalysis()
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      gen.current += 1
      cancelAnimationFrame(rafId)
      busy.current = false
    }
  }, [enabled, resetSession, buildSnapshot, tryLock, trySwitchWhileLocked])

  return { display, status: engineStatus, poseLocked, resetSession }
}
