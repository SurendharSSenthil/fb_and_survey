import express from 'express'
import jwt from 'jsonwebtoken'
import PDFDocument from 'pdfkit'
import Admin from '../models/Admin.js'
import Department from '../models/Department.js'
import Course from '../models/Course.js'
import SurveyResponse from '../models/SurveyResponse.js'
import FeedbackResponse from '../models/FeedbackResponse.js'
import { authenticateAdmin } from '../middleware/auth.js'
import { JWT_SECRET } from '../constants/index.js'
import { STANDARD_FEEDBACK_QUESTIONS } from '../constants/feedbackQuestions.js'
import { LikertLabels } from '../constants/index.js'
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

    if (password !== admin.password) {
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
    console.log(courseCode,
      courseName,
      deptCode,
      semester,
      year, req.body)
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
      feedbackQuestions: (feedbackQuestions && feedbackQuestions.length > 0) ? feedbackQuestions : STANDARD_FEEDBACK_QUESTIONS,
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
    if (feedbackQuestions !== undefined) {
      course.feedbackQuestions = (feedbackQuestions && feedbackQuestions.length > 0) ? feedbackQuestions : STANDARD_FEEDBACK_QUESTIONS
    }
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

// DELETE /api/admin/course/:id
router.delete('/admin/course/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params

    const course = await Course.findById(id)
    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      })
    }

    await Promise.all([
      SurveyResponse.deleteMany({ courseId: course._id }),
      FeedbackResponse.deleteMany({ courseId: course._id })
    ])

    await Course.deleteOne({ _id: course._id })

    logger.info(`Course deleted: ${course.courseCode} by admin ${req.admin.username}`)

    return res.json({
      success: true,
      data: { courseId: course._id.toString() }
    })
  } catch (error) {
    logger.error('Error deleting course:', error)
    next(error)
  }
})

// GET /api/admin/course/:id
router.get('/admin/course/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params

    const course = await Course.findById(id)
    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      })
    }

    const [surveyResponses, feedbackResponses] = await Promise.all([
      SurveyResponse.find({ courseId: course._id }),
      FeedbackResponse.find({ courseId: course._id })
    ])

    // Calculate survey statistics
    const surveyStats = calculateQuestionStats(surveyResponses, course.surveyQuestions)
    const feedbackStats = calculateQuestionStats(feedbackResponses, course.feedbackQuestions)

    res.json({
      success: true,
      data: {
        courseId: course._id.toString(),
        courseCode: course.courseCode,
        courseName: course.courseName,
        surveyQuestions: course.surveyQuestions,
        feedbackQuestions: course.feedbackQuestions,
        survey: {
          totalResponses: surveyResponses.length,
          questionStats: surveyStats
        },
        feedback: {
          totalResponses: feedbackResponses.length,
          questionStats: feedbackStats
        }
      }
    })
  } catch (error) {
    logger.error('Error fetching course details:', error)
    next(error)
  }
})

