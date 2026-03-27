const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
// Types are now defined as JSDoc comments in types/quiz.js

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);
const dbName = 'EduAI';

class AuthService {
  constructor() {
    // Connect to MongoDB with proper error handling
    client.connect()
      .then(() => {
        console.log('AuthService: Successfully connected to MongoDB');
      })
      .catch(error => {
        console.error('AuthService: Failed to connect to MongoDB:', error);
        throw error;
      });
  }

  async signup(request) {
    try {
      const db = client.db(dbName);
      const collection = db.collection('users');

      // Check if user already exists
      const existingUser = await collection.findOne({ email: request.email });
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(request.password, saltRounds);

      // Determine user role
      let userRole;
      if (request.role && ['admin', 'user'].includes(request.role)) {
        // Use provided role if valid
        userRole = request.role;
      } else {
        // Fallback to auto-assignment for backward compatibility
        const existingAdmin = await collection.findOne({ role: 'admin' });
        const isFirstUser = !existingAdmin;
        userRole = isFirstUser ? 'admin' : 'user';
      }

      console.log('=== SIGNUP DEBUG ===');
      console.log('Requested role:', request.role, 'Assigned role:', userRole);
      console.log('Email being registered:', request.email);

      // Create user
      const user = {
        id: Date.now().toString(),
        name: request.name,
        email: request.email,
        password: hashedPassword,
        role: userRole,
        createdAt: new Date()
      };

      console.log('Creating user with role:', user.role);
      console.log('User object:', { id: user.id, name: user.name, email: user.email, role: user.role });

      const result = await collection.insertOne(user);

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error('Error in signup:', error);
      return { success: false, error: 'Failed to create user' };
    }
  }

  async login(request) {
    try {
      const db = client.db(dbName);
      const collection = db.collection('users');

      // Find user by email
      const user = await collection.findOne({ email: request.email });
      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(request.password, user.password);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Return user without password
      const userWithoutPassword = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      };
      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error('Error in login:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async getUserById(userId) {
    try {
      const db = client.db(dbName);
      const collection = db.collection('users');
      const user = await collection.findOne({ id: userId });
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async getUserByEmail(email) {
    try {
      const db = client.db(dbName);
      const collection = db.collection('users');
      const user = await collection.findOne({ email });
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async updateUserRole(userId, role) {
    try {
      const db = client.db(dbName);
      const collection = db.collection('users');
      const result = await collection.updateOne(
        { id: userId },
        { $set: { role } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  }

  async getAllUsers() {
    try {
      const db = client.db(dbName);
      const collection = db.collection('users');
      const users = await collection.find({}).toArray();
      return users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }
}

module.exports = { AuthService };