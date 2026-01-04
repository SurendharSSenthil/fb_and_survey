import express from 'express'
import logger from '../utils/logger.js'

const router = express.Router()

// Health check endpoint
router.get('/health', (req, res) => {
  logger.info('Health check endpoint called')
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  })
})

// API info endpoint
router.get('/api', (req, res) => {
  logger.info('API info endpoint called')
  res.status(200).json({
    name: 'FB and Survey API',
    version: '1.0.0',
    status: 'active'
  })
})

export default router

