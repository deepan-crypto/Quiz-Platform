const express = require('express');
const { OpenAIService } = require('../services/openaiService');
const { QuizService } = require('../services/quizService');

const router = express.Router();

// Add error handling helper for quiz routes
const handleQuizErrors = (err, req, res) => {
  console.error('Quiz route error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

const quizService = new QuizService();

// Helper to get or lazily initialize OpenAI service
const getOpenAIService = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return null;
  }
  return new OpenAIService(apiKey);
};

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

    const openaiService = getOpenAIService();
    if (!openaiService) {
      return res.status(503).json({
        success: false,
        error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in the backend environment variables.'
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
    console.error(`[${new Date().toISOString()}] QUIZ GENERATION ERROR:`, error.message);
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

    const openaiService = getOpenAIService();
    if (!openaiService) {
      return res.status(503).json({
        success: false,
        error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in the backend environment variables.'
      });
    }

    const questions = await openaiService.generateQuestions(topic, difficulty, count);
    res.json({ success: true, questions });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] QUESTION GENERATION ERROR:`, {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
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
        title: req.body?.title,
        questionsCount: req.body?.questions?.length || 0,
        category: req.body?.category,
        difficulty: req.body?.difficulty,
        createdBy: req.body?.createdBy
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
      code: req.params?.code,
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
      adminId: req.params?.adminId,
      timestamp: new Date().toISOString()
    });
    handleQuizErrors(error, req, res);
  }
});

router.post('/result', async (req, res) => {
  try {
    const result = req.body;
    console.log('=== QUIZ RESULT REQUEST RECEIVED ===');

    if (!result || !result.quizId || !result.userId || !result.answers) {
      console.log('Validation failed - missing required fields');
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

    const resultId = await quizService.saveQuizResult(enhancedResult);
    console.log('Quiz result saved successfully with ID:', resultId);

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
        quizId: req.body?.quizId,
        userId: req.body?.userId,
        score: req.body?.score,
        totalQuestions: req.body?.totalQuestions,
        answersCount: req.body?.answers?.length || 0
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

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET QUIZ RESULTS ERROR:`, {
      error: error.message,
      stack: error.stack,
      quizId: req.params?.quizId,
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

    console.log('Fetching quiz results for user ID:', userId);
    const results = await quizService.getQuizResultsByUserId(userId);

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET USER QUIZ RESULTS ERROR:`, {
      error: error.message,
      stack: error.stack,
      userId: req.params?.userId,
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

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET ADMIN QUIZ RESULTS ERROR:`, {
      error: error.message,
      stack: error.stack,
      adminId: req.params?.adminId,
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
      quizId: req.params?.quizId,
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