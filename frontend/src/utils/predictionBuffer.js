/** Minimum confidence to treat a mudra as locked (0–1 scale from API). */
export const LOCK_CONFIDENCE = 0.6

/**
 * @param {Array<{ pose: string, confidence: number }>} buffer
 * @param {{ pose: string, confidence: number }} sample
 * @param {number} maxLen
 */
export function pushSample(buffer, sample, maxLen = 5) {
  if (!sample?.pose || sample.pose === 'none' || sample.pose === '—') return buffer
  return [...buffer, sample].slice(-maxLen)
}

/**
 * Majority vote with average confidence per pose label.
 * @param {Array<{ pose: string, confidence: number }>} buffer
 */
export function getMajorityVote(buffer) {
  if (!buffer.length) return null

  const tallies = new Map()
  for (const { pose, confidence } of buffer) {
    const row = tallies.get(pose) ?? { count: 0, confSum: 0 }
    row.count += 1
    row.confSum += confidence
    tallies.set(pose, row)
  }

  let best = null
  let bestWeight = -1

  for (const [pose, { count, confSum }] of tallies) {
    const avgConf = confSum / count
    const weight = count * avgConf
    if (weight > bestWeight) {
      bestWeight = weight
      best = { pose, confidence: avgConf, count }
    }
  }

  return best
}

/**
 * @param {Array<{ pose: string, confidence: number }>} buffer
 * @param {number} minSamples
 */
export function canLockFromBuffer(buffer, minSamples = 2) {
  const vote = getMajorityVote(buffer)
  if (!vote || vote.count < minSamples || vote.confidence < LOCK_CONFIDENCE) return null
  return vote
}
