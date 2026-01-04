import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import Department from '../models/Department.js'
import Course from '../models/Course.js'
import SurveyResponse from '../models/SurveyResponse.js'
import FeedbackResponse from '../models/FeedbackResponse.js'
import { authenticateAdmin } from '../middleware/auth.js'
import { JWT_SECRET } from '../constants/index.js'
import logger from '../utils/logger.js'

const router = express.Router()

// POST /api/admin/login
router.post('/admin/login', async (req, res, next) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Username and password are required' }
      })
    }

    const admin = await Admin.findOne({ username: username.toLowerCase() })
    if (!admin) {
      logger.warn(`Failed login attempt for username: ${username}`)
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      })
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash)
    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for username: ${username}`)
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      })
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    logger.info(`Admin logged in: ${admin.username}`)

    res.json({
      success: true,
      data: { token, username: admin.username }
    })
  } catch (error) {
    logger.error('Error during admin login:', error)
    next(error)
  }
})

// GET /api/admin/departments
router.get('/admin/departments', authenticateAdmin, async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 })
    res.json({
      success: true,
      data: departments
    })
  } catch (error) {
    logger.error('Error fetching departments:', error)
    next(error)
  }
})

// POST /api/admin/departments
router.post('/admin/departments', authenticateAdmin, async (req, res, next) => {
  try {
    const { code, name, active } = req.body

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        error: { message: 'code and name are required' }
      })
    }

    const department = await Department.create({
      code: code.toUpperCase(),
      name,
      active: active !== undefined ? active : true
    })

    logger.info(`Department created: ${department.code} by admin ${req.admin.username}`)

    res.status(201).json({
      success: true,
      data: department
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: { message: 'Department code already exists' }
      })
    }
    logger.error('Error creating department:', error)
    next(error)
  }
})

// PUT /api/admin/departments/:id/toggle
router.put('/admin/departments/:id/toggle', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params

    const department = await Department.findById(id)
    if (!department) {
      return res.status(404).json({
        success: false,
        error: { message: 'Department not found' }
      })
    }

    department.active = !department.active
    await department.save()

    logger.info(`Department ${department.code} toggled to ${department.active ? 'active' : 'inactive'} by admin ${req.admin.username}`)

    res.json({
      success: true,
      data: department
    })
  } catch (error) {
    logger.error('Error toggling department:', error)
    next(error)
  }
})

// POST /api/admin/course
router.post('/admin/course', authenticateAdmin, async (req, res, next) => {
  try {
    const {
      courseCode,
      courseName,
      deptCode,
      semester,
      year,
      surveyQuestions,
      feedbackQuestions,
      isActive
    } = req.body

    if (!courseCode || !courseName || !deptCode || !semester || !year) {
      return res.status(400).json({
        success: false,
        error: { message: 'courseCode, courseName, deptCode, semester, and year are required' }
      })
    }

    // Validate department exists
    const department = await Department.findOne({ code: deptCode.toUpperCase() })
    if (!department) {
      return res.status(404).json({
        success: false,
        error: { message: 'Department not found' }
      })
    }

    const course = await Course.create({
      courseCode: courseCode.toUpperCase(),
      courseName,
      deptCode: deptCode.toUpperCase(),
      semester: parseInt(semester),
      year: parseInt(year),
      surveyQuestions: surveyQuestions || [],
      feedbackQuestions: feedbackQuestions || [],
      isActive: isActive !== undefined ? isActive : true
    })

    logger.info(`Course created: ${course.courseCode} by admin ${req.admin.username}`)

    res.status(201).json({
      success: true,
      data: course
    })
  } catch (error) {
    logger.error('Error creating course:', error)
    next(error)
  }
})

// PUT /api/admin/course/:id
router.put('/admin/course/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const {
      courseCode,
      courseName,
      surveyQuestions,
      feedbackQuestions,
      isActive
    } = req.body

    const course = await Course.findById(id)
    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      })
    }

    if (courseCode) course.courseCode = courseCode.toUpperCase()
    if (courseName) course.courseName = courseName
    if (surveyQuestions !== undefined) course.surveyQuestions = surveyQuestions
    if (feedbackQuestions !== undefined) course.feedbackQuestions = feedbackQuestions
    if (isActive !== undefined) course.isActive = isActive

    await course.save()

    logger.info(`Course updated: ${course.courseCode} by admin ${req.admin.username}`)

    res.json({
      success: true,
      data: course
    })
  } catch (error) {
    logger.error('Error updating course:', error)
    next(error)
  }
})

// GET /api/admin/report
router.get('/admin/report', authenticateAdmin, async (req, res, next) => {
  try {
    const { courseId, deptCode, year, semester } = req.query

    let courses

    if (courseId) {
      courses = await Course.find({ _id: courseId })
    } else if (deptCode && year && semester) {
      courses = await Course.find({
        deptCode: deptCode.toUpperCase(),
        year: parseInt(year),
        semester: parseInt(semester)
      })
    } else {
      return res.status(400).json({
        success: false,
        error: { message: 'Either courseId or (deptCode, year, semester) are required' }
      })
    }

    const reports = await Promise.all(
      courses.map(async (course) => {
        const [surveyResponses, feedbackResponses] = await Promise.all([
          SurveyResponse.find({ courseId: course._id }),
          FeedbackResponse.find({ courseId: course._id })
        ])

        // Calculate survey statistics
        const surveyStats = calculateQuestionStats(surveyResponses, course.surveyQuestions)
        const feedbackStats = calculateQuestionStats(feedbackResponses, course.feedbackQuestions)

        // Get recommendations
        const recommendations = feedbackResponses
          .filter(fr => fr.recommendation && fr.recommendation.trim())
          .map(fr => fr.recommendation.trim())

        return {
          courseId: course._id.toString(),
          courseCode: course.courseCode,
          courseName: course.courseName,
          survey: {
            totalResponses: surveyResponses.length,
            questionStats: surveyStats
          },
          feedback: {
            totalResponses: feedbackResponses.length,
            questionStats: feedbackStats,
            recommendations
          }
        }
      })
    )

    logger.info(`Report generated by admin ${req.admin.username}`)

    res.json({
      success: true,
      data: reports
    })
  } catch (error) {
    logger.error('Error generating report:', error)
    next(error)
  }
})

// Helper function to calculate question statistics
function calculateQuestionStats (responses, questions) {
  const stats = {}

  questions.forEach(question => {
    const questionResponses = responses
      .flatMap(r => r.answers)
      .filter(a => a.questionId === question.questionId)
      .map(a => a.value)

    if (questionResponses.length === 0) {
      stats[question.questionId] = {
        questionText: question.text,
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
      return
    }

    const sum = questionResponses.reduce((a, b) => a + b, 0)
    const average = sum / questionResponses.length

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    questionResponses.forEach(value => {
      distribution[value] = (distribution[value] || 0) + 1
    })

    stats[question.questionId] = {
      questionText: question.text,
      average: parseFloat(average.toFixed(2)),
      count: questionResponses.length,
      distribution
    }
  })

  return stats
}

export default router

