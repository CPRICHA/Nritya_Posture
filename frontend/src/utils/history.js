export function shouldRecordPose(lastPose, nextPose) {
  if (!nextPose || nextPose === '—' || nextPose === 'none') return false
  if (!lastPose || lastPose === '—') return true
  return lastPose.toLowerCase() !== nextPose.toLowerCase()
}
