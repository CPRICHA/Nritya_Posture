import { motion } from 'framer-motion'

export function Loader({ label = 'Analyzing…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <motion.div
        className="h-14 w-14 rounded-full border-2 border-gold-500/25 border-t-gold-300 shadow-[0_0_28px_rgba(212,175,55,0.22)]"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
      />
      <motion.p
        className="text-sm tracking-wide text-cream-muted"
        animate={{ opacity: [0.65, 1, 0.65] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
      >
        {label}
      </motion.p>
    </div>
  )
}
