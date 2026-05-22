import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  })
}

function statusDot(score) {
  if (score == null) return 'bg-cream-muted/40'
  if (score >= 80) return 'bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.45)]'
  if (score >= 60) return 'bg-gold-400/90 shadow-[0_0_8px_rgba(212,175,55,0.4)]'
  return 'bg-maroon-600/90'
}

export function PoseHistory({ items = [], onClear }) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="history-section mt-10 sm:mt-12 lg:mt-14"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <p className="label-caps">Session History</p>
        {items.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="btn-gold-ghost flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-cream-muted hover:text-cream"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear History
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-cream-muted/80">
          Your practice timeline appears here as poses are recognized.
        </p>
      ) : (
        <ul className="history-timeline -mx-1 flex gap-4 overflow-x-auto overscroll-x-contain px-1 pb-2 pt-1 [-webkit-overflow-scrolling:touch] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.25 }}
              className="history-tile min-w-[10.5rem] shrink-0 sm:min-w-0"
            >
              <div className="history-thumb-wrap relative overflow-hidden rounded-xl">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                  />
                ) : (
                  <div className="aspect-[4/3] w-full bg-maroon-950/60" />
                )}
                <span
                  className={`absolute right-2.5 top-2.5 h-2 w-2 rounded-full ${statusDot(item.posture_score)}`}
                />
              </div>
              <p className="mt-3 truncate font-display text-lg capitalize leading-tight text-cream">
                {item.pose}
              </p>
              <p className="mt-1.5 text-xs leading-snug text-cream-muted/85">
                Score {item.posture_score ?? '—'}% · {Math.round((item.confidence ?? 0) * 100)}% conf.
              </p>
              <p className="mt-1 text-[11px] tracking-wide text-gold-500/65">{formatTime(item.timestamp)}</p>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.section>
  )
}
