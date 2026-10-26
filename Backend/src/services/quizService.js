const { ObjectId } = require('mongodb');
const { getDb } = require('../db');
const { AuthService } = require('./authService');

class QuizService {
  constructor() {
    this.authService = new AuthService();
  }

  async getDb() {
    return await getDb();
  }

  async saveQuiz(quiz) {
    console.log('=== SAVE QUIZ SERVICE CALLED ===');
    console.log('Quiz to save:', JSON.stringify({
      title: quiz.title,
      questions: quiz.questions?.length || 0,
      createdBy: quiz.createdBy,
      uniqueCode: quiz.uniqueCode
    }, null, 2));

    const db = await this.getDb();
    const collection = db.collection('quizzes');
    const result = await collection.insertOne(quiz);
    
    console.log('Quiz inserted successfully');
    console.log('Inserted ID:', result.insertedId.toString());
    console.log('Installed quiz createdBy:', quiz.createdBy);
    
    return result.insertedId.toString();
  }

  async getQuizByCode(code) {
    const db = await this.getDb();
    const collection = db.collection('quizzes');
    const quizDocument = await collection.findOne({ uniqueCode: code });

    if (!quizDocument) return null;

    const quiz = {
      id: quizDocument._id.toString(),
      title: quizDocument.title,
      description: quizDocument.description,
      questions: quizDocument.questions,
      category: quizDocument.category,
      difficulty: quizDocument.difficulty,
      createdBy: quizDocument.createdBy,
      createdAt: quizDocument.createdAt,
      uniqueCode: quizDocument.uniqueCode,
      isActive: quizDocument.isActive,
    };

    return quiz;
  }
  
  async getAllQuizzes() {
    const db = await this.getDb();
    const collection = db.collection('quizzes');
    const quizDocuments = await collection.find({}).toArray();

    return quizDocuments.map(quizDocument => ({
      id: quizDocument._id.toString(),
      title: quizDocument.title,
      description: quizDocument.description,
      questions: quizDocument.questions,
      category: quizDocument.category,
      difficulty: quizDocument.difficulty,
      createdBy: quizDocument.createdBy,
      createdAt: quizDocument.createdAt,
      uniqueCode: quizDocument.uniqueCode,
      isActive: quizDocument.isActive,
    }));
  }

  async getQuizzesByAdminId(adminId) {
    console.log('=== GET QUIZZES BY ADMIN ID STARTED ===');
    console.log('Searching for adminId:', adminId);
    console.log('AdminId type:', typeof adminId);

    try {
      const db = await this.getDb();
      console.log('MongoDB connection ensured for admin quizzes retrieval');

      const collection = db.collection('quizzes');

      console.log('Querying quizzes collection with createdBy:', adminId);
      const quizDocuments = await collection.find({ createdBy: adminId }).toArray();
      console.log('Found', quizDocuments.length, 'quizzes with createdBy:', adminId);
      
      const mappedQuizzes = quizDocuments.map(quizDocument => ({
        id: quizDocument._id.toString(),
        title: quizDocument.title,
        description: quizDocument.description,
        questions: quizDocument.questions,
        category: quizDocument.category,
        difficulty: quizDocument.difficulty,
        createdBy: quizDocument.createdBy,
        createdAt: quizDocument.createdAt,
        uniqueCode: quizDocument.uniqueCode,
        isActive: quizDocument.isActive,
      }));

      console.log('Mapped quizzes:', JSON.stringify(mappedQuizzes, null, 2));
      console.log('Returning', mappedQuizzes.length, 'quizzes for admin:', adminId);

      return mappedQuizzes;
    } catch (error) {
      console.error('Error in getQuizzesByAdminId:', error);
      throw error;
    }
  }

  async saveQuizResult(result) {
    console.log('=== SAVE QUIZ RESULT STARTED ===');
    console.log('Saving result:', JSON.stringify(result, null, 2));

    try {
      const db = await this.getDb();
      console.log('MongoDB connection ensured');

      // Fetch user name if userId is provided
      let userName = result.userName;
      if (result.userId && !userName) {
        try {
          const user = await this.authService.getUserById(result.userId);
          if (user) {
            userName = user.name;
            console.log('Fetched user name:', userName);
          }
        } catch (error) {
          console.warn('Could not fetch user name:', error);
        }
      }

      const collection = db.collection('quizResults');

      const resultDocument = {
        ...result,
        userName: userName || 'Anonymous',
        completedAt: new Date(result.completedAt || Date.now())
      };

      console.log('About to insert document:', JSON.stringify(resultDocument, null, 2));

      const saveResult = await collection.insertOne(resultDocument);
      const insertedId = saveResult.insertedId.toString();

      console.log('Document inserted successfully with ID:', insertedId);
      return insertedId;
    } catch (error) {
      console.error('Error in saveQuizResult:', error);
      throw error;
    }
  }
  
