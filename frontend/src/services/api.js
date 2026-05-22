import axios from 'axios'

/** Direct Render URL (fallback when not using Vercel proxy) */
export const PRODUCTION_API_URL = 'https://nritya-backend-vcgv.onrender.com'

const DEFAULT_DEV_URL = 'http://127.0.0.1:8000'

/**
 * Resolution order:
 * 1. VITE_API_URL (set in Vercel / .env.production)
 * 2. On production + VITE_USE_API_PROXY → /api (same-origin via vercel.json rewrite)
 * 3. On production → Render URL
 * 4. Dev → localhost
 */
function resolveApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  if (import.meta.env.PROD) {
    if (import.meta.env.VITE_USE_API_PROXY === 'true') {
      return '/api'
    }
    return PRODUCTION_API_URL
  }

  return DEFAULT_DEV_URL
}

export const API_BASE_URL = resolveApiBaseUrl()

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90_000,
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isNetwork =
      err.code === 'ERR_NETWORK' ||
      err.message === 'Network Error' ||
      !err.response

    let message =
      err.response?.data?.detail ??
      err.response?.data?.message ??
      err.message ??
      'Request failed'

    if (isNetwork && import.meta.env.PROD) {
      message =
        'Cannot reach the posture server. If this is your first request, wait ~30s for Render to wake up, then try again.'
    }

    return Promise.reject(
      new Error(typeof message === 'string' ? message : JSON.stringify(message))
    )
  }
)

/** Wake Render instance + verify connectivity (call once when studio opens). */
export async function pingBackend() {
  const { data } = await api.get('/')
  return data
}

/**
 * @param {Blob} imageBlob
 */
export async function analyzePostureImage(imageBlob) {
  const form = new FormData()
  form.append('file', imageBlob, 'frame.jpg')
  const { data } = await api.post('/analyze-posture', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
