import axios from 'axios'

/** Deployed Render backend — used when VITE_API_URL is unset in production builds */
export const PRODUCTION_API_URL = 'https://nritya-backend-vcgv.onrender.com'

const DEFAULT_DEV_URL = 'http://127.0.0.1:8000'

function resolveApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return import.meta.env.PROD ? PRODUCTION_API_URL : DEFAULT_DEV_URL
}

export const API_BASE_URL = resolveApiBaseUrl()

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
