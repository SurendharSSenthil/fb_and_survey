/**
 * Backend API Routes
 * Centralized route definitions
 */
export const API_ROUTES = {
  // Student routes
  STUDENT: {
    GENERATE_ID: '/api/student/generate-id',
    COURSES: '/api/student/courses',
    STATUS: '/api/student/status',
    SUBMIT: '/api/student/submit'
  },
  
  // Department routes
  DEPARTMENTS: {
    ACTIVE: '/api/departments/active'
  },
  
  // Admin routes
  ADMIN: {
    LOGIN: '/api/admin/login',
    DEPARTMENTS: '/api/admin/departments',
    DEPARTMENT_TOGGLE: '/api/admin/departments/:id/toggle',
    COURSE: '/api/admin/course',
    COURSE_DETAIL: '/api/admin/course/:id',
    COURSE_UPDATE: '/api/admin/course/:id',
    COURSE_SAMPLES: '/api/admin/course/:id/samples',
    COURSE_SAMPLES_SURVEY: '/api/admin/course/:id/samples/survey',
    COURSE_SAMPLES_FEEDBACK: '/api/admin/course/:id/samples/feedback',
    REPORT: '/api/admin/report'
  },
  
  // Health check
  HEALTH: '/health',
  API_INFO: '/api'
}

