let csrfToken = null

/** User-facing errors: retain useful backend validation text, hide transport metadata. */
export function userMessage(value, fallback = 'Unable to complete the request.') {
  let message = typeof value === 'string' ? value : value?.message ?? value?.detail ?? fallback
  if (typeof message !== 'string') message = fallback
  message = message.trim()
  // Tolerate legacy callers that still throw HTTP 400: <description>.
  message = message.replace(/^(?:HTTP(?:\/\d(?:\.\d)?)?\s*|Status\s*|Request failed with status code\s*)(?:[1-5]\d\d)(?:\s*(?:[\w -]*))?\s*:\s*/i, '')
  message = message.replace(/^HTTP\s+[1-5]\d\d\s*[-:]?\s*/i, '')
  message = message.replace(/^Request failed with status code\s+[1-5]\d\d\s*[-:]?\s*/i, '')
  if (/^(Failed to fetch|NetworkError|Load failed|Network request failed)/i.test(message))
    return 'Unable to connect to the server. Please try again.'
  if (!message || /^(Internal Server Error|Bad Request|Unauthorized|Forbidden|Not Found|Request failed)$/i.test(message))
    return fallback
  // Do not render internal Java stack traces in a student or staff UI.
  const firstLine = message.split(/\r?\n/)[0].trim()
  return firstLine.length > 320 ? firstLine.slice(0, 317) + '…' : firstLine
}

export async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !csrfToken) {
    let response
    try { response = await fetch('/api/public/csrf', { credentials: 'same-origin' }) }
    catch { throw new Error('Unable to connect to the server. Please try again.') }
    if (!response.ok) throw new Error('Unable to initialize the security check. Please refresh the page.')
    csrfToken = (await response.json()).token
  }
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(!['GET', 'HEAD', 'OPTIONS'].includes(method) ? { 'X-XSRF-TOKEN': csrfToken } : {}),
    ...((options.userActivity || (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !path.startsWith('/auth/login'))) ? { 'X-User-Activity': '1' } : {}),
    ...options.headers,
  }
  const init = { method, credentials: 'same-origin', headers }
  if (options.body !== undefined) init.body = JSON.stringify(options.body)
  let res
  try { res = await fetch('/api' + path, init) }
  catch { throw new Error('Unable to connect to the server. Please try again.') }
  if (!res.ok) {
    let payload = {}
    try { payload = await res.json() } catch { /* may be text or an empty error response */ }
    const fallback = res.status === 401 ? 'Please sign in again.' :
      res.status === 403 ? 'You do not have permission to perform this action.' :
      res.status === 404 ? 'The requested item was not found.' :
      res.status >= 500 ? 'The server could not complete this request. Please try again.' :
      'Unable to complete the request.'
    const raw = typeof payload === 'string' ? payload :
      (payload.detail || payload.message || payload.reason || payload.error || fallback)
    const message = userMessage(raw, fallback)
    if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/me') &&
        !path.startsWith('/student/') && !path.startsWith('/public/')) {
      window.dispatchEvent(new CustomEvent('dccmp-session-expired', { detail: message }))
    }
    const error = new Error(message)
    error.status = res.status // for application logic; never displayed
    throw error
  }
  const type = res.headers.get('content-type') || ''
  return (type.includes('application/pdf') || type.includes('spreadsheetml') || type.includes('application/octet-stream'))
    ? res.blob() : type.includes('json') ? res.json() : res.text()
}
export async function downloadPdf(path, filename) {
  const blob = await api(path)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
