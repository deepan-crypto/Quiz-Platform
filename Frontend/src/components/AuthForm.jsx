import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, BookOpen, X, XCircle } from 'lucide-react';

export function AuthForm({ onAuth, selectedRole }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');
    setFieldErrors({});

    // Client-side validation
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (!isLogin) {
      if (!formData.name) {
        errors.name = 'Full name is required';
      }
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            role: selectedRole
          };

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Call the onAuth callback with the user data
        onAuth(data.user);
        setRetryCount(0); // Reset retry count on success
      } else {
        const errorMessage = data.error || 'Authentication failed';
        setError(errorMessage);
        console.error('Authentication failed:', errorMessage);
      }
    } catch (error) {
      console.error('Authentication error:', error);

      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Network error. Please check if the backend server is running and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }

      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Content starts directly without overlay */}

      <div className="w-full max-w-5xl relative animate-fade-in-up">
        {/* Main Container - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Left Side - College Info & Logo */}
          <div className="hidden lg:flex lg:flex-col bg-blue-600 p-12 justify-between text-white relative overflow-hidden">
            <div className="relative z-10">
              {/* College Logo & Name */}
              <div className="mb-12">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/30">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Sri Eshwar College of Engineering</h2>
                <p className="text-blue-100 text-sm">Quiz & Assessment Platform</p>
              </div>

              {/* Features */}
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/20 border border-white/30">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Comprehensive Quizzes</h3>
                    <p className="text-xs text-blue-100 mt-1">Create and manage quizzes with ease</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/20 border border-white/30">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Student Management</h3>
                    <p className="text-xs text-blue-100 mt-1">Track student performance and results</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/20 border border-white/30">
                      <Lock className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Secure Platform</h3>
                    <p className="text-xs text-blue-100 mt-1">Your data is protected and secure</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom branding */}
            <div className="relative z-10">
              <p className="text-xs text-white/75">Trusted by educators and students</p>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            {/* Mobile Logo - Show on small screens */}
            <div className="lg:hidden mb-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Sri Eshwar College</h2>
              <p className="text-xs text-gray-500">Assessment Platform</p>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-gray-600 text-sm">
                {selectedRole === 'admin'
                  ? (isLogin ? 'Admin login - Manage quizzes and users' : 'Create your admin account')
                  : (isLogin ? 'Access your quizzes and track progress' : 'Start your quiz journey today')
                }
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 animate-fade-in">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-700 font-medium text-sm">{error}</p>
                    {retryCount > 0 && retryCount < 3 && (
                      <p className="text-red-600 text-xs mt-1">
                        Attempt {retryCount} of 3. Please check your connection and try again.
                      </p>
                    )}
                    {retryCount >= 3 && (
                      <p className="text-red-600 text-xs mt-1">
                        Multiple attempts failed. Please contact support if the problem persists.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setError('')}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                <div className="bg-white rounded-2xl p-6 flex items-center gap-4 shadow-lg">
                  <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-gray-700 font-medium">
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 relative z-0">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white ${
                        fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      required={!isLogin}
                      disabled={isLoading}
                    />
                    {fieldErrors.name && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white ${
                      fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    required
                    disabled={isLoading}
                  />
                  {fieldErrors.email && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="off"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={isLogin ? "Enter your password" : "Create a password"}
                    className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white ${
                      fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    required
                    disabled={isLoading}
                  />
                  {fieldErrors.password && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {fieldErrors.password}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      autoComplete="off"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white ${
                        fieldErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      required={!isLogin}
                      disabled={isLoading}
                    />
                    {fieldErrors.confirmPassword && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {fieldErrors.confirmPassword}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                {isLoading && (
                  <div className="absolute inset-0 bg-blue-700 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
                <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button 
                type="button"
                className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 text-gray-700 text-sm font-medium"
              >
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>
              <button 
                type="button"
                className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 text-gray-700 text-sm font-medium"
              >
                <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
            </div>

            {/* Toggle Form */}
            <div className="mt-6 text-center">
              <p className="text-gray-700 text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-center text-gray-500">
                Protected by industry-standard security. Your data is safe with us.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
