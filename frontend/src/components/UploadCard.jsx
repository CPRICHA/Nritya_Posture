import { useRef } from 'react'
import { motion } from 'framer-motion'
import { CloudUpload } from 'lucide-react'

export function UploadCard({ onSelect, loading = false }) {
  const inputRef = useRef(null)

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
      className="ref-card group flex min-h-0 flex-col p-6 sm:min-h-[300px] sm:p-8 md:min-h-[360px] md:p-10"
    >
      <div className="icon-box-ref mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
        <CloudUpload className="h-8 w-8 text-gold-300" strokeWidth={1.2} />
      </div>
      <h2 className="mt-7 text-center font-display text-sm font-semibold uppercase tracking-[0.3em] text-cream">
        Upload an Image
      </h2>
      <p className="mt-4 flex-1 text-center text-sm leading-relaxed text-cream-muted/95">
        Capture a still pose from class or rehearsal — receive instant alignment notes from your AI
        guru.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onSelect(file)
        }}
      />
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="btn-gold-ghost mt-8 w-full rounded-full px-6 py-3.5 text-xs font-bold uppercase tracking-[0.24em] text-cream disabled:opacity-50"
      >
        {loading ? 'Analyzing…' : 'Upload Image'}
      </motion.button>
    </motion.div>
  )
}
