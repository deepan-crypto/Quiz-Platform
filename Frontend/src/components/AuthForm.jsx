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
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
      {/* Floating geometric shapes and icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Existing floating circles */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-white/5 rounded-full blur-lg animate-float-delayed"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-white/5 rounded-full blur-2xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-white/10 rounded-full blur-xl animate-bounce-slow"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-white/5 rounded-full blur-lg animate-float-reverse"></div>
        <div className="absolute top-3/4 right-1/4 w-20 h-20 bg-white/10 rounded-full blur-xl animate-spin-slow"></div>
        {/* More visible floating icons */}
        <User className="absolute top-10 left-1/4 w-12 h-12 text-blue-500/80 drop-shadow-lg animate-float" />
        <Lock className="absolute bottom-24 right-1/4 w-14 h-14 text-blue-700/70 drop-shadow-lg animate-float-delayed" />
        <BookOpen className="absolute top-1/2 left-1/2 w-16 h-16 text-indigo-500/80 drop-shadow-lg animate-float-reverse" />
        <User className="absolute bottom-10 right-1/3 w-10 h-10 text-cyan-500/80 drop-shadow animate-spin-slow" />
        <Lock className="absolute top-1/3 right-1/5 w-10 h-10 text-blue-400/80 drop-shadow animate-bounce-slow" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in-up">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 transform transition-all duration-500 hover:shadow-3xl hover:scale-105">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform transition-all duration-300 hover:rotate-12 hover:scale-110 animate-bounce-in">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 animate-slide-in-left">QuizMaster</h1>
            <p className="text-gray-600 animate-slide-in-right">
              {selectedRole === 'admin'
                ? (isLogin ? 'Admin login - Manage quizzes and users' : 'Create your admin account')
                : (isLogin ? 'Test your knowledge, challenge your mind' : 'Start your quiz journey today')
              }
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
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
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10">
              <div className="bg-white/90 rounded-2xl p-6 flex items-center gap-4 shadow-lg">
                <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-gray-700 font-medium">
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-delayed relative z-0">
            {!isLogin && (
              <div className="animate-slide-down">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50/50 hover:bg-white/80 focus:bg-white transform hover:scale-105 focus:scale-105 ${
                      fieldErrors.name ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    required={!isLogin}
                    disabled={isLoading}
                  />
                  {fieldErrors.name && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50/50 hover:bg-white/80 focus:bg-white transform hover:scale-105 focus:scale-105 ${
                    fieldErrors.email ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  required
                  disabled={isLoading}
                />
                {fieldErrors.email && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="off"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={isLogin ? "Enter your password" : "Create a password"}
                  className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50/50 hover:bg-white/80 focus:bg-white transform hover:scale-105 focus:scale-105 ${
                    fieldErrors.password ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  required
                  disabled={isLoading}
                />
                {fieldErrors.password && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {fieldErrors.password}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="animate-slide-down">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    autoComplete="off"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50/50 hover:bg-white/80 focus:bg-white transform hover:scale-105 focus:scale-105 ${
                      fieldErrors.confirmPassword ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    required={!isLogin}
                    disabled={isLoading}
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all duration-200 hover:scale-110"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-all duration-200 hover:scale-105"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
            >
              {isLoading && (
                <div className="absolute inset-0 bg-blue-600 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
              <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </span>
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-6 animate-fade-in-up-delayed">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 hover:shadow-md">
                <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-2 text-sm font-medium text-gray-700">Google</span>
              </button>
              <button className="flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 hover:shadow-md">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="ml-2 text-sm font-medium text-gray-700">Facebook</span>
              </button>
            </div>
          </div>

          {/* Toggle Form */}
          <div className="mt-6 text-center animate-fade-in-up-delayed">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-blue-600 hover:text-blue-700 font-semibold transition-all duration-200 hover:scale-105"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
