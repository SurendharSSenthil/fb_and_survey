// Likert Scale Enum
export const LikertScale = {
  STRONGLY_DISAGREE: 1,
  DISAGREE: 2,
  NEUTRAL: 3,
  AGREE: 4,
  STRONGLY_AGREE: 5
}

// Student ID Expiry (2 days in milliseconds)
export const STUDENT_ID_EXPIRY_MS = 2 * 24 * 60 * 60 * 1000

// LocalStorage Keys
export const STORAGE_KEYS = {
  STUDENT_SESSION: 'studentSession'
}

// JWT Secret (should be in .env)
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

