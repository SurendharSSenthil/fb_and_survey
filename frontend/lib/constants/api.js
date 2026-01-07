/**
 * API Endpoints
 * Centralized API endpoint definitions
 */
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login'
  },

  // Student endpoints
  STUDENT: {
    GENERATE_ID: '/api/student/generate-id',
    COURSES: '/api/student/courses',
    STATUS: '/api/student/status',
    SUBMIT: '/api/student/submit'
  },

  // Department endpoints
  DEPARTMENTS: {
    ACTIVE: '/api/departments/active'
  },

  // Admin endpoints
  ADMIN: {
    LOGIN: '/api/admin/login',
    DEPARTMENTS: '/api/admin/departments',
    DEPARTMENT_TOGGLE: (id) => `/api/admin/departments/${id}/toggle`,
    COURSE: '/api/admin/course',
    COURSE_DETAIL: (id) => `/api/admin/course/${id}`,
    COURSE_UPDATE: (id) => `/api/admin/course/${id}`,
    COURSE_DELETE: (id) => `/api/admin/course/${id}`,
    COURSE_SAMPLES: (id) => `/api/admin/course/${id}/samples`,
    COURSE_SAMPLES_SURVEY: (id) => `/api/admin/course/${id}/samples/survey`,
    COURSE_SAMPLES_FEEDBACK: (id) => `/api/admin/course/${id}/samples/feedback`,
    REPORT: '/api/admin/report'
  }
}

