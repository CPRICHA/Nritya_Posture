import axios from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45_000,
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail ??
      err.response?.data?.message ??
      err.message ??
      'Request failed'
    return Promise.reject(
      new Error(typeof message === 'string' ? message : JSON.stringify(message))
    )
  }
)

/**
 * @param {Blob} imageBlob
 * @returns {Promise<{ pose: string, confidence: number, matched: boolean, posture_score: number, feedback: string[] } | { error: string }>}
 */
export async function analyzePostureImage(imageBlob) {
  const form = new FormData()
  form.append('file', imageBlob, 'frame.jpg')
  const { data } = await api.post('/analyze-posture', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
