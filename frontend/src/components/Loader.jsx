import { motion } from 'framer-motion'

export function Loader({ label = 'Analyzing…', shimmer = false }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <div className="relative">
        {shimmer ? (
          <motion.div
            className="loader-shimmer-ring absolute inset-0 rounded-full"
            animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            aria-hidden
          />
        ) : null}
        <motion.div
          className={`relative h-14 w-14 rounded-full border-2 border-gold-500/25 border-t-gold-300 shadow-[0_0_28px_rgba(212,175,55,0.22)] ${shimmer ? 'loader-spin-gold' : ''}`}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        />
      </div>
      <motion.p
        className="text-sm tracking-wide text-cream-muted"
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
      >
        {label}
      </motion.p>
    </div>
  )
}
