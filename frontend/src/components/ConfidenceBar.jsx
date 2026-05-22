import { motion } from 'framer-motion'

export function ConfidenceBar({ value, className = '' }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold-400/85">
          Confidence
        </span>
        <span className="font-display text-xl font-semibold text-gold-300">{pct}%</span>
      </div>
      <div className="confidence-track-ref h-3 overflow-hidden rounded-full">
        <motion.div
          className="confidence-fill-ref h-full rounded-full"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 22, mass: 0.6 }}
        />
      </div>
    </div>
  )
}
