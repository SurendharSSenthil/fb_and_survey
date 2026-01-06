import mongoose from 'mongoose'

const counterSchema = new mongoose.Schema({
  deptCode: {
    type: String,
    required: true,
    uppercase: true
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
  current: {
    type: Number,
    default: 0,
    min: 0
  }
})

// Compound unique index
counterSchema.index({ deptCode: 1, semester: 1, year: 1 }, { unique: true })

export default mongoose.model('Counter', counterSchema)

