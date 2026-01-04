import Counter from '../models/Counter.js'
import logger from './logger.js'

/**
 * Generate a unique student ID in format: <DEPT><YEAR><SEM><SEQ>
 * Example: CSE202607023
 */
export const generateStudentId = async (deptCode, year, semester) => {
  try {
    // Find or create counter for this dept/semester/year combination
    const counter = await Counter.findOneAndUpdate(
      { deptCode, year, semester },
      { $inc: { current: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    // Format: DEPT + YEAR + SEM + SEQ (padded to 3 digits)
    const seq = String(counter.current).padStart(3, '0')
    const studentId = `${deptCode}${year}${semester}${seq}`

    logger.info(`Generated student ID: ${studentId} for dept: ${deptCode}, year: ${year}, sem: ${semester}`)

    return studentId
  } catch (error) {
    logger.error('Error generating student ID:', error)
    throw new Error('Failed to generate student ID')
  }
}