// GET /api/admin/course/:id/samples
router.get('/admin/course/:id/samples', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params

    const course = await Course.findById(id)
    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      })
    }

    // Get 5 random samples from survey and feedback responses
    const [surveySamples, feedbackSamples] = await Promise.all([
      SurveyResponse.aggregate([
        { $match: { courseId: course._id } },
        { $sample: { size: 5 } }
      ]),
      FeedbackResponse.aggregate([
        { $match: { courseId: course._id } },
        { $sample: { size: 5 } }
      ])
    ])

    // Create PDF
    const doc = new PDFDocument({ margin: 50 })

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="course_${course.courseCode}_samples.pdf"`)

    // Pipe PDF to response
    doc.pipe(res)

    // Header
    doc.fontSize(20).font('Helvetica-Bold')
      .text('Course Feedback & Survey Samples', { align: 'center' })
    doc.moveDown()

    doc.fontSize(14).font('Helvetica')
      .text(`Course: ${course.courseCode} - ${course.courseName}`, { align: 'center' })
    doc.moveDown()

    doc.fontSize(10).font('Helvetica-Oblique')
      .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
    doc.moveDown(2)

    // Survey Samples Section
    if (surveySamples.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold')
        .text('SURVEY RESPONSES', { underline: true })
      doc.moveDown()

      surveySamples.forEach((sample, index) => {
        doc.fontSize(12).font('Helvetica-Bold')
          .text(`Sample ${index + 1}`, { underline: true })

        doc.fontSize(10).font('Helvetica')
          .text(`Student ID: ${sample.studentId}`)
          .text(`Submitted At: ${new Date(sample.submittedAt).toLocaleString()}`)
        doc.moveDown(0.5)

        // Map answers to questions
        const questionMap = {}
        course.surveyQuestions.forEach(q => {
          questionMap[q.questionId] = q.text
        })

        doc.fontSize(10).font('Helvetica-Bold')
          .text('Answers:')
        doc.moveDown(0.3)

        sample.answers.forEach((answer, ansIndex) => {
          const questionText = questionMap[answer.questionId] || `Question ${answer.questionId}`
          const answerLabel = LikertLabels[answer.value] || `Value ${answer.value}`

          doc.fontSize(9).font('Helvetica')
            .text(`${ansIndex + 1}. ${questionText}`, { indent: 20 })
            .font('Helvetica-Bold')
            .text(`   Answer: ${answerLabel} (${answer.value})`, { indent: 30 })
          doc.moveDown(0.2)
        })

        doc.moveDown(1)
        if (index < surveySamples.length - 1) {
          doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
          doc.moveDown(1)
        }
      })
    }

    // Feedback Samples Section
    if (feedbackSamples.length > 0) {
      doc.addPage()
      doc.fontSize(16).font('Helvetica-Bold')
        .text('FEEDBACK RESPONSES', { underline: true })
      doc.moveDown()

      feedbackSamples.forEach((sample, index) => {
        doc.fontSize(12).font('Helvetica-Bold')
          .text(`Sample ${index + 1}`, { underline: true })

        doc.fontSize(10).font('Helvetica')
          .text(`Student ID: ${sample.studentId}`)
          .text(`Submitted At: ${new Date(sample.submittedAt).toLocaleString()}`)
        doc.moveDown(0.5)

        // Map answers to questions
        const questionMap = {}
        course.feedbackQuestions.forEach(q => {
          questionMap[q.questionId] = q.text
        })

        doc.fontSize(10).font('Helvetica-Bold')
          .text('Answers:')
        doc.moveDown(0.3)

        sample.answers.forEach((answer, ansIndex) => {
          const questionText = questionMap[answer.questionId] || `Question ${answer.questionId}`
          const answerLabel = LikertLabels[answer.value] || `Value ${answer.value}`

          doc.fontSize(9).font('Helvetica')
            .text(`${ansIndex + 1}. ${questionText}`, { indent: 20 })
            .font('Helvetica-Bold')
            .text(`   Answer: ${answerLabel} (${answer.value})`, { indent: 30 })
          doc.moveDown(0.2)
        })

        if (sample.recommendation && sample.recommendation.trim()) {
          doc.moveDown(0.3)
          doc.fontSize(10).font('Helvetica-Bold')
            .text('Recommendation:')
          doc.fontSize(9).font('Helvetica')
            .text(sample.recommendation, { indent: 20, align: 'left' })
        }

        doc.moveDown(1)
        if (index < feedbackSamples.length - 1) {
          doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
          doc.moveDown(1)
        }
      })
    }

    // Footer
    doc.fontSize(8).font('Helvetica-Oblique')
      .text('This document contains sample submissions for course evaluation purposes.', 50, doc.page.height - 50, {
        align: 'center',
        width: 500
      })

    // Finalize PDF
    doc.end()
  } catch (error) {
    logger.error('Error generating course samples PDF:', error)
    next(error)
  }
})

// GET /api/admin/course/:id/samples/survey
router.get('/admin/course/:id/samples/survey', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params

    const course = await Course.findById(id)
    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      })
    }

    // Get 5 random samples from survey responses
    const surveySamples = await SurveyResponse.aggregate([
      { $match: { courseId: course._id } },
      { $sample: { size: 5 } }
    ])

    // Create PDF
    const doc = new PDFDocument({ margin: 50 })

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="course_${course.courseCode}_survey_samples.pdf"`)

    // Pipe PDF to response
    doc.pipe(res)

    // Header
    doc.fontSize(20).font('Helvetica-Bold')
      .text('Course Survey Samples', { align: 'center' })
    doc.moveDown()

    doc.fontSize(14).font('Helvetica')
      .text(`Course: ${course.courseCode} - ${course.courseName}`, { align: 'center' })
    doc.moveDown()

    doc.fontSize(10).font('Helvetica-Oblique')
      .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
    doc.moveDown(2)

    // Survey Samples Section
    if (surveySamples.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold')
        .text('SURVEY RESPONSES', { underline: true })
      doc.moveDown()

      surveySamples.forEach((sample, index) => {
        doc.fontSize(12).font('Helvetica-Bold')
          .text(`Sample ${index + 1}`, { underline: true })

        doc.fontSize(10).font('Helvetica')
          .text(`Student ID: ${sample.studentId}`)
          .text(`Submitted At: ${new Date(sample.submittedAt).toLocaleString()}`)
        doc.moveDown(0.5)

        // Map answers to questions
        const questionMap = {}
        course.surveyQuestions.forEach(q => {
          questionMap[q.questionId] = q.text
        })

        doc.fontSize(10).font('Helvetica-Bold')
          .text('Answers:')
        doc.moveDown(0.3)

        sample.answers.forEach((answer, ansIndex) => {
          const questionText = questionMap[answer.questionId] || `Question ${answer.questionId}`
          const answerLabel = LikertLabels[answer.value] || `Value ${answer.value}`

          doc.fontSize(9).font('Helvetica')
            .text(`${ansIndex + 1}. ${questionText}`, { indent: 20 })
            .font('Helvetica-Bold')
            .text(`   Answer: ${answerLabel} (${answer.value})`, { indent: 30 })
          doc.moveDown(0.2)
        })

        doc.moveDown(1)
        if (index < surveySamples.length - 1) {
          doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
          doc.moveDown(1)
        }
      })
    } else {
      doc.fontSize(12).font('Helvetica')
        .text('No survey responses found for this course.', { align: 'center' })
    }

    // Footer
    doc.fontSize(8).font('Helvetica-Oblique')
      .text('This document contains sample survey submissions for course evaluation purposes.', 50, doc.page.height - 50, {
        align: 'center',
        width: 500
      })

    // Finalize PDF
    doc.end()
  } catch (error) {
    logger.error('Error generating survey samples PDF:', error)
    next(error)
  }
})

