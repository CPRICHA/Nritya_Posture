import { motion } from 'framer-motion'

const MANDALA_SRC = '/mandala-ornament.png'

/** Half-mandalas peeking from left/right edges only — subtle background framing */
export function MandalaBackdrop() {
  return (
    <div className="bg-atmosphere" aria-hidden>
      <div className="bg-pattern" />

      {/* Left half-mandala — center anchored on left edge */}
      <div className="mandala-half mandala-half-left">
        <motion.img
          src={MANDALA_SRC}
          alt=""
          className="mandala-ornament mandala-ornament-side"
          draggable={false}
          animate={{ opacity: [0.09, 0.12, 0.09] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Right half-mandala — center anchored on right edge */}
      <div className="mandala-half mandala-half-right">
        <motion.img
          src={MANDALA_SRC}
          alt=""
          className="mandala-ornament mandala-ornament-side"
          draggable={false}
          animate={{ opacity: [0.09, 0.12, 0.09] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="sparkle-field" />

      <motion.div
        className="glow-orb absolute -left-[18%] top-[2%] h-[min(82vh,760px)] w-[72vw] bg-maroon-800/25"
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.04, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="glow-orb absolute -right-[12%] top-[28%] h-[min(65vh,580px)] w-[58vw] bg-maroon-900/30"
        animate={{ opacity: [0.22, 0.4, 0.22] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="glow-orb absolute left-1/2 top-[30%] h-[min(55vh,460px)] w-[55vw] -translate-x-1/2 bg-gold-600/8"
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
