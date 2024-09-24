export function getSessionToken(cookieString) {
  const cookies = cookieString.split('; ')
  for (let cookie of cookies) {
    if (cookie.startsWith('session_token=')) {
      return decodeURIComponent(cookie.split('=')[1])
    }
  }
  return null // Return null if session_token is not found
}
