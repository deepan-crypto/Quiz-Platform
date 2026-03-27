/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} question
 * @property {string[]} options
 * @property {string} correctAnswer
 * @property {string} explanation
 */

/** 
 * @typedef {Object} Quiz
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {Question[]} questions
 * @property {string} category
 * @property {'easy'|'medium'|'hard'} difficulty
 * @property {number} [timeLimit]
 * @property {string} createdBy
 * @property {Date} createdAt
 * @property {string} uniqueCode
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} QuestionResult
 * @property {string} questionId
 * @property {string} selectedAnswer
 * @property {boolean} isCorrect
 */

/**
 * @typedef {Object} QuizResult
 * @property {string} quizId
 * @property {string} userId
 * @property {string} [userName]
 * @property {number} score
 * @property {number} totalQuestions
 * @property {QuestionResult[]} answers
 * @property {Date} completedAt
 */

// Export empty object to maintain module structure
module.exports = {};