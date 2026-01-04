/**
 * Backend Error and Success Messages
 */
export const ErrorMessages = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid credentials',
  UNAUTHORIZED: 'Unauthorized access',
  TOKEN_REQUIRED: 'Token is required',
  TOKEN_INVALID: 'Invalid token',
  
  // Validation
  REQUIRED_FIELD: (field) => `${field} is required`,
  INVALID_INPUT: 'Invalid input provided',
  
  // Resources
  NOT_FOUND: (resource) => `${resource} not found`,
  ALREADY_EXISTS: (resource) => `${resource} already exists`,
  
  // Student
  STUDENT_ID_GENERATION_FAILED: 'Failed to generate student ID',
  SUBMISSION_FAILED: 'Failed to submit response',
  
  // Admin
  ADMIN_NOT_FOUND: 'Admin not found',
  DEPT_NOT_FOUND: 'Department not found',
  COURSE_NOT_FOUND: 'Course not found',
  DEPT_ALREADY_EXISTS: 'Department code already exists',
  
  // Server
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database error occurred'
}

export const SuccessMessages = {
  LOGIN_SUCCESS: 'Login successful',
  DEPT_CREATED: 'Department created successfully',
  DEPT_UPDATED: 'Department updated successfully',
  COURSE_CREATED: 'Course created successfully',
  COURSE_UPDATED: 'Course updated successfully',
  SUBMISSION_SUCCESS: 'Response submitted successfully'
}

export const ValidationMessages = {
  REQUIRED: {
    USERNAME: 'Username is required',
    PASSWORD: 'Password is required',
    DEPT_CODE: 'Department code is required',
    DEPT_NAME: 'Department name is required',
    COURSE_CODE: 'Course code is required',
    COURSE_NAME: 'Course name is required',
    DEPT_CODE_PARAM: 'deptCode is required',
    YEAR: 'Year is required',
    SEMESTER: 'Semester is required',
    STUDENT_ID: 'Student ID is required',
    COURSE_ID: 'Course ID is required'
  },
  INVALID: {
    YEAR: 'Invalid year',
    SEMESTER: 'Invalid semester (must be 1-8)',
    LIKERT_VALUE: 'Invalid Likert scale value (must be 1-5)'
  }
}

