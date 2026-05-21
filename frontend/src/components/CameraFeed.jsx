import { forwardRef } from 'react'
import { motion } from 'framer-motion'

export const CameraFeed = forwardRef(function CameraFeed(
  { mirrored = true, showLiveDot = false, placeholder, className = '' },
  ref
) {
  return (
    <motion.div
      layout
      className={`feed-frame relative aspect-video w-full ${className}`}
      initial={{ opacity: 0.9 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-gold-500/8 via-transparent to-maroon-900/25" />
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
          className={`h-full w-full rounded-2xl object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
        />
      )}
      {showLiveDot ? (
        <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-100">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live
        </div>
      ) : null}
    </motion.div>
  )
})
