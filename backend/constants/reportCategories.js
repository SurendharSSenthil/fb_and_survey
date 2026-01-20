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
 * 1 = 20%, 2 = 40%, 3 = 60%, 4 = 80%, 5 = 100%
 */
export const likertToPercentage = (value) => {
    return value * 20
}

/**
 * Generate CO (Course Outcome) labels
 * CO1, CO2, CO3, etc.
 */
export const getCOLabel = (index) => {
    return `CO${index + 1}`
}

/**
 * Calculate number of students who scored above 60% (scores 3, 4, 5)
 */
export const getStudentsAbove60 = (distribution) => {
    return (distribution[3] || 0) + (distribution[4] || 0) + (distribution[5] || 0)
}
