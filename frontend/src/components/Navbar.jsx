import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info } from 'lucide-react'

const LOGO_SRC = '/logo-dancer.png'

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="nav-ref sticky top-0 z-50 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8 md:py-5">
        <button
          type="button"
          onClick={() => scrollToId('hero')}
          className="group flex items-center gap-3.5 text-left"
        >
          <div className="logo-mark-wrap relative shrink-0">
            <motion.img
              src={LOGO_SRC}
              alt="NrityaAI"
              className="logo-mark relative z-10 h-12 w-12 rounded-full object-cover"
              whileHover={{ scale: 1.04 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            />
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold tracking-[0.12em] text-gradient-gold md:text-xl">
              NRITYAAI
            </p>
            <p className="mt-0.5 hidden text-[10px] tracking-[0.08em] text-cream-muted/90 min-[400px]:block sm:text-[11px]">
              Preserving Art. Empowering Talent.
            </p>
          </div>
        </button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => scrollToId('about')}
          className="btn-gold-ghost hidden items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-cream md:flex"
        >
          <Info className="h-3.5 w-3.5 text-gold-400" strokeWidth={1.75} />
          About Us
        </motion.button>

        <button
          type="button"
          aria-label="Menu"
          className="btn-gold-ghost rounded-lg px-3 py-2 text-sm text-cream md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden"
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 px-5 py-4 text-sm text-cream"
              onClick={() => {
                scrollToId('about')
                setOpen(false)
              }}
            >
              <Info className="h-4 w-4 text-gold-400" />
              About Us
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
