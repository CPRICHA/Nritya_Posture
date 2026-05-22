import { AnimatePresence, motion } from 'framer-motion'
import { Check, Lock } from 'lucide-react'
import { ConfidenceBar } from './ConfidenceBar'
import { Loader } from './Loader'

function ScoreRing({ score, idle = false }) {
  const value = score != null ? Math.min(100, Math.max(0, Math.round(Number(score)))) : null
  const r = 50
  const c = 2 * Math.PI * r
  const offset = value != null ? c - (value / 100) * c : c

  return (
    <div
      className={`score-ring-ref relative h-[7.5rem] w-[7.5rem] shrink-0 sm:h-[8.5rem] sm:w-[8.5rem] ${idle ? 'opacity-70' : ''}`}
    >
      <svg className="h-full w-full -rotate-90" viewBox="0 0 116 116">
        <circle cx="58" cy="58" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        {value != null ? (
          <motion.circle
            cx="58"
            cy="58"
            r={r}
            fill="none"
            stroke="url(#scoreGradRef)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: 'spring', stiffness: 70, damping: 18 }}
          />
        ) : (
          <circle
            cx="58"
            cy="58"
            r={r}
            fill="none"
            stroke="rgba(212,175,55,0.15)"
            strokeWidth="8"
            strokeDasharray="8 12"
          />
        )}
        <defs>
          <linearGradient id="scoreGradRef" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6b1f32" />
            <stop offset="45%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#f6d873" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl text-gradient-gold sm:text-4xl">
          {value != null ? value : '—'}
        </span>
        <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-cream-muted/80">
          Posture Score
        </span>
      </div>
    </div>
  )
}

function AwaitingPose() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-10 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="h-20 w-20 rounded-full border border-gold-500/20 bg-gold-500/5"
        animate={{
          boxShadow: [
            '0 0 24px rgba(212,175,55,0.08)',
            '0 0 48px rgba(212,175,55,0.18)',
            '0 0 24px rgba(212,175,55,0.08)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <p className="mt-6 font-display text-2xl text-cream/90 sm:text-3xl">Awaiting Pose</p>
      <p className="mt-2 max-w-xs text-sm text-cream-muted/85">
        Step into frame or upload an image — your guru will begin coaching shortly.
      </p>
    </motion.div>
  )
}

export function ResultCard({
  pose,
  matched,
  confidence,
  postureScore,
  feedback = [],
  loading = false,
  loaderLabel = 'Reading your posture…',
  modelLoaded = true,
  predictedPose = null,
  poseLocked = false,
  locked = false,
}) {
  const isLockedState = poseLocked || locked
  const list = Array.isArray(feedback) ? feedback : []
  const isAwaiting = !pose || pose === '—'
  const isNone = pose?.toLowerCase() === 'none'
  const displayPose = isAwaiting ? null : isNone ? 'Unrecognized' : pose
  const goodAlignment = matched && (postureScore == null || postureScore >= 70)
  const hint =
    modelLoaded === false
      ? 'ML pose model is not loaded on the server — run ensure_model.py on deploy.'
      : isNone && predictedPose
        ? `Closest match: ${predictedPose} (${Math.round(confidence * 100)}% confidence — need 60%+)`
        : isNone
          ? 'Pose detected, but confidence was below 60%.'
          : null

  return (
    <motion.div
      layout
      className={`panel-readout h-full p-5 sm:p-7 md:p-8 ${isLockedState ? 'panel-readout-locked' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="label-caps">AI Posture Readout</p>
        {isLockedState ? (
          <motion.span
            key="locked-badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="pose-locked-badge inline-flex items-center gap-1.5"
          >
            <Lock className="h-3 w-3" strokeWidth={2.25} />
            Pose Locked
          </motion.span>
        ) : null}
      </div>

      {isAwaiting && !loading ? (
        <AwaitingPose />
      ) : (
        <>
          <div className="mt-5 min-w-0">
            {displayPose ? (
              <motion.h3
                key={displayPose}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className={`font-display text-[clamp(1.75rem,4vw,2.85rem)] font-semibold capitalize leading-[1.15] tracking-wide text-cream ${isLockedState ? 'readout-pose-locked' : ''}`}
              >
                {displayPose}
              </motion.h3>
            ) : null}
            {displayPose && goodAlignment ? (
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/16 px-3.5 py-1.5 text-xs font-semibold text-emerald-100/95 ring-1 ring-emerald-400/35">
                <Check className="h-3.5 w-3.5 shrink-0" />
                Good alignment
              </span>
            ) : displayPose ? (
              <span className="mt-4 inline-flex rounded-full bg-gold-500/10 px-3.5 py-1.5 text-xs font-medium text-gold-200/95 ring-1 ring-gold-500/25">
                Refine alignment
              </span>
            ) : null}
            {hint ? (
              <p className="mt-3 max-w-md text-sm leading-relaxed text-cream-muted/85">{hint}</p>
            ) : null}
          </div>

          <div className="readout-metrics mt-8 flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
            <ScoreRing score={postureScore} idle={isAwaiting} />
            <div className="w-full min-w-0 flex-1 sm:max-w-md">
              <ConfidenceBar value={Number(confidence) || 0} />
            </div>
          </div>

          {loading && !isLockedState ? <Loader label={loaderLabel} shimmer /> : null}

          <div className="soft-separator mt-8" />

          <div className="mt-7">
            <p className="label-caps text-gold-400/80">Coach notes</p>
            <ul className="mt-4 space-y-2.5">
              <AnimatePresence initial={false} mode="popLayout">
                {list.length === 0 && !loading ? (
                  <motion.li
                    key="empty"
                    className="text-sm leading-relaxed text-cream-muted/85"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Nuanced alignment cues will appear here as you practice.
                  </motion.li>
                ) : (
                  list.map((t, i) => (
                    <motion.li
                      key={`${i}-${t}`}
                      layout
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="coach-note-soft flex gap-3 rounded-xl px-4 py-3 text-sm leading-relaxed text-cream/95"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500/20">
                        <Check className="h-3 w-3 text-gold-300" strokeWidth={2.5} />
                      </span>
                      <span>{t}</span>
                    </motion.li>
                  ))
                )}
              </AnimatePresence>
            </ul>
            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-cream-muted/75">
              <span className="text-gold-500/60">✿</span>
              Stay in position for best results
            </p>
          </div>
        </>
      )}
    </motion.div>
  )
}
