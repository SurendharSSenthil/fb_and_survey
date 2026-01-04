import expressWinston from 'express-winston'
import logger from '../utils/logger.js'

// Request logging middleware
const requestLogger = expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
  ignoreRoute: (req, res) => {
    // Ignore health check endpoints
    return req.url === '/health' || req.url === '/favicon.ico'
  }
})

// Error logging middleware
const errorLogger = expressWinston.errorLogger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  level: 'error'
})

export { requestLogger, errorLogger }

