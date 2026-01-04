import logger from '../utils/logger.js'

// 404 Not Found middleware
const notFound = (req, res, next) => {
  logger.warn(`Route not found: ${req.method} ${req.url}`)
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.url} not found`
    }
  })
}

export default notFound

