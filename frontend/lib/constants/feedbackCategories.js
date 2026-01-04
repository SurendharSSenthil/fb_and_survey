/**
 * Feedback Question Categories
 * 20 questions organized into 4 categories (5 questions each)
 */
export const FEEDBACK_CATEGORIES = [
  {
    id: 'CAT1',
    name: 'Planning & Organisation',
    questions: ['FQ1', 'FQ2', 'FQ3', 'FQ4', 'FQ5']
  },
  {
    id: 'CAT2',
    name: 'Communication & Presentation',
    questions: ['FQ6', 'FQ7', 'FQ8', 'FQ9', 'FQ10']
  },
  {
    id: 'CAT3',
    name: 'Student Participation',
    questions: ['FQ11', 'FQ12', 'FQ13', 'FQ14', 'FQ15']
  },
  {
    id: 'CAT4',
    name: 'Class Management',
    questions: ['FQ16', 'FQ17', 'FQ18', 'FQ19', 'FQ20']
  }
]

/**
 * Convert Likert scale (1-5) to percentage (0-100)
 * 1 = 0%, 2 = 25%, 3 = 50%, 4 = 75%, 5 = 100%
 */
export const likertToPercentage = (value) => {
  return ((value - 1) / 4) * 100
}

/**
 * Generate CO (Course Outcome) labels
 * CO1, CO2, CO3, etc.
 */
export const getCOLabel = (index) => {
  return `CO${index + 1}`
}

