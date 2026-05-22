import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, CloudUpload } from 'lucide-react'
import { CameraSection } from './CameraSection'
import { ResultCard } from './ResultCard'
import { PoseHistory } from './PoseHistory'
import { useLivePosePrediction } from '../hooks/useLivePosePrediction'
import { usePoseAnalysis } from '../hooks/usePoseAnalysis'
import { JPEG_QUALITY, MAX_HISTORY } from '../utils/constants'
import { shouldRecordPose } from '../utils/history'

let historyId = 0

export function PostureStudio({ expanded, mode, onModeChange, uploadFile, onUploadConsumed }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [cameraOn, setCameraOn] = useState(false)
  const [live, setLive] = useState(false)
  const [history, setHistory] = useState([])
  const [uploadPreview, setUploadPreview] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)

  const lastHistoryPose = useRef(null)
  const thumbUrls = useRef(new Set())

  const { analyze, loading: uploadLoading, error: uploadError, resetError } = usePoseAnalysis()

  const revokeThumb = (url) => {
    if (url && thumbUrls.current.has(url)) {
      URL.revokeObjectURL(url)
      thumbUrls.current.delete(url)
    }
  }

  const appendHistory = useCallback((entry) => {
    if (!shouldRecordPose(lastHistoryPose.current, entry.pose, entry.confidence)) return
    lastHistoryPose.current = entry.pose
    setHistory((h) => [{ ...entry, id: ++historyId }, ...h].slice(0, MAX_HISTORY))
  }, [])

  const handlePoseLocked = useCallback(
    (payload) => {
      let thumbnail = null
      if (payload.frameBlob) {
        thumbnail = URL.createObjectURL(payload.frameBlob)
        thumbUrls.current.add(thumbnail)
      }
      appendHistory({
        pose: payload.pose,
        confidence: payload.confidence,
        posture_score: payload.posture_score,
        timestamp: Date.now(),
        thumbnail,
      })
    },
    [appendHistory]
  )

  const getFrameBlob = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return null
    const w = video.videoWidth
    const h = video.videoHeight
    if (!w || !h) return null
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, w, h)
    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY)
    })
  }, [])

  const { display, status, poseLocked, resetSession } = useLivePosePrediction(
    live && cameraOn,
    getFrameBlob,
    handlePoseLocked
  )

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      const v = videoRef.current
      if (v) {
        v.srcObject = stream
        await v.play().catch(() => {})
      }
      setCameraOn(true)
    } catch {
      setCameraOn(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    setLive(false)
    resetSession()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
  }, [resetSession])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      thumbUrls.current.forEach((u) => URL.revokeObjectURL(u))
      thumbUrls.current.clear()
    }
  }, [])

  useEffect(() => {
    if (expanded && mode === 'live' && cameraOn && !live) setLive(true)
  }, [expanded, mode, cameraOn, live])

  useEffect(() => {
    if (!uploadFile) return
    resetError()
    setUploadResult(null)
    const preview = URL.createObjectURL(uploadFile)
    setUploadPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return preview
    })
    onModeChange('upload')

    ;(async () => {
      try {
        const data = await analyze(uploadFile)
        setUploadResult(data)
        if (data?.pose && shouldRecordPose(lastHistoryPose.current, data.pose, data.confidence)) {
          lastHistoryPose.current = data.pose
          const thumb = URL.createObjectURL(uploadFile)
          thumbUrls.current.add(thumb)
          setHistory((h) =>
            [
              {
                id: ++historyId,
                pose: data.pose,
                confidence: data.confidence,
                posture_score: data.posture_score,
                timestamp: Date.now(),
                thumbnail: thumb,
              },
              ...h,
            ].slice(0, MAX_HISTORY)
          )
        }
      } catch {
        /* uploadError */
      } finally {
        onUploadConsumed?.()
      }
    })()
  }, [uploadFile, analyze, onModeChange, onUploadConsumed, resetError])

  if (!expanded) return null

  const isLive = mode === 'live'
  const analyzing = isLive && (status === 'analyzing' || status === 'capturing')
  const isLocked = isLive && poseLocked
  const result = isLive
    ? display
    : uploadResult
      ? {
          pose: uploadResult.pose,
          confidence: uploadResult.confidence,
          posture_score: uploadResult.posture_score,
          feedback: uploadResult.feedback ?? [],
          matched: uploadResult.matched,
          model_loaded: uploadResult.model_loaded !== false,
          predicted_pose: uploadResult.predicted_pose ?? null,
        }
      : null

  const handleSwitchMode = () => {
    if (isLive) {
      setLive(false)
      resetSession()
      onModeChange('upload')
    } else {
      onModeChange('live')
      if (cameraOn) setLive(true)
    }
  }

  return (
    <AnimatePresence>
      <motion.section
        id="posture-studio"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45 }}
        className="studio-zone-ref relative scroll-mt-24"
      >
        <div className="mx-auto max-w-6xl px-3 pb-16 pt-4 sm:px-4 md:px-8 md:pb-20">
          <div className="mode-tabs-bar mx-auto mb-8 flex max-w-md flex-col gap-2 sm:mb-10 sm:flex-row sm:justify-center sm:gap-1.5">
            <ModeTab
              active={isLive}
              label="Live Analysis"
              icon={Camera}
              onClick={() => onModeChange('live')}
            />
            <ModeTab
              active={!isLive}
              label="Upload Image"
              icon={CloudUpload}
              onClick={() => {
                setLive(false)
                resetSession()
                onModeChange('upload')
              }}
            />
          </div>

          <div className="studio-main-grid">
            <div className="min-w-0">
              {isLive ? (
                <CameraSection
                  videoRef={videoRef}
                  cameraOn={cameraOn}
                  live={live && cameraOn}
                  poseLocked={isLocked}
                  engineStatus={status}
                  onStartCamera={startCamera}
                  onStopCamera={stopCamera}
                  onSwitchMode={handleSwitchMode}
                />
              ) : (
                <motion.div
                  layout
                  className="panel-camera flex h-full flex-col p-5 sm:p-6"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="label-caps mb-4">Pose Preview</p>
                  <div className="feed-glow-wrap overflow-hidden rounded-2xl">
                    {uploadPreview ? (
                      <img
                        src={uploadPreview}
                        alt="Uploaded pose"
                        className="aspect-video w-full object-contain bg-black/50"
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-black/40 text-sm text-cream-muted/90">
                        Choose an image from the card above
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSwitchMode}
                    className="btn-gold-ghost mx-auto mt-5 rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-cream"
                  >
                    Switch Mode
                  </button>
                </motion.div>
              )}
              <canvas ref={canvasRef} className="hidden" aria-hidden />
              {isLive && !cameraOn ? (
                <p className="mt-3 text-center text-sm text-cream-muted/80">
                  Start your camera to begin live posture coaching.
                </p>
              ) : null}
              {uploadError ? (
                <p className="mt-3 text-center text-sm text-rose-200/90">{uploadError}</p>
              ) : null}
            </div>

            <div className="min-w-0">
              <ResultCard
                pose={String(result?.pose ?? '—')}
                matched={Boolean(result?.matched)}
                confidence={Number(result?.confidence) || 0}
                postureScore={result?.posture_score ?? null}
                feedback={result?.feedback ?? []}
                loading={isLive ? analyzing : uploadLoading}
                poseLocked={isLocked}
                modelLoaded={result?.model_loaded !== false}
                predictedPose={result?.predicted_pose ?? null}
              />
            </div>
          </div>

          <PoseHistory
            items={history}
            onClear={() => {
              history.forEach((i) => revokeThumb(i.thumbnail))
              setHistory([])
              lastHistoryPose.current = null
            }}
          />
        </div>
      </motion.section>
    </AnimatePresence>
  )
}

function ModeTab({ active, label, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] transition-all sm:w-auto sm:px-6 sm:py-2.5 ${
        active ? 'mode-tab-active text-gold-100' : 'text-cream-muted/90 hover:text-cream'
      }`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 opacity-80" strokeWidth={1.75} /> : null}
      {label}
    </button>
  )
}
