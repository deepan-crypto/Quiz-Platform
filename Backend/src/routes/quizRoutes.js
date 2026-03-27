const express = require('express');
const { OpenAIService } = require('../services/openaiService');
const { QuizService } = require('../services/quizService');

const router = express.Router();

// Add error handling middleware for quiz routes
const handleQuizErrors = (err, req, res, next) => {
  console.error('Quiz route error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// Debug: Log environment variables
console.log('In quizRoutes.js - Environment variables:');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY value:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'undefined');

// Get API key from environment variables only
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

const openaiService = new OpenAIService(apiKey);
const quizService = new QuizService();

// Function to generate unique 6-digit code
function generateUniqueCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Route for quiz generation using OpenAI API
router.post('/generate', async (req, res) => {
  try {
    const { topic, difficulty, numberOfQuestions, category, adminId } = req.body;

    console.log('=== QUIZ GENERATION REQUEST ===');
    console.log('Topic:', topic);
    console.log('Difficulty:', difficulty);
    console.log('Number of Questions:', numberOfQuestions);
    console.log('Category:', category);
    console.log('Admin ID:', adminId);

    // Validate input
    if (!topic || !difficulty || !numberOfQuestions || !category || !adminId) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: topic, difficulty, numberOfQuestions, category, adminId'
      });
    }

    console.log('Validation passed, calling OpenAI service...');

    // Generate quiz using OpenAI API
    const quizData = await openaiService.generateQuiz({
      topic,
      difficulty,
      numberOfQuestions,
      category
    });

    console.log('OpenAI response received:', { title: quizData.title, questionsCount: quizData.questions?.length });

    const quiz = {
      success: true,
      quiz: {
        id: Date.now().toString(),
        title: quizData.title || `Quiz on ${topic}`,
        description: quizData.description || `A quiz about ${topic}`,
        questions: quizData.questions || [],
        category: category,
        difficulty: difficulty,
        createdBy: adminId,
        createdAt: new Date(),
        uniqueCode: generateUniqueCode(),
        isActive: true,
      },
    };

    console.log('Generated quiz with createdBy:', adminId);

    res.json(quiz);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] QUIZ GENERATION ERROR:`);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate quiz. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route to generate individual questions
router.post('/generate-questions', async (req, res) => {
  try {
    const { topic, difficulty, count } = req.body;

    if (!topic || !difficulty || !count) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: topic, difficulty, count'
      });
    }

    const questions = await openaiService.generateQuestions(topic, difficulty, count);
    res.json({ success: true, questions });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] QUESTION GENERATION ERROR:`, {
      error: error.message,
      stack: error.stack,
      requestBody: {
        topic,
        difficulty,
        count
      },
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Failed to generate questions'
    });
  }
});

// Route to save quiz to database
router.post('/save', async (req, res) => {
  try {
    const quiz = req.body;

    console.log('=== SAVE QUIZ ROUTE CALLED ===');
    console.log('Quiz object received:', JSON.stringify(quiz, null, 2));
    console.log('createdBy field:', quiz?.createdBy);

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quiz data'
      });
    }

    // Ensure createdBy is set
    if (!quiz.createdBy) {
      console.warn('WARNING: createdBy field is missing from quiz object');
      return res.status(400).json({
        success: false,
        error: 'Quiz must have a createdBy field (admin ID)'
      });
    }

    const quizId = await quizService.saveQuiz(quiz);
    console.log('Quiz saved successfully with ID:', quizId, 'createdBy:', quiz.createdBy);
    
    res.json({
      success: true,
      quizId,
      uniqueCode: quiz.uniqueCode,
      message: 'Quiz saved successfully'
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] SAVE QUIZ ERROR:`, {
      error: error.message,
      stack: error.stack,
      quizData: {
        title: quiz?.title,
        questionsCount: quiz?.questions?.length || 0,
        category: quiz?.category,
        difficulty: quiz?.difficulty,
        createdBy: quiz?.createdBy
      },
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Failed to save quiz'
    });
  }
});

// Route to get quiz by unique code
router.get('/code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code || code.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid code format. Must be 6 digits'
      });
    }
    
    const quiz = await quizService.getQuizByCode(code);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    res.json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET QUIZ BY CODE ERROR:`, {
      error: error.message,
      stack: error.stack,
      code: code,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve quiz'
    });
  }
});

