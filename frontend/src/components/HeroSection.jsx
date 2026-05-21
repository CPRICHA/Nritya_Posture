import { motion } from 'framer-motion'
import { Crosshair, Shield, Zap, GraduationCap, Sparkles } from 'lucide-react'
import { UploadCard } from './UploadCard'

const features = [
  { icon: Shield, label: 'High Accuracy', desc: 'Precise pose detection' },
  { icon: Zap, label: 'Real-time', desc: 'Live coaching flow' },
  { icon: GraduationCap, label: 'Coaching', desc: 'Expert alignment notes' },
  { icon: Sparkles, label: 'Cultural', desc: 'Classical authenticity' },
]

export function HeroSection({ onStartLive, onUploadSelect, uploadLoading }) {
  return (
    <section id="hero" className="relative scroll-mt-20">
      <div className="relative mx-auto max-w-6xl px-3 pb-6 pt-6 sm:px-4 sm:pt-8 md:px-8 md:pb-10 md:pt-14">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="relative text-center"
        >
          <h1 className="hero-title-ref mx-auto max-w-5xl text-gradient-gold">
            AI Bharatanatyam Posture Analysis
          </h1>
          <div className="diamond-divider" aria-hidden>
            <span>◆</span>
          </div>
          <p className="hero-subtitle-ref mx-auto max-w-xl">Your AI Guru for Perfect Posture</p>
          <p className="hero-choose-label">Choose an option</p>
        </motion.div>

        <motion.div
          className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-5 sm:mt-10 sm:gap-7 md:grid-cols-2 md:gap-8"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } } }}
        >
          <UploadCard onSelect={onUploadSelect} loading={uploadLoading} />
          <motion.div
            variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
            className="ref-card group flex min-h-0 flex-col p-6 sm:min-h-[300px] sm:p-8 md:min-h-[360px] md:p-10"
          >
            <div className="icon-box-ref mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
              <Crosshair className="h-8 w-8 text-gold-300" strokeWidth={1.2} />
            </div>
            <h2 className="mt-7 text-center font-display text-sm font-semibold uppercase tracking-[0.3em] text-cream">
              Start Live Analysis
            </h2>
            <p className="mt-4 flex-1 text-center text-sm leading-relaxed text-cream-muted/95">
              Open your camera for real-time posture coaching with gentle, stable guidance as you
              practice.
            </p>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStartLive}
              className="btn-gold-solid mt-8 w-full rounded-full px-6 py-3.5 text-xs font-bold uppercase tracking-[0.24em] text-maroon-950"
            >
              Start Live Analysis
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="feature-strip mx-auto mt-14 max-w-4xl rounded-2xl px-4 py-5 md:px-8 md:py-6"
        >
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="text-center">
                <Icon className="mx-auto h-5 w-5 text-gold-400/90" strokeWidth={1.4} />
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-300/95 md:text-xs">
                  {label}
                </p>
                <p className="mt-1 hidden text-[11px] text-cream-muted/80 sm:block">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
