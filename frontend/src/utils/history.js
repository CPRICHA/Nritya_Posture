import { LOCK_CONFIDENCE } from './predictionBuffer'

export function shouldRecordPose(lastPose, nextPose, confidence = 1) {
  if (confidence < LOCK_CONFIDENCE) return false
  if (!nextPose || nextPose === '—' || nextPose === 'none') return false
  if (!lastPose || lastPose === '—') return true
  return lastPose.toLowerCase() !== nextPose.toLowerCase()
}