  async getQuizResultsByQuizId(quizId) {
    console.log('=== GET QUIZ RESULTS STARTED ===');
    console.log('Searching for quizId:', quizId);

    try {
      const db = await this.getDb();
      const collection = db.collection('quizResults');

      console.log('Querying collection with quizId:', quizId);
      const results = await collection.find({ quizId }).sort({ completedAt: -1 }).toArray();

      const mappedResults = results.map(result => ({
        quizId: result.quizId,
        userId: result.userId,
        userName: result.userName,
        score: result.score,
        totalQuestions: result.totalQuestions,
        answers: result.answers,
        completedAt: result.completedAt
      }));

      console.log('Returning', mappedResults.length, 'results');
      return mappedResults;
    } catch (error) {
      console.error('Error in getQuizResultsByQuizId:', error);
      throw error;
    }
  }

  async getQuizResultsByUserId(userId) {
    console.log('=== GET USER QUIZ RESULTS STARTED ===');
    console.log('Searching for userId:', userId);

    try {
      const db = await this.getDb();
      const resultsCollection = db.collection('quizResults');
      const quizzesCollection = db.collection('quizzes');

      console.log('Querying results collection with userId:', userId);
      const results = await resultsCollection.find({ userId }).sort({ completedAt: -1 }).toArray();

      // Get quiz details for each result
      const userResults = await Promise.all(results.map(async (result) => {
        try {
          let quiz = null;
          try {
            if (/^[0-9a-fA-F]{24}$/.test(result.quizId)) {
              quiz = await quizzesCollection.findOne({ _id: new ObjectId(result.quizId) });
            }
          } catch (objectIdError) {
            console.warn('Invalid ObjectId format for quizId:', result.quizId, '- trying id field');
          }

          if (!quiz) {
            quiz = await quizzesCollection.findOne({ id: result.quizId });
          }

          return {
            quizId: result.quizId,
            userId: result.userId,
            userName: result.userName,
            score: result.score,
            totalQuestions: result.totalQuestions,
            answers: result.answers,
            completedAt: result.completedAt,
            quizTitle: quiz ? quiz.title : 'Unknown Quiz',
            quizCategory: quiz ? quiz.category : 'Unknown',
            quizDifficulty: quiz ? quiz.difficulty : 'Unknown',
            quizCreatedBy: quiz ? quiz.createdBy : 'Unknown'
          };
        } catch (error) {
          console.warn('Could not fetch quiz details for result:', result.quizId, error);
          return {
            quizId: result.quizId,
            userId: result.userId,
            userName: result.userName,
            score: result.score,
            totalQuestions: result.totalQuestions,
            answers: result.answers,
            completedAt: result.completedAt,
            quizTitle: 'Unknown Quiz',
            quizCategory: 'Unknown',
            quizDifficulty: 'Unknown',
            quizCreatedBy: 'Unknown'
          };
        }
      }));

      return userResults;
    } catch (error) {
      console.error('Error in getQuizResultsByUserId:', error);
      throw error;
    }
  }

