import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../constants/index.js'
import logger from '../utils/logger.js'

/**
 * JWT authentication middleware for admin routes
 */
export const authenticateAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'No token provided' }
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.admin = decoded
      next()
    } catch (error) {
      logger.warn('Invalid token:', error.message)
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token' }
      })
    }
  } catch (error) {
    logger.error('Auth middleware error:', error)
    return res.status(500).json({
      success: false,
      error: { message: 'Authentication error' }
    })
  }
}

