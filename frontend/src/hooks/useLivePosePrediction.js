import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ANALYZE_INTERVAL_MS,
  CONFIDENCE_SWITCH_THRESHOLD,
  EMA_ALPHA,
  LOCK_PAUSE_MS,
  MIN_BUFFER_SAMPLES,
  MONITOR_SWITCH_SAMPLES,
  PREDICTION_BUFFER_SIZE,
} from '../utils/constants'
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
  poseLocked: false,
  rawPose: '—',
}

/**
 * Live engine with confidence lock, pause-after-lock, and debounced mudra switching.
 * @param {boolean} enabled
 * @param {() => Promise<Blob | null>} getFrameBlob
 * @param {(payload: object) => void} [onPoseLocked] — fired once per newly locked mudra (history)
 */
export function useLivePosePrediction(enabled, getFrameBlob, onPoseLocked) {
  const [display, setDisplay] = useState(initialDisplay)
  const [engineStatus, setEngineStatus] = useState('idle')
  const [poseLocked, setPoseLocked] = useState(false)

  const phaseRef = useRef('scanning')
  const bufferRef = useRef([])
  const frozenRef = useRef(null)
  const lockedMudraRef = useRef(null)
  const pauseUntilRef = useRef(0)
  const switchStreakRef = useRef({ pose: null, count: 0 })
  const smoothConf = useRef(null)
  const smoothScore = useRef(null)
  const gen = useRef(0)
  const busy = useRef(false)
  const intervalRef = useRef(null)
  const resumeTimerRef = useRef(null)

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

    return {
      pose: rawPose === 'none' ? '—' : rawPose,
      confidence: smoothConf.current ?? conf,
      posture_score: Math.round(smoothScore.current ?? score ?? 0),
      feedback: Array.isArray(raw.feedback) ? raw.feedback : [],
      matched: Boolean(raw.matched),
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
      frozenRef.current = { ...snapshot, poseLocked: true }
      lockedMudraRef.current = mudra
      pauseUntilRef.current = Date.now() + LOCK_PAUSE_MS
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
        frameBlob: snapshot.frameBlob,
      })

      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = setTimeout(() => {
        phaseRef.current = 'monitoring'
        setEngineStatus('monitoring')
      }, LOCK_PAUSE_MS)
    },
    []
  )

  const tryLock = useCallback(
    (raw, blob) => {
      const conf = Number(raw.confidence) || 0
      const rawPose = String(raw.pose ?? 'none')
      const matched = Boolean(raw.matched) && rawPose !== 'none' && conf >= CONFIDENCE_SWITCH_THRESHOLD

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

  const trySwitchInMonitoring = useCallback(
    (raw, blob) => {
      const conf = Number(raw.confidence) || 0
      const rawPose = String(raw.pose ?? 'none')
      const current = lockedMudraRef.current

      if (!raw.matched || rawPose === 'none' || conf < CONFIDENCE_SWITCH_THRESHOLD) {
        switchStreakRef.current = { pose: null, count: 0 }
        return false
      }

      if (rawPose === current) {
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
    pauseUntilRef.current = 0
    switchStreakRef.current = { pose: null, count: 0 }
    smoothConf.current = null
    smoothScore.current = null
    busy.current = false
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = null
    }
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
    setPoseLocked(false)

    const tick = () => {
      if (myGen !== gen.current || busy.current) return
      if (phaseRef.current === 'locked') return
      if (Date.now() < pauseUntilRef.current) return

      busy.current = true

      ;(async () => {
        setEngineStatus(phaseRef.current === 'monitoring' ? 'monitoring' : 'capturing')
        try {
          const blob = await getFrameRef.current()
          if (myGen !== gen.current) return
          if (!blob) {
            setEngineStatus('no_frame')
            return
          }

          setEngineStatus('analyzing')
          const raw = await analyzePostureImage(blob)
          if (myGen !== gen.current) return

          if (raw?.error) {
            setEngineStatus('api_error')
            if (!frozenRef.current) {
              setDisplay((d) => ({
                ...d,
                feedback: [String(raw.error)],
                matched: false,
                poseLocked: false,
              }))
            }
            return
          }

          if (phaseRef.current === 'scanning') {
            if (tryLock(raw, blob)) return
            const preview = buildSnapshot(raw, blob, false)
            preview.pose = preview.rawPose === 'none' ? '—' : preview.pose
            setDisplay(preview)
            setEngineStatus('live')
            return
          }

          if (phaseRef.current === 'monitoring') {
            if (trySwitchInMonitoring(raw, blob)) return
            if (frozenRef.current) {
              setDisplay(frozenRef.current)
              setPoseLocked(true)
            }
            setEngineStatus('monitoring')
            return
          }

          const preview = buildSnapshot(raw, blob, false)
          preview.pose = preview.rawPose === 'none' ? '—' : preview.pose
          setDisplay(preview)
          setEngineStatus('live')
        } catch {
          if (myGen === gen.current) setEngineStatus('network_error')
        } finally {
          busy.current = false
        }
      })()
    }

    tick()
    intervalRef.current = setInterval(tick, ANALYZE_INTERVAL_MS)

    return () => {
      gen.current += 1
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      busy.current = false
    }
  }, [
    enabled,
    resetSession,
    buildSnapshot,
    tryLock,
    trySwitchInMonitoring,
  ])

  return { display, status: engineStatus, poseLocked, resetSession }
}
