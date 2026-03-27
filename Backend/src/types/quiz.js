/**
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} question
 * @property {string[]} options
 * @property {string} correctAnswer
 * @property {string} [explanation]
 * @property {'easy'|'medium'|'hard'} difficulty
 * @property {string} category
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
 * @typedef {Object} QuizResult
 * @property {string} quizId
 * @property {string} userId
 * @property {string} [userName]
 * @property {number} score
 * @property {number} totalQuestions
 * @property {Array<{questionId: string, selectedAnswer: string, isCorrect: boolean}>} answers
 * @property {Date} completedAt
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} password
 * @property {'admin'|'user'} role
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} UserSignupRequest
 * @property {string} name
 * @property {string} email
 * @property {string} password
 * @property {string} confirmPassword
 */

/**
 * @typedef {Object} UserLoginRequest
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} AuthResponse
 * @property {boolean} success
 * @property {Object} [user]
 * @property {string} user.id
 * @property {string} user.name
 * @property {string} user.email
 * @property {'admin'|'user'} user.role
 * @property {string} [error]
 */

/**
 * @typedef {Object} QuizGenerationRequest
 * @property {string} topic
 * @property {'easy'|'medium'|'hard'} difficulty
 * @property {number} numberOfQuestions
 * @property {string} category
 */

/**
 * @typedef {Object} QuizGenerationResponse
 * @property {boolean} success
 * @property {Quiz} [quiz]
 * @property {string} [error]
 */

// Export empty object to maintain module structure
module.exports = {};
