import mongoose from 'mongoose'

const answerSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  }
}, { _id: false })

const feedbackResponseSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Course'
  },
  studentId: {
    type: String,
    required: true
  },
  answers: {
    type: [answerSchema],
    required: true
  },
  recommendation: {
    type: String,
    trim: true,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
})

// Compound unique index to prevent duplicate submissions
feedbackResponseSchema.index({ courseId: 1, studentId: 1 }, { unique: true })

// Index for reporting
feedbackResponseSchema.index({ courseId: 1, submittedAt: -1 })

export default mongoose.model('FeedbackResponse', feedbackResponseSchema)

