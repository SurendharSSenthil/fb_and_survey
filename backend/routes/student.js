import express from 'express'
import Department from '../models/Department.js'
import Course from '../models/Course.js'
import SurveyResponse from '../models/SurveyResponse.js'
import FeedbackResponse from '../models/FeedbackResponse.js'
import Student from '../models/Student.js'
import { generateStudentId } from '../utils/studentIdGenerator.js'
import logger from '../utils/logger.js'

const router = express.Router()

// GET /api/departments/active
router.get('/departments/active', async (req, res, next) => {
  console.log('Fetching active departments')
  try {
    const departments = await Department.find({ active: true })
      .select('code name')
      .sort({ name: 1 })

    logger.info(`Fetched ${departments.length} active departments`)
    res.json({
      success: true,
      data: departments
    })
  } catch (error) {
    logger.error('Error fetching active departments:', error)
    next(error)
  }
})

// POST /api/student/generate-id
router.post('/student/generate-id', async (req, res, next) => {
  try {
    const { deptCode, year, semester } = req.body

    // Validation
    if (!deptCode || !year || !semester) {
      return res.status(400).json({
        success: false,
        error: { message: 'deptCode, year, and semester are required' }
      })
    }

    if (semester < 1 || semester > 8) {
      return res.status(400).json({
        success: false,
        error: { message: 'Semester must be valid' }
      })
    }

    // Validate department exists and is active
    const department = await Department.findOne({ code: deptCode.toUpperCase(), active: true })
    if (!department) {
      return res.status(404).json({
        success: false,
        error: { message: 'Department not found or inactive' }
      })
    }

    const studentId = await generateStudentId(
      deptCode.toUpperCase(),
      parseInt(year),
      parseInt(semester)
    )

    const defaultPassword = 'Student'

    try {
      await Student.create({
        studentId,
        password: defaultPassword,
        deptCode: deptCode.toUpperCase(),
        year: parseInt(year),
        semester: parseInt(semester)
      })
    } catch (error) {
      if (error.code !== 11000) {
        throw error
      }
    }

    logger.info(`Generated student ID: ${studentId}`)

    res.json({
      success: true,
      data: {
        studentId,
        password: defaultPassword,
        issuedAt: Date.now()
      }
    })
  } catch (error) {
    logger.error('Error generating student ID:', error)
    next(error)
  }
})

// GET /api/student/courses
router.get('/student/courses', async (req, res, next) => {
  try {
    const { deptCode, year, semester } = req.query

    if (!deptCode || !year || !semester) {
      return res.status(400).json({
        success: false,
        error: { message: 'deptCode, year, and semester are required' }
      })
    }

    const courses = await Course.find({
      deptCode: deptCode.toUpperCase(),
      year: parseInt(year),
      semester: parseInt(semester),
      isActive: true
    }).select('_id courseCode courseName surveyQuestions feedbackQuestions')

    logger.info(`Fetched ${courses.length} active courses for ${deptCode}/${year}/${semester}`)

    res.json({
      success: true,
      data: courses
    })
  } catch (error) {
    logger.error('Error fetching courses:', error)
    next(error)
  }
})

// GET /api/student/status
router.get('/student/status', async (req, res, next) => {
  try {
    const { studentId, deptCode, year, semester } = req.query

    if (!studentId || !deptCode || !year || !semester) {
      return res.status(400).json({
        success: false,
        error: { message: 'studentId, deptCode, year, and semester are required' }
      })
    }

    // Get all courses for this dept/year/semester
    const courses = await Course.find({
      deptCode: deptCode.toUpperCase(),
      year: parseInt(year),
      semester: parseInt(semester),
      isActive: true
    }).select('_id courseCode courseName')

    // Check submission status for each course
    const courseIds = courses.map(c => c._id)

    const [surveySubmissions, feedbackSubmissions] = await Promise.all([
      SurveyResponse.find({ courseId: { $in: courseIds }, studentId }).select('courseId'),
      FeedbackResponse.find({ courseId: { $in: courseIds }, studentId }).select('courseId')
    ])

    const submittedSurveyIds = new Set(surveySubmissions.map(s => s.courseId.toString()))
    const submittedFeedbackIds = new Set(feedbackSubmissions.map(f => f.courseId.toString()))

    const status = courses.map(course => ({
      courseId: course._id.toString(),
      courseCode: course.courseCode,
      courseName: course.courseName,
      surveySubmitted: submittedSurveyIds.has(course._id.toString()),
      feedbackSubmitted: submittedFeedbackIds.has(course._id.toString())
    }))

    logger.info(`Fetched status for student ${studentId}`)

    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    logger.error('Error fetching student status:', error)
    next(error)
  }
})

// POST /api/student/submit
router.post('/student/submit', async (req, res, next) => {
  try {
    const { studentId, courseId, surveyAnswers, feedbackAnswers, recommendation } = req.body

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        error: { message: 'studentId and courseId are required' }
      })
    }

    // Validate course exists
    const course = await Course.findById(courseId)
    if (!course || !course.isActive) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found or inactive' }
      })
    }

    // Validate question IDs exist in course
    const validateQuestionIds = (answers, questions) => {
      const questionIds = new Set(questions.map(q => q.questionId))
      return answers.every(a => questionIds.has(a.questionId))
    }

    // Submit survey
    if (surveyAnswers && surveyAnswers.length > 0) {
      if (surveyAnswers.length !== (course.surveyQuestions?.length || 0)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Please answer all survey questions' }
        })
      }

      // Validate question IDs
      if (!validateQuestionIds(surveyAnswers, course.surveyQuestions)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid survey question IDs' }
        })
      }

      // Validate Likert scale values
      const invalidValues = surveyAnswers.some(a => a.value < 1 || a.value > 5)
      if (invalidValues) {
        return res.status(400).json({
          success: false,
          error: { message: 'Survey answers must be between 1 and 5' }
        })
      }

      // Check for duplicate submission
      const existing = await SurveyResponse.findOne({ courseId, studentId })
      if (existing) {
        return res.status(409).json({
          success: false,
          error: { message: 'Survey already submitted for this course' }
        })
      }

      await SurveyResponse.create({
        courseId,
        studentId,
        answers: surveyAnswers
      })

      logger.info(`Survey submitted for course ${courseId} by student ${studentId}`)
    }

    // Submit feedback
    if (feedbackAnswers && feedbackAnswers.length > 0) {
      if (feedbackAnswers.length !== (course.feedbackQuestions?.length || 0)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Please answer all feedback questions' }
        })
      }

      // Validate question IDs
      if (!validateQuestionIds(feedbackAnswers, course.feedbackQuestions)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid feedback question IDs' }
        })
      }

      // Validate Likert scale values
      const invalidValues = feedbackAnswers.some(a => a.value < 1 || a.value > 5)
      if (invalidValues) {
        return res.status(400).json({
          success: false,
          error: { message: 'Feedback answers must be between 1 and 5' }
        })
      }

      // Check for duplicate submission
      const existing = await FeedbackResponse.findOne({ courseId, studentId })
      if (existing) {
        return res.status(409).json({
          success: false,
          error: { message: 'Feedback already submitted for this course' }
        })
      }

      await FeedbackResponse.create({
        courseId,
        studentId,
        answers: feedbackAnswers,
        recommendation: recommendation || ''
      })

      logger.info(`Feedback submitted for course ${courseId} by student ${studentId}`)
    }

    res.json({
      success: true,
      message: 'Submission successful'
    })
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(409).json({
        success: false,
        error: { message: 'Already submitted for this course' }
      })
    }
    logger.error('Error submitting response:', error)
    next(error)
  }
})

export default router

