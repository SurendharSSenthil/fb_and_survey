/**
 * LocalStorage Keys
 * Centralized storage key definitions
 */
export const STORAGE_KEYS = {
  STUDENT_SESSION: 'studentSession',
  ADMIN_TOKEN: 'adminToken',
  COURSE_DATA: (courseId) => `course_${courseId}`
}

