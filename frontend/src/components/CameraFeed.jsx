import { forwardRef } from 'react'
import { motion } from 'framer-motion'

export const CameraFeed = forwardRef(function CameraFeed(
  { mirrored = true, isLive = false, placeholder, className = '' },
  ref
) {
  return (
    <motion.div
      layout
      className={`feed-frame relative aspect-video w-full ${isLive ? 'feed-frame-live' : ''} ${className}`}
      initial={{ opacity: 0.92 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-gold-500/8 via-transparent to-maroon-900/25" />
      {isLive ? <div className="camera-live-ring pointer-events-none absolute inset-0 rounded-2xl" aria-hidden /> : null}
      {placeholder ? (
        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-black/45 text-sm text-cream-muted">
          {placeholder}
        </div>
      ) : (
        <video
          ref={ref}
          playsInline
          muted
          autoPlay
          className={`relative z-[1] h-full w-full rounded-2xl object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
        />
      )}
      {isLive ? (
        <div className="pointer-events-none absolute right-3 top-3 z-[2] flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-100 ring-1 ring-emerald-400/30">
          <span className="live-dot-pulse h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Live
        </div>
      ) : null}
    </motion.div>
  )
})
