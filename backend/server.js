import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './config/database.js'
import logger from './utils/logger.js'
import { requestLogger, errorLogger } from './middleware/logger.js'
import errorHandler from './middleware/errorHandler.js'
import notFound from './middleware/notFound.js'
import routes from './routes/index.js'
import studentRoutes from './routes/student.js'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js'

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
// Request logging middleware
app.use(requestLogger)

// Routes
app.use('/api', routes)
app.use('/api', authRoutes)
app.use('/api', studentRoutes)
app.use('/api', adminRoutes)

// 404 handler
app.use(notFound)

// Error logging middleware (must be before error handler)
app.use(errorLogger)

// Error handler (must be last)
app.use(errorHandler)

// Connect to MongoDB
connectDB()

// Start server
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err)
  process.exit(1)
})