// Route to get all quizzes
router.get('/all', async (req, res) => {
  try {
    const quizzes = await quizService.getAllQuizzes();
    res.json({
      success: true,
      quizzes
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET ALL QUIZZES ERROR:`, {
      error: error.message,
      stack: error.stack,
      quizzesCount: quizzes?.length || 0,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve quizzes'
    });
  }
});

// Route to get quizzes by admin ID
router.get('/admin/:adminId', async (req, res) => {
  const { adminId } = req.params;
  
  try {
    if (!adminId) {
      return res.status(400).json({
        success: false,
        error: 'Missing admin ID'
      });
    }

    console.log('Fetching quizzes for admin ID:', adminId);
    const quizzes = await quizService.getQuizzesByAdminId(adminId);
    console.log('Found', quizzes.length, 'quizzes for admin ID:', adminId);

    res.json({
      success: true,
      quizzes
    });
  } catch (error) {
    console.error('GET ADMIN QUIZZES ERROR:', {
      error: error.message,
      adminId: adminId,
      timestamp: new Date().toISOString()
    });
    handleQuizErrors(error, req, res);
  }
});

router.post('/result', async (req, res) => {
  try {
    const result = req.body;
    console.log('=== QUIZ RESULT REQUEST RECEIVED ===');
    console.log('Request body:', JSON.stringify(result, null, 2));

    if (!result.quizId || !result.userId || !result.answers) {
      console.log('Validation failed - missing required fields');
      console.log('quizId:', result.quizId);
      console.log('userId:', result.userId);
      console.log('answers:', result.answers);
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: quizId, userId, answers'
      });
    }

    const quiz = await quizService.getQuizById(result.quizId);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    const enhancedResult = {
      ...result,
      quizTitle: quiz.title || 'Untitled Quiz',
      quizCategory: quiz.category || 'General',
      quizDifficulty: quiz.difficulty || 'Medium',
      userName: result.userName || 'Anonymous'
    };

    console.log('Validation passed! Saving quiz result:', {
      quizId: enhancedResult.quizId,
      userId: enhancedResult.userId,
      score: enhancedResult.score,
      totalQuestions: enhancedResult.totalQuestions,
      answersCount: enhancedResult.answers.length
    });

    const resultId = await quizService.saveQuizResult(enhancedResult);
    console.log('✅ Quiz result saved successfully with ID:', resultId);

    return res.json({
      success: true,
      resultId,
      message: 'Quiz result saved successfully'
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] SAVE QUIZ RESULT ERROR:`, {
      error: error.message,
      stack: error.stack,
      resultData: {
        quizId: result?.quizId,
        userId: result?.userId,
        score: result?.score,
        totalQuestions: result?.totalQuestions,
        answersCount: result?.answers?.length || 0
      },
      timestamp: new Date().toISOString()
    });
    return handleQuizErrors(error, req, res);
  }
});

// Route to get quiz results by quiz ID
router.get('/results/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;

    if (!quizId) {
      return res.status(400).json({
        success: false,
        error: 'Missing quiz ID'
      });
    }

    console.log('Fetching quiz results for quiz ID:', quizId);

    const results = await quizService.getQuizResultsByQuizId(quizId);
    console.log('Found', results.length, 'quiz results for quiz ID:', quizId);

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET QUIZ RESULTS ERROR:`, {
      error: error.message,
      stack: error.stack,
      quizId: quizId,
      resultsCount: results?.length || 0,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve quiz results'
    });
  }
});

// Route to get quiz results by user ID
router.get('/user-results/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing user ID'
      });
    }

    console.log('=== GET USER QUIZ RESULTS ROUTE ===');
    console.log('Fetching quiz results for user ID:', userId);
    console.log('User ID type:', typeof userId);

    const results = await quizService.getQuizResultsByUserId(userId);
    console.log('Found', results.length, 'quiz results for user ID:', userId);
    console.log('Results data:', JSON.stringify(results, null, 2));

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET USER QUIZ RESULTS ERROR:`, {
      error: error.message,
      stack: error.stack,
      userId: userId,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user quiz results'
    });
  }
});

// Route to get quiz results by admin ID (for admin dashboard)
router.get('/admin-results/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        error: 'Missing admin ID'
      });
    }

    console.log('Fetching quiz results for admin ID:', adminId);

    const results = await quizService.getQuizResultsByAdminId(adminId);
    console.log('Found results for', results.length, 'quizzes created by admin:', adminId);

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET ADMIN QUIZ RESULTS ERROR:`, {
      error: error.message,
      stack: error.stack,
      adminId: adminId || 'undefined',
      resultsCount: (results && results.length) || 0,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve admin quiz results'
    });
  }
});



// Route to update quiz details
router.put('/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const updatedQuiz = req.body;

    if (!quizId) {
      return res.status(400).json({
        success: false,
        error: 'Missing quiz ID'
      });
    }

    if (!updatedQuiz || !updatedQuiz.questions || updatedQuiz.questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quiz data - questions are required'
      });
    }

    console.log('Updating quiz with ID:', quizId);

    const success = await quizService.updateQuiz(quizId, updatedQuiz);

    if (success) {
      res.json({
        success: true,
        message: 'Quiz updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Quiz not found or update failed'
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] UPDATE QUIZ ERROR:`, {
      error: error.message,
      stack: error.stack,
      quizId: quizId,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update quiz'
    });
  }
});

// Generic route for getting quiz by ID - MUST BE LAST to avoid shadowing specific routes
router.get('/:quizId', async (req, res) => {
  const { quizId } = req.params;
  console.log('Fetching quiz with ID:', quizId);
  
  try {
    const quiz = await quizService.getQuizById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }
    
    console.log('Successfully found quiz:', quiz.title);
    res.json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    handleQuizErrors(error, req, res);
  }
});

module.exports = router;