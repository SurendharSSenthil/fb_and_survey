import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false })

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  deptCode: {
    type: String,
    required: true,
    uppercase: true,
    ref: 'Department'
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: 3000
  },
  surveyQuestions: {
    type: [questionSchema],
    default: []
  },
  feedbackQuestions: {
    type: [questionSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Compound index for active courses
courseSchema.index({ deptCode: 1, semester: 1, year: 1, isActive: 1 })

export default mongoose.model('Course', courseSchema)

