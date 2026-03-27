const express = require('express');
const { AuthService } = require('../services/authService');
// Types are now defined as JSDoc comments in types/quiz.js

const router = express.Router();
const authService = new AuthService();

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const signupRequest = req.body;

    // Validate input
    if (!signupRequest.name || !signupRequest.email || !signupRequest.password || !signupRequest.confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Validate role if provided
    if (signupRequest.role && !['admin', 'user'].includes(signupRequest.role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be admin or user'
      });
    }

    if (signupRequest.password !== signupRequest.confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
    }

    if (signupRequest.password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupRequest.email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }

    const result = await authService.signup(signupRequest);

    if (result.success && result.user) {
      console.log('=== SIGNUP RESPONSE ===');
      console.log('User created successfully:', result.user);
      console.log('User role in response:', result.user.role);
      res.json({
        success: true,
        user: result.user,
        message: 'User created successfully'
      });
    } else {
      console.log('=== SIGNUP FAILED ===');
      console.log('Error:', result.error);
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] SIGNUP ERROR:`, {
      error: error.message,
      stack: error.stack,
      requestBody: {
        name: signupRequest?.name,
        email: signupRequest?.email,
        hasPassword: !!signupRequest?.password
      },
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const loginRequest = req.body;

    // Validate input
    if (!loginRequest.email || !loginRequest.password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await authService.login(loginRequest);

    if (result.success && result.user) {
      res.json({
        success: true,
        user: result.user,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] LOGIN ERROR:`, {
      error: error.message,
      stack: error.stack,
      requestBody: {
        email: loginRequest?.email,
        hasPassword: !!loginRequest?.password
      },
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user by ID route
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const user = await authService.getUserById(userId);

    if (user) {
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json({
        success: true,
        user: userWithoutPassword
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET USER ERROR:`, {
      error: error.message,
      stack: error.stack,
      userId: userId,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all users route (for admin management)
router.get('/users', async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    res.json({
      success: true,
      users: users.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      })
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] GET ALL USERS ERROR:`, {
      error: error.message,
      stack: error.stack,
      userCount: users?.length || 0,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Promote user to admin (temporary endpoint for testing)
router.post('/promote-admin/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const success = await authService.updateUserRole(userId, 'admin');

    if (success) {
      res.json({
        success: true,
        message: 'User promoted to admin successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User not found or update failed'
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] PROMOTE ADMIN ERROR:`, {
      error: error.message,
      stack: error.stack,
      userId: userId,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update user role route (admin only)
router.put('/user/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        error: 'User ID and role are required'
      });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be admin or user'
      });
    }

    const success = await authService.updateUserRole(userId, role);

    if (success) {
      res.json({
        success: true,
        message: 'User role updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User not found or update failed'
      });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] UPDATE USER ROLE ERROR:`, {
      error: error.message,
      stack: error.stack,
      userId: userId,
      requestedRole: role,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;