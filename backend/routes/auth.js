import express from 'express'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import Student from '../models/Student.js'
import { JWT_SECRET } from '../constants/index.js'
import logger from '../utils/logger.js'

const router = express.Router()

// POST /api/auth/login
router.post('/auth/login', async (req, res, next) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Username and password are required' }
      })
    }

    const admin = await Admin.findOne({ username: String(username).toLowerCase() })
    if (admin) {
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

      return res.json({
        success: true,
        data: {
          role: 'admin',
          token,
          username: admin.username
        }
      })
    }

    const studentId = String(username).toUpperCase().trim()
    const student = await Student.findOne({ studentId })
    if (!student) {
      logger.warn(`Failed login attempt for username: ${username}`)
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      })
    }

    if (password !== student.password) {
      logger.warn(`Failed login attempt for username: ${username}`)
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      })
    }

    logger.info(`Student logged in: ${student.studentId}`)

    return res.json({
      success: true,
      data: {
        role: 'student',
        studentId: student.studentId,
        issuedAt: Date.now()
      }
    })
  } catch (error) {
    logger.error('Error during login:', error)
    next(error)
  }
})

export default router
