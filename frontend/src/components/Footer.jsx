import { motion } from 'framer-motion'

export function Footer() {
  return (
    <footer className="footer-ref relative py-14 md:py-16">
      <motion.div
        className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 text-center"
        initial={{ opacity: 0.5, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <div className="footer-divider-ref" aria-hidden />
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 md:gap-10">
          <span
            className="hidden text-2xl sm:inline md:text-3xl"
            style={{ filter: 'drop-shadow(0 0 14px rgba(212,175,55,0.5))' }}
            aria-hidden
          >
            🪔
          </span>
          <p className="max-w-md px-2 font-serif text-sm italic leading-relaxed text-gold-300/90 sm:px-0 md:text-base">
            Practice with awareness. Let AI guide you, and tradition inspire you.
          </p>
          <span
            className="hidden text-2xl sm:inline md:text-3xl"
            style={{ filter: 'drop-shadow(0 0 14px rgba(212,175,55,0.5))' }}
            aria-hidden
          >
            🪔
          </span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-gold-500/50">NrityaAI</p>
      </motion.div>
    </footer>
  )
}
