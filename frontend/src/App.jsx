import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { HeroSection } from './components/HeroSection'
import { PostureStudio } from './components/PostureStudio'
import { MandalaBackdrop } from './components/MandalaBackdrop'

export default function App() {
  const [studioExpanded, setStudioExpanded] = useState(false)
  const [studioMode, setStudioMode] = useState('live')
  const [pendingUpload, setPendingUpload] = useState(null)
  const [uploadBusy, setUploadBusy] = useState(false)

  const openStudio = useCallback((mode) => {
    setStudioMode(mode)
    setStudioExpanded(true)
    requestAnimationFrame(() => {
      document.getElementById('posture-studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  return (
    <div className="nritya-shell">
      <MandalaBackdrop />

      <div className="relative z-10">
        <Navbar />

        <div className="relative">
          <div className="hero-spotlight" aria-hidden />
          <HeroSection
            onStartLive={() => openStudio('live')}
            onUploadSelect={(file) => {
              setUploadBusy(true)
              setPendingUpload(file)
              openStudio('upload')
            }}
            uploadLoading={uploadBusy}
          />
        </div>

        <PostureStudio
          expanded={studioExpanded}
          mode={studioMode}
          onModeChange={setStudioMode}
          uploadFile={pendingUpload}
          onUploadConsumed={() => {
            setUploadBusy(false)
            setPendingUpload(null)
          }}
        />

        <section id="about" className="mx-auto max-w-3xl scroll-mt-24 px-4 pb-8 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            className="ref-card p-8 text-center md:p-10"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gold-400">About Us</p>
            <h2 className="mt-4 font-display text-2xl text-cream md:text-3xl">
              Classical dance, intelligent guidance
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-cream-muted/95">
              NrityaAI honors Bharatanatyam tradition with a calm, studio-grade experience — helping
              dancers refine araimandi, hastas, and symmetry through thoughtful, real-time coaching.
            </p>
          </motion.div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