  async getQuizResultsByAdminId(adminId) {
    console.log('=== GET QUIZ RESULTS BY ADMIN ID STARTED ===');
    console.log('Searching for adminId:', adminId);

    try {
      const db = await this.getDb();
      const quizzesCollection = db.collection('quizzes');
      const resultsCollection = db.collection('quizResults');

      // First, get all quizzes created by this admin
      const adminQuizzes = await quizzesCollection.find({ createdBy: adminId }).toArray();
      console.log('Found', adminQuizzes.length, 'quizzes created by admin:', adminId);

      if (adminQuizzes.length === 0) {
        return [];
      }

      // Get quiz IDs
      const quizIds = adminQuizzes.map(quiz => quiz._id.toString());

      // Get all results for these quizzes
      const results = await resultsCollection.find({
        quizId: { $in: quizIds }
      }).sort({ completedAt: -1 }).toArray();

      // Group results by quiz and add quiz details
      const adminResults = adminQuizzes.map(quiz => {
        const quizId = quiz._id.toString();
        const quizResults = results.filter(result => {
          const resultQuizId = result.quizId?.toString() || result.quizId;
          return resultQuizId === quizId;
        });
        return {
          quizId: quizId,
          quizTitle: quiz.title || "Untitled Quiz",
          quizCategory: quiz.category || "General",
          quizDifficulty: quiz.difficulty || "Medium",
          totalAttempts: quizResults.length,
          results: quizResults.map(result => ({
            userId: result.userId,
            userName: result.userName || "Anonymous",
            score: result.score || 0,
            totalQuestions: result.totalQuestions || quiz.questions?.length || 0,
            percentage: result.score && result.totalQuestions 
              ? Math.round((result.score / result.totalQuestions) * 100)
              : 0,
            completedAt: result.completedAt || new Date()
          }))
        };
      });

      console.log('Returning', adminResults.length, 'quiz summaries for admin');
      return adminResults;
    } catch (error) {
      console.error('Error in getQuizResultsByAdminId:', error);
      throw error;
    }
  }

  async getQuizById(quizId) {
    console.log('=== GET QUIZ BY ID STARTED ===');
    console.log('Searching for quizId:', quizId);

    try {
      const db = await this.getDb();
      let quizDocument = null;
      const quizzes = db.collection('quizzes');
      
      try {
        const cleanId = quizId.toString().trim();
        if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
          quizDocument = await quizzes.findOne({ _id: new ObjectId(cleanId) });
        }
      } catch (objectIdError) {
        console.warn('Error with ObjectId search:', objectIdError.message);
      }

      if (!quizDocument) {
        quizDocument = await quizzes.findOne({
          $or: [
            { id: quizId },
            { uniqueCode: quizId },
            { _id: quizId.toString() }
          ]
        });
      }

      if (!quizDocument) {
        console.log('Quiz not found with ID:', quizId);
        return null;
      }

      const results = db.collection('quizResults');
      const attemptsCount = await results.countDocuments({ 
        quizId: quizDocument._id.toString() 
      });

      const quiz = {
        id: quizDocument._id.toString(),
        title: quizDocument.title || "Untitled Quiz",
        description: quizDocument.description || "",
        questions: quizDocument.questions || [],
        category: quizDocument.category || "General",
        difficulty: quizDocument.difficulty || "Medium",
        createdBy: quizDocument.createdBy,
        createdAt: quizDocument.createdAt || new Date(),
        uniqueCode: quizDocument.uniqueCode,
        isActive: quizDocument.isActive !== undefined ? quizDocument.isActive : true,
        totalAttempts: attemptsCount
      };

      return quiz;
    } catch (error) {
      console.error('Error in getQuizById:', error);
      throw error;
    }
  }

  async getQuizAttempts(quizId) {
    try {
      const db = await this.getDb();
      const resultsCollection = db.collection('quizResults');
      const attempts = await resultsCollection.countDocuments({ quizId: quizId.toString() });
      return attempts;
    } catch (error) {
      console.error('Error getting quiz attempts:', error);
      return 0;
    }
  }

  async updateQuiz(quizId, updatedQuiz) {
    console.log('=== UPDATE QUIZ STARTED ===');
    console.log('Updating quizId:', quizId);

    try {
      const db = await this.getDb();
      const collection = db.collection('quizzes');

      const updateData = {
        title: updatedQuiz.title,
        description: updatedQuiz.description,
        questions: updatedQuiz.questions,
        category: updatedQuiz.category,
        difficulty: updatedQuiz.difficulty,
        isActive: updatedQuiz.isActive,
        updatedAt: new Date()
      };

      let result = null;

      try {
        const cleanId = quizId.toString().trim();
        if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
          result = await collection.updateOne(
            { _id: new ObjectId(cleanId) },
            { $set: updateData }
          );
        }
      } catch (objectIdError) {
        console.warn('Invalid ObjectId format for quizId:', quizId);
      }

      if (!result || result.modifiedCount === 0) {
        result = await collection.updateOne(
          {
            $or: [
              { id: quizId },
              { uniqueCode: quizId }
            ]
          },
          { $set: updateData }
        );
      }

      return (result && result.modifiedCount > 0);
    } catch (error) {
      console.error('Error in updateQuiz:', error);
      throw error;
    }
  }
}

module.exports = { QuizService };
