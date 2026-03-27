const { MongoClient, ObjectId } = require('mongodb');
// Types are now defined as JSDoc comments in types/quiz.js
const { AuthService } = require('./authService');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);
const dbName = 'EduAI';

// Connect to MongoDB and handle connection errors
let isConnected = false;
let connectionPromise = null;

async function ensureConnected() {
  if (isConnected) return;
  
  if (!connectionPromise) {
    connectionPromise = (async () => {
      try {
        await client.connect();
        isConnected = true;
        console.log('Successfully connected to MongoDB');
      } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
      }
    })();
  }
  
  await connectionPromise;
}

class QuizService {
  constructor() {
    // Initialize connection but don't block constructor
    ensureConnected().catch(error => {
      console.error('MongoDB connection failed:', error);
    });
    this.authService = new AuthService();
  }

  async getDb() {
    await ensureConnected();
    return client.db(dbName);
  }

  async saveQuiz(quiz) {
    await ensureConnected();
    const db = client.db(dbName);
    const collection = db.collection('quizzes');
    const result = await collection.insertOne(quiz);
    return result.insertedId.toString();
  }

  async getQuizByCode(code) {
    await ensureConnected();
    const db = client.db(dbName);
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
    await ensureConnected();
    const db = client.db(dbName);
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

    try {
      await ensureConnected();
      console.log('MongoDB connection ensured for admin quizzes retrieval');

      const db = client.db(dbName);
      const collection = db.collection('quizzes');

      console.log('Querying quizzes collection with createdBy:', adminId);
      const quizDocuments = await collection.find({ createdBy: adminId }).toArray();
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
      await ensureConnected();
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

      const db = client.db(dbName);
      const collection = db.collection('quizResults');

      const resultDocument = {
        ...result,
        userName: userName || 'Anonymous',
        completedAt: new Date(result.completedAt)
      };

      console.log('About to insert document:', JSON.stringify(resultDocument, null, 2));

      const saveResult = await collection.insertOne(resultDocument);
      const insertedId = saveResult.insertedId.toString();

      console.log('Document inserted successfully with ID:', insertedId);

      // Verify the document was saved
      const savedDoc = await collection.findOne({ _id: saveResult.insertedId });
      console.log('Verification - saved document:', JSON.stringify(savedDoc, null, 2));

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
      await ensureConnected();
      console.log('MongoDB connection ensured for retrieval');

      const db = client.db(dbName);
      const collection = db.collection('quizResults');

      console.log('Querying collection with quizId:', quizId);
      const results = await collection.find({ quizId }).sort({ completedAt: -1 }).toArray();
      console.log('Raw results from database:', JSON.stringify(results, null, 2));

      const mappedResults = results.map(result => ({
        quizId: result.quizId,
        userId: result.userId,
        userName: result.userName,
        score: result.score,
        totalQuestions: result.totalQuestions,
        answers: result.answers,
        completedAt: result.completedAt
      }));

      console.log('Mapped results:', JSON.stringify(mappedResults, null, 2));
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
      await ensureConnected();
      console.log('MongoDB connection ensured for user results retrieval');

      const db = client.db(dbName);
      const resultsCollection = db.collection('quizResults');
      const quizzesCollection = db.collection('quizzes');

      console.log('Querying results collection with userId:', userId);
      const results = await resultsCollection.find({ userId }).sort({ completedAt: -1 }).toArray();
      console.log('Raw user results from database:', JSON.stringify(results, null, 2));

      // Get quiz details for each result
      const userResults = await Promise.all(results.map(async (result) => {
        try {
          // First try to find quiz by _id field (MongoDB ObjectId) since that's what gets saved
          let quiz = null;
          try {
            quiz = await quizzesCollection.findOne({ _id: new ObjectId(result.quizId) });
          } catch (objectIdError) {
            console.warn('Invalid ObjectId format for quizId:', result.quizId, '- trying id field');
          }

          // If not found by _id, try by id field (fallback for legacy data)
          if (!quiz) {
            quiz = await quizzesCollection.findOne({ id: result.quizId });
          }

          console.log('Found quiz for result:', result.quizId, quiz ? quiz.title : 'Not found');

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

      console.log('Mapped user results:', JSON.stringify(userResults, null, 2));
      console.log('Returning', userResults.length, 'user results');

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
      await ensureConnected();
      console.log('MongoDB connection ensured for admin results retrieval');

      const db = client.db(dbName);
      const quizzesCollection = db.collection('quizzes');
      const resultsCollection = db.collection('quizResults');

      // First, get all quizzes created by this admin
      const adminQuizzes = await quizzesCollection.find({ createdBy: adminId }).toArray();
      console.log('Found', adminQuizzes.length, 'quizzes created by admin:', adminId);

      if (adminQuizzes.length === 0) {
        console.log('No quizzes found for this admin');
        return [];
      }

      // Get quiz IDs
      const quizIds = adminQuizzes.map(quiz => quiz._id.toString());
      console.log('Quiz IDs for admin:', quizIds);

      // Get all results for these quizzes
      const results = await resultsCollection.find({
        quizId: { $in: quizIds }
      }).sort({ completedAt: -1 }).toArray();
      console.log('Found', results.length, 'results for admin quizzes');

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
      console.log('MongoDB connection ensured for quiz retrieval');
      
      // Try to find by MongoDB ObjectId first
      let quizDocument = null;
      const quizzes = db.collection('quizzes');
      
      try {
        // Remove any whitespace and check if it's a valid hex string of 24 characters
        const cleanId = quizId.toString().trim();
        if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
          quizDocument = await quizzes.findOne({ _id: new ObjectId(cleanId) });
          console.log('Searching by ObjectId:', cleanId);
        }
      } catch (objectIdError) {
        console.warn('Error with ObjectId search:', objectIdError.message);
      }

      // If not found by _id, try other fields
      if (!quizDocument) {
        console.log('Trying to find quiz by other fields...');
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

      console.log('Found quiz document:', JSON.stringify(quizDocument, null, 2));

      // Get the actual attempts count from quiz results
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

      console.log('Returning quiz with', quiz.questions.length, 'questions');
      return quiz;
    } catch (error) {
      console.error('Error in getQuizById:', error);
      throw error;
    }
  }

  // Helper method to calculate attempts from results
  async getQuizAttempts(quizId) {
    try {
      await ensureConnected();
      const db = client.db(dbName);
      const resultsCollection = db.collection('quizResults');
      const attempts = await resultsCollection.countDocuments({ quizId: quizId.toString() });
      console.log(`Found ${attempts} attempts for quiz ${quizId}`);
      return attempts;
    } catch (error) {
      console.error('Error getting quiz attempts:', error);
      return 0;
    }
  }

  async updateQuiz(quizId, updatedQuiz) {
    console.log('=== UPDATE QUIZ STARTED ===');
    console.log('Updating quizId:', quizId);
    console.log('Updated quiz data:', JSON.stringify(updatedQuiz, null, 2));

    try {
      await ensureConnected();
      console.log('MongoDB connection ensured for quiz update');

      const db = client.db(dbName);
      const collection = db.collection('quizzes');

      // Prepare update data
      const updateData = {
        title: updatedQuiz.title,
        description: updatedQuiz.description,
        questions: updatedQuiz.questions,
        category: updatedQuiz.category,
        difficulty: updatedQuiz.difficulty,
        isActive: updatedQuiz.isActive,
        updatedAt: new Date()
      };

      console.log('Update data prepared:', JSON.stringify(updateData, null, 2));

      // Try to update by MongoDB ObjectId first
      let result = null;

      try {
        const cleanId = quizId.toString().trim();
        if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
          console.log('Attempting to update with ObjectId:', cleanId);
          result = await collection.updateOne(
            { _id: new ObjectId(cleanId) },
            { $set: updateData }
          );
        }
      } catch (objectIdError) {
        console.warn('Invalid ObjectId format for quizId:', quizId, '- trying other formats');
      }

      // If not updated by _id, try other fields
      if (!result || result.modifiedCount === 0) {
        console.log('Trying to update using alternative fields');
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

      if (result.modifiedCount > 0) {
        console.log('Quiz updated successfully');
        return true;
      } else {
        console.log('Quiz not found or no changes made');
        return false;
      }
    } catch (error) {
      console.error('Error in updateQuiz:', error);
      throw error;
    }
  }
}

module.exports = { QuizService };
