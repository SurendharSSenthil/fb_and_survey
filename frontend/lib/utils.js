import { STORAGE_KEYS, STUDENT_ID_EXPIRY_MS } from './constants.js'

/**
 * Get student session from localStorage
 */
export const getStudentSession = () => {
  if (typeof window === 'undefined') return null

  try {
    const sessionStr = localStorage.getItem(STORAGE_KEYS.STUDENT_SESSION)
    if (!sessionStr) return null

    const session = JSON.parse(sessionStr)
    const now = Date.now()

    // Check if session is expired
    if (now - session.issuedAt > STUDENT_ID_EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEYS.STUDENT_SESSION)
      return null
    }

    return session
  } catch (error) {
    localStorage.removeItem(STORAGE_KEYS.STUDENT_SESSION)
    return null
  }
}

/**
 * Save student session to localStorage
 */
export const saveStudentSession = (studentId, issuedAt) => {
  if (typeof window === 'undefined') return

  const session = { studentId, issuedAt }
  localStorage.setItem(STORAGE_KEYS.STUDENT_SESSION, JSON.stringify(session))
}

/**
 * Clear student session
 */
export const clearStudentSession = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.STUDENT_SESSION)
}

/**
 * Check if session is expired
 */
export const isSessionExpired = (issuedAt) => {
  if (!issuedAt) return true
  const now = Date.now()
  return (now - issuedAt) > STUDENT_ID_EXPIRY_MS
}

