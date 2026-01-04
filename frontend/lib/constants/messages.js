/**
 * User-facing Messages
 * Centralized message definitions for consistency
 */
export const Messages = {
  // General
  LOADING: 'Loading...',
  ERROR_GENERIC: 'An error occurred. Please try again.',
  
  // Student
  STUDENT_SELECT_DEPT: 'Please select a department',
  STUDENT_LOADING_COURSES: 'Loading courses...',
  STUDENT_NO_COURSES: 'No active courses found for the selected criteria',
  STUDENT_SELECT_INFO: 'Please select your department, year, and semester to begin',
  
  // Survey/Feedback
  SURVEY_LOADING: 'Loading survey...',
  FEEDBACK_LOADING: 'Loading feedback form...',
  SURVEY_ANSWER_REQUIRED: 'Please answer at least one question',
  FEEDBACK_ANSWER_REQUIRED: 'Please answer at least one question',
  SURVEY_SUBMIT_SUCCESS: 'Survey submitted successfully',
  FEEDBACK_SUBMIT_SUCCESS: 'Feedback submitted successfully',
  
  // Course
  COURSE_NOT_FOUND: 'Course not found',
  COURSE_NOT_FOUND_DESC: 'Please go back and select a course again.',
  COURSE_LOADING: 'Loading course data...',
  
  // Admin
  ADMIN_LOGIN_REQUIRED: 'Please login to continue',
  ADMIN_LOGIN_FAILED: 'Login failed',
  ADMIN_DEPT_CREATE_SUCCESS: 'Department created successfully',
  ADMIN_COURSE_CREATE_SUCCESS: 'Course created successfully',
  ADMIN_COURSE_UPDATE_SUCCESS: 'Course updated successfully',
  
  // Validation
  VALIDATION_REQUIRED_FIELDS: 'Please fill in all required fields',
  VALIDATION_DEPT_REQUIRED: 'Please select a department',
  VALIDATION_COURSE_CODE_REQUIRED: 'Course code is required',
  VALIDATION_COURSE_NAME_REQUIRED: 'Course name is required',
  
  // System
  SYSTEM_NAME: 'Course Feedback & Survey System',
  WELCOME_MESSAGE: 'Welcome',
  WELCOME_SELECT_ROLE: 'Please select your role to continue'
}

export const ErrorMessages = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.'
}

