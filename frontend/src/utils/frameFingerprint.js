const SAMPLE_SIZE = 16

/**
 * Fast visual fingerprint for duplicate/static frame skipping.
 * @param {Blob} blob
 */
export async function fingerprintBlob(blob) {
  try {
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = SAMPLE_SIZE
    canvas.height = SAMPLE_SIZE
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      bitmap.close()
      return null
    }
    ctx.drawImage(bitmap, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
    bitmap.close()
    const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
    let hash = 0
    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3
      hash = (hash * 31 + Math.floor(lum)) | 0
    }
    return hash
  } catch {
    return null
  }
}

/** @param {number | null} prev @param {number | null} next @param {number} threshold */
export function isFrameSimilar(prev, next, threshold = 12) {
  if (prev == null || next == null) return false
  const diff = Math.abs(prev - next)
  const scale = Math.max(Math.abs(prev), 1)
  return diff / scale < threshold / 100
}
