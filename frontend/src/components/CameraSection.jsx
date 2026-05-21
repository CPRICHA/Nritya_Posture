import { motion } from 'framer-motion'
import { Clock, RefreshCw, Square } from 'lucide-react'
import { CameraFeed } from './CameraFeed'

export function CameraSection({
  videoRef,
  cameraOn,
  live,
  onStartCamera,
  onStopCamera,
  onSwitchMode,
  switchLabel = 'Switch Mode',
}) {
  return (
    <motion.div
      layout
      className="panel-camera flex h-full flex-col p-5 sm:p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="label-caps">Live Camera</p>
        {live ? (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-200/90">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            Live
          </span>
        ) : null}
      </div>

      <div className="feed-glow-wrap overflow-hidden rounded-2xl">
        <CameraFeed ref={videoRef} mirrored showLiveDot={false} />
      </div>

      <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {!cameraOn ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={onStartCamera}
            className="btn-gold-solid w-full rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-maroon-950 sm:w-auto"
          >
            Start Camera
          </motion.button>
        ) : (
          <>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={onStopCamera}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-maroon-800/90 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-cream shadow-[0_0_20px_rgba(107,31,50,0.35)] sm:w-auto"
            >
              <Square className="h-3 w-3 fill-current" />
              Stop Camera
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={onSwitchMode}
              className="btn-gold-ghost flex w-full items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-cream sm:w-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {switchLabel}
            </motion.button>
          </>
        )}
      </div>

      {live ? (
        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-cream-muted/80">
          <Clock className="h-3.5 w-3.5 text-gold-400/70" />
          Analyzing every 2–3 seconds
        </p>
      ) : null}
    </motion.div>
  )
}