// GET /api/admin/course/:id/samples/feedback
router.get('/admin/course/:id/samples/feedback', authenticateAdmin, async (req, res, next) => {
  try {
    const { id } = req.params

    const course = await Course.findById(id)
    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      })
    }

    // Get 5 random samples from feedback responses
    const feedbackSamples = await FeedbackResponse.aggregate([
      { $match: { courseId: course._id } },
      { $sample: { size: 5 } }
    ])

    // Create PDF
    const doc = new PDFDocument({ margin: 50 })

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="course_${course.courseCode}_feedback_samples.pdf"`)

    // Pipe PDF to response
    doc.pipe(res)

    // Header
    doc.fontSize(20).font('Helvetica-Bold')
      .text('Course Feedback Samples', { align: 'center' })
    doc.moveDown()

    doc.fontSize(14).font('Helvetica')
      .text(`Course: ${course.courseCode} - ${course.courseName}`, { align: 'center' })
    doc.moveDown()

    doc.fontSize(10).font('Helvetica-Oblique')
      .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
    doc.moveDown(2)

    // Feedback Samples Section
    if (feedbackSamples.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold')
        .text('FEEDBACK RESPONSES', { underline: true })
      doc.moveDown()

      feedbackSamples.forEach((sample, index) => {
        doc.fontSize(12).font('Helvetica-Bold')
          .text(`Sample ${index + 1}`, { underline: true })

        doc.fontSize(10).font('Helvetica')
          .text(`Student ID: ${sample.studentId}`)
          .text(`Submitted At: ${new Date(sample.submittedAt).toLocaleString()}`)
        doc.moveDown(0.5)

        // Map answers to questions
        const questionMap = {}
        course.feedbackQuestions.forEach(q => {
          questionMap[q.questionId] = q.text
        })

        doc.fontSize(10).font('Helvetica-Bold')
          .text('Answers:')
        doc.moveDown(0.3)

        sample.answers.forEach((answer, ansIndex) => {
          const questionText = questionMap[answer.questionId] || `Question ${answer.questionId}`
          const answerLabel = LikertLabels[answer.value] || `Value ${answer.value}`

          doc.fontSize(9).font('Helvetica')
            .text(`${ansIndex + 1}. ${questionText}`, { indent: 20 })
            .font('Helvetica-Bold')
            .text(`   Answer: ${answerLabel} (${answer.value})`, { indent: 30 })
          doc.moveDown(0.2)
        })

        if (sample.recommendation && sample.recommendation.trim()) {
          doc.moveDown(0.3)
          doc.fontSize(10).font('Helvetica-Bold')
            .text('Recommendation:')
          doc.fontSize(9).font('Helvetica')
            .text(sample.recommendation, { indent: 20, align: 'left' })
        }

        doc.moveDown(1)
        if (index < feedbackSamples.length - 1) {
          doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
          doc.moveDown(1)
        }
      })
    } else {
      doc.fontSize(12).font('Helvetica')
        .text('No feedback responses found for this course.', { align: 'center' })
    }

    // Footer
    doc.fontSize(8).font('Helvetica-Oblique')
      .text('This document contains sample feedback submissions for course evaluation purposes.', 50, doc.page.height - 50, {
        align: 'center',
        width: 500
      })

    // Finalize PDF
    doc.end()
  } catch (error) {
    logger.error('Error generating feedback samples PDF:', error)
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

// GET /api/admin/report/pdf
router.get('/admin/report/pdf', authenticateAdmin, async (req, res, next) => {
  try {
    const { deptCode, year, semester, type } = req.query

    if (!deptCode || !year || !semester || !type) {
      return res.status(400).json({
        success: false,
        error: { message: 'deptCode, year, semester and type are required' }
      })
    }

    const courses = await Course.find({
      deptCode: deptCode.toUpperCase(),
      year: parseInt(year),
      semester: parseInt(semester)
    })

    const reports = await Promise.all(
      courses.map(async (course) => {
        const [surveyResponses, feedbackResponses] = await Promise.all([
          SurveyResponse.find({ courseId: course._id }),
          FeedbackResponse.find({ courseId: course._id })
        ])

        return {
          courseCode: course.courseCode,
          courseName: course.courseName,
          survey: {
            questionStats: calculateQuestionStats(
              surveyResponses,
              course.surveyQuestions
            )
          },
          feedback: {
            questionStats: calculateQuestionStats(
              feedbackResponses,
              course.feedbackQuestions
            )
          }
        }
      })
    )

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 30,
      bufferPages: true
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${deptCode}_${year}_Sem${semester}_${type}_Report.pdf"`
    )

    doc.pipe(res)

    const pageWidth = doc.page.width
    const pageHeight = doc.page.height
    const usableWidth = pageWidth - 60

    /* ================= HEADER ================= */

    doc.rect(0, 0, pageWidth, 90).fill('#1E88E5')

    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(26)
      .text(
        `Class ${type === 'feedback' ? 'Feedback' : 'Survey'} Report`,
        0,
        28,
        { width: pageWidth, align: 'center' }
      )

    doc
      .font('Helvetica')
      .fontSize(13)
      .text(
        `${deptCode.toUpperCase()} • Academic Year ${year} • Semester ${semester}`,
        0,
        60,
        { width: pageWidth, align: 'center' }
      )

    doc.moveDown(4)

    /* ================= METADATA ================= */

    const generatedAt = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })

    doc
      .fillColor('#333')
      .fontSize(10)
      .text(`Department : ${deptCode.toUpperCase()}`, 30)
      .text(`Year : ${year}`)
      .text(`Semester : ${semester}`)

    doc
      .text(`Generated On : ${generatedAt}`, pageWidth - 300, 130)
      .text(`Generated By : System Admin`, pageWidth - 300, 145)

    doc.moveDown(2)

    doc
      .moveTo(30, doc.y)
      .lineTo(pageWidth - 30, doc.y)
      .strokeColor('#BBBBBB')
      .stroke()

    doc.moveDown(2)

    const {
      FEEDBACK_CATEGORIES,
      getCOLabel,
      getStudentsAbove60,
      likertToPercentage
    } = await import('../constants/reportCategories.js')

    /* ================= FEEDBACK TABLE ================= */

    if (type === 'feedback') {
      const startX = 30
      const courseColWidth = 260
      const remainingWidth = usableWidth - courseColWidth
      const colWidth = remainingWidth / FEEDBACK_CATEGORIES.length

      let y = doc.y

      doc.rect(startX, y - 4, usableWidth, 22).fill('#E3F2FD')
      doc.fillColor('#0D47A1').font('Helvetica-Bold').fontSize(10)

      doc.text('Course', startX + 5, y, { width: courseColWidth })

      let x = startX + courseColWidth
      FEEDBACK_CATEGORIES.forEach(cat => {
        doc.text(cat.name, x, y, { width: colWidth, align: 'center' })
        x += colWidth
      })

      doc.moveDown(1.5)
      doc.font('Helvetica').fontSize(9)

      reports.forEach((report, index) => {
        const rowY = doc.y
        let cx = startX

        if (index % 2 === 0) {
          doc.rect(startX, rowY - 2, usableWidth, 28).fill('#FAFAFA')
        }

        doc.fillColor('#000')
        doc.text(
          `${report.courseCode}\n${report.courseName}`,
          cx + 5,
          rowY,
          { width: courseColWidth }
        )

        cx += courseColWidth

        FEEDBACK_CATEGORIES.forEach(cat => {
          let total = 0
          let count = 0

          cat.questions.forEach(qId => {
            const stat = report.feedback?.questionStats?.[qId]
            if (stat) {
              total += stat.average
              count++
            }
          })

          const avg = count ? total / count : 0
          const pct = likertToPercentage(avg).toFixed(0)

          doc.text(
            `${pct}% (${avg.toFixed(2)})`,
            cx,
            rowY + 6,
            { width: colWidth, align: 'center' }
          )

          cx += colWidth
        })

        doc.moveDown(2)
      })
    }

    /* ================= SURVEY TABLE ================= */

    if (type === 'survey') {
      let maxCols = 0
      reports.forEach(r => {
        maxCols = Math.max(
          maxCols,
          Object.keys(r.survey?.questionStats || {}).length
        )
      })

      const startX = 30
      const courseColWidth = 220
      const remainingWidth = usableWidth - courseColWidth
      const colWidth = remainingWidth / maxCols

      let y = doc.y

      doc.rect(startX, y - 4, usableWidth, 22).fill('#E8F5E9')
      doc.fillColor('#1B5E20').font('Helvetica-Bold').fontSize(10)

      doc.text('Course', startX + 5, y, { width: courseColWidth })

      let x = startX + courseColWidth
      for (let i = 0; i < maxCols; i++) {
        doc.text(getCOLabel(i), x, y, { width: colWidth, align: 'center' })
        x += colWidth
      }

      doc.moveDown(1.5)
      doc.font('Helvetica').fontSize(9)

      reports.forEach((report, index) => {
        const rowY = doc.y
        let cx = startX

        if (index % 2 === 0) {
          doc.rect(startX, rowY - 2, usableWidth, 28).fill('#FAFAFA')
        }

        doc.fillColor('#000')
        doc.text(
          `${report.courseCode}\n${report.courseName}`,
          cx + 5,
          rowY,
          { width: courseColWidth }
        )

        cx += courseColWidth
        const qIds = Object.keys(report.survey.questionStats || {}).sort()

        for (let i = 0; i < maxCols; i++) {
          const stat = report.survey.questionStats[qIds[i]]

          if (stat) {
            const pct = (stat.average * 20).toFixed(0)
            const count = (getStudentsAbove60(stat.distribution) / (stat.count) * 100).toFixed(0)
            doc.text(
              `${pct} -- (${count}%)`,
              cx,
              rowY + 6,
              { width: colWidth, align: 'center' }
            )
          } else {
            doc.text('-', cx, rowY + 6, {
              width: colWidth,
              align: 'center'
            })
          }

          cx += colWidth
        }

        doc.moveDown(2)
      })
    }

    /* ================= SIGNATURE SECTION (LAST PAGE ONLY) ================= */

    const SIGNATURE_BLOCK_HEIGHT = 120
    const bottomMargin = doc.page.margins.bottom

    // Ensure enough space, else move to a new page
    if (doc.y + SIGNATURE_BLOCK_HEIGHT > pageHeight - bottomMargin) {
      doc.addPage()
    }

    const signY = doc.y + 40

    doc
      .moveTo(80, signY)
      .lineTo(380, signY)
      .strokeColor('#000')
      .stroke()

    doc
      .moveTo(pageWidth - 380, signY)
      .lineTo(pageWidth - 80, signY)
      .stroke()

    doc.fontSize(11).fillColor('#000')

    doc.text('Faculty Advisor', 80, signY + 8, {
      width: 300,
      align: 'center'
    })

    doc.text('Head of the Department', pageWidth - 380, signY + 8, {
      width: 300,
      align: 'center'
    })

    /* ================= FOOTER ================= */

    doc.on('pageAdded', () => {
      const { width, height } = doc.page

      doc
        .fontSize(9)
        .fillColor('#666')
        .text(
          `Feedback and Survey System • Page ${doc.page.number}`,
          30,
          height - 35,
          { width: width - 60, align: 'center' }
        )
    })
    doc.end()
  } catch (error) {
    logger.error('Error generating PDF report:', error)
    next(error)
  }
})

// Helper function to calculate question statistics
function calculateQuestionStats(responses, questions) {
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

