/**
 * Application Routes
 * Centralized route definitions for maintainability
 */
export const Routes = {
  HOME: '/',
  STUDENT: '/student',
  ADMIN: '/admin',
  SURVEY: '/survey',
  FEEDBACK: '/feedback',
  COURSE: (id) => `/course/${id}`
}

