/**
 * Legacy Constants File
 * @deprecated Use constants/index.js instead
 * This file is kept for backward compatibility
 */

// Likert Scale Enum
export const LikertScale = {
  STRONGLY_DISAGREE: 1,
  DISAGREE: 2,
  NEUTRAL: 3,
  AGREE: 4,
  STRONGLY_AGREE: 5
}

// Likert Scale Labels
export const LikertLabels = {
  5: 'Strongly Agree',
  4: 'Agree',
  3: 'Neutral',
  2: 'Disagree',
  1: 'Strongly Disagree',
}

// Student ID Expiry (2 days in milliseconds)
export const STUDENT_ID_EXPIRY_MS = 2 * 24 * 60 * 60 * 1000

// Re-export from new constants structure
export * from './constants/index.js'

