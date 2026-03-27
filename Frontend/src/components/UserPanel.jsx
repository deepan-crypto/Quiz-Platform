import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, RotateCcw, Trophy, X, CheckCircle, XCircle, LogOut, History, BookOpen, Calendar, Award } from 'lucide-react';
// Types are now defined as JSDoc comments in types files

export function UserPanel({ quizzes, onLogout, user }) {
  const [quizCode, setQuizCode] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [questionResults, setQuestionResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userQuizHistory, setUserQuizHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'history'

  // Fetch user quiz history when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchUserQuizHistory();
    }
  }, [user]);

  const fetchUserQuizHistory = async () => {
    if (!user?.id) return;

    setLoadingHistory(true);
    try {
      const response = await fetch(`http://localhost:3001/api/quiz/user-results/${user.id}`);
      const data = await response.json();

      if (data.success) {
        setUserQuizHistory(data.results);
      } else {
        console.error('Error fetching user quiz history:', data.error);
      }
    } catch (error) {
      console.error('Error fetching user quiz history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleJoinQuiz = async () => {
    if (!quizCode || quizCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:3001/api/quiz/code/${quizCode}`);
      const data = await response.json();

      if (data.success) {
        setCurrentQuiz(data.quiz);
        setCurrentQuestionIndex(0);
        setQuestionResults([]);
        setShowResults(false);
        setSelectedAnswer(null);
        setShowAnswer(false);
      } else {
        setError(data.error || 'Quiz not found');
      }
    } catch (error) {
      console.error('Quiz join error:', error);

      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Network error. Please check if the backend server is running and try again.');
      } else {
        setError('An unexpected error occurred while joining the quiz. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    setShowAnswer(false);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || !currentQuiz) return;

    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === ['A', 'B', 'C', 'D'].indexOf(currentQuestion.correctAnswer);

    const result = {
      questionId: currentQuestion.id,
      selectedAnswer: ['A', 'B', 'C', 'D'][selectedAnswer],
      isCorrect
    };

    const newQuestionResults = [...questionResults, result];
    setQuestionResults(newQuestionResults);

    console.log('Answer submitted:', {
      questionIndex: currentQuestionIndex,
      selectedAnswer: ['A', 'B', 'C', 'D'][selectedAnswer],
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      questionResultsLength: newQuestionResults.length,
      totalQuestions: currentQuiz.questions.length
    });

    if (!isCorrect) {
      setShowAnswer(true);
      return;
    }

    // Move to next question or show results
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowAnswer(false);
      }, 1500);
    } else {
      console.log('Quiz completed! Showing results and sending to backend...', {
        questionResultsLength: newQuestionResults.length,
        totalQuestions: currentQuiz.questions.length
      });

      // Send quiz results to backend automatically when quiz is completed
      const score = calculateScore();

      // Use real user ID from authentication
      const userId = user?.id || `Anonymous_${Date.now()}`;
      const userName = user?.name || 'Anonymous';

      const resultData = {
        quizId: currentQuiz.id,
        userId: userId,
        userName: userName,
        score: score.correct,
        totalQuestions: score.total,
        answers: newQuestionResults,
        completedAt: new Date(),
        quizTitle: currentQuiz.title
      };

      console.log('Sending quiz result automatically:', {
        quizId: resultData.quizId,
        userId: resultData.userId,
        userNameProvided: user?.name,
        score: resultData.score,
        totalQuestions: resultData.totalQuestions,
        answersCount: resultData.answers.length
      });

      // Send results to backend with improved error handling
    try {
      const response = await fetch('http://localhost:3001/api/quiz/result', {
        method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resultData),
        });

        const data = await response.json();

        if (data.success) {
          console.log('Quiz result saved successfully with ID:', data.resultId);
        } else {
          console.error('Error saving quiz result:', data.error);
          // Could add user notification here if needed
        }
      } catch (error) {
        console.error('Error submitting quiz result:', error);
        // Could add retry logic or user notification here
      }

      setTimeout(() => {
        setShowResults(true);
      }, 1500);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      setShowResults(true);
    }
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setQuestionResults([]);
    setShowResults(false);
    setSelectedAnswer(null);
    setShowAnswer(false);
  };

  const handleBackToStart = () => {
    console.log('handleBackToStart called - resetting quiz state');

    // Reset state (results are already sent automatically when quiz completed)
    setCurrentQuiz(null);
    setQuizCode('');
    setCurrentQuestionIndex(0);
    setQuestionResults([]);
    setShowResults(false);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setError('');

    // Refresh quiz history to show newly completed quiz
    if (user?.id) {
      fetchUserQuizHistory();
    }
  };

  const calculateScore = () => {
    const correctAnswers = questionResults.filter(result => result.isCorrect).length;
    return {
      correct: correctAnswers,
      total: questionResults.length,
      percentage: Math.round((correctAnswers / questionResults.length) * 100)
    };
  };

  // Quiz Code Entry Screen
  if (!currentQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">User Dashboard</h1>
              <p className="text-gray-600">Welcome {user?.name}! Join quizzes or view your history</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Logged in as</p>
                <p className="font-semibold text-gray-800">{user?.name}</p>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-red-600"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-2 border border-white/20">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('join')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === 'join'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-purple-50'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                  Join Quiz
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === 'history'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-purple-50'
                  }`}
                >
                  <History className="w-5 h-5" />
                  Quiz History
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            {activeTab === 'join' ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Join Quiz</h2>
                  <p className="text-gray-600">Enter the quiz code provided by your instructor</p>
                  {user?.name && (
                    <p className="text-sm text-gray-500 mt-2">Logged in as: <span className="font-medium">{user.name}</span></p>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quiz Code
                    </label>
                    <input
                      type="text"
                      value={quizCode}
                      onChange={(e) => {
                        setQuizCode(e.target.value.toUpperCase());
                        setError('');
                      }}
                      placeholder="Enter 6-digit code"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 text-center text-lg font-mono tracking-widest ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      maxLength={6}
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <button
                      onClick={handleJoinQuiz}
                      disabled={quizCode.length !== 6 || loading}
                      className={`w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                        quizCode.length === 6 && !loading
                          ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg hover:-translate-y-1'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Joining Quiz...
                        </>
                      ) : (
                        <>
                          Join Quiz
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Quiz History Tab */
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">Quiz History</h2>
                  <p className="text-gray-600">View all the quizzes you've completed</p>
                </div>

                {loadingHistory ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your quiz history...</p>
                  </div>
                ) : userQuizHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No quizzes completed yet</p>
                    <p className="text-gray-400">Complete your first quiz to see it here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <Award className="w-8 h-8 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">Total Quizzes</p>
                            <p className="text-2xl font-bold text-blue-700">{userQuizHistory.length}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <Trophy className="w-8 h-8 text-green-600" />
                          <div>
                            <p className="text-sm text-gray-600">Average Score</p>
                            <p className="text-2xl font-bold text-green-700">
                              {userQuizHistory.length > 0
                                ? Math.round(userQuizHistory.reduce((sum, quiz) => sum + ((quiz.score / quiz.totalQuestions) * 100), 0) / userQuizHistory.length)
                                : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-8 h-8 text-purple-600" />
                          <div>
                            <p className="text-sm text-gray-600">Latest Quiz</p>
                            <p className="text-lg font-bold text-purple-700">
                              {userQuizHistory.length > 0
                                ? new Date(userQuizHistory[0].completedAt).toLocaleDateString()
                                : 'None'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quiz History List */}
                    <div className="space-y-3">
                      {userQuizHistory.map((quiz, index) => (
                        <div
                          key={index}
                          className="bg-white/60 rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-gray-800 mb-2">{quiz.quizTitle}</h3>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-4 h-4" />
                                  {quiz.quizCategory}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  quiz.quizDifficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                  quiz.quizDifficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {quiz.quizDifficulty}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(quiz.completedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-purple-700">
                                  {Math.round((quiz.score / quiz.totalQuestions) * 100)}%
                                </div>
                                <div className="text-sm text-gray-600">
                                  {quiz.score}/{quiz.totalQuestions} correct
                                </div>
                              </div>
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                (quiz.score / quiz.totalQuestions) >= 0.7 ? 'bg-green-100' :
                                (quiz.score / quiz.totalQuestions) >= 0.5 ? 'bg-yellow-100' : 'bg-red-100'
                              }`}>
                                {(quiz.score / quiz.totalQuestions) >= 0.7 ? (
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                ) : (quiz.score / quiz.totalQuestions) >= 0.5 ? (
                                  <Trophy className="w-6 h-6 text-yellow-600" />
                                ) : (
                                  <XCircle className="w-6 h-6 text-red-600" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (showResults) {
    console.log('Results screen displayed:', {
      questionResultsLength: questionResults.length,
      totalQuestions: currentQuiz.questions.length,
      currentQuizId: currentQuiz.id
    });
    const score = calculateScore();
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  score.percentage >= 70 ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  <Trophy className={`w-10 h-10 ${
                    score.percentage >= 70 ? 'text-green-600' : 'text-orange-600'
                  }`} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h1>
                <p className="text-gray-600">Here are your results for {currentQuiz.title}</p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-700 mb-2">
                    {score.percentage}%
                  </div>
                  <p className="text-gray-700">
                    {score.correct} out of {score.total} correct
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {currentQuiz.questions.map((question, index) => {
                  const result = questionResults[index];
                  if (!result) return null;
                  
                  return (
                    <div
                      key={question.id}
                      className={`p-4 rounded-xl border-2 ${
                        result.isCorrect
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {result.isCorrect ? (
                          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 mb-2">
                            {question.question}
                          </p>
                          <p className={`text-sm ${
                            result.isCorrect ? 'text-green-700' : 'text-red-700'
                          }`}>
                            Your answer: {question.options[['A', 'B', 'C', 'D'].indexOf(result.selectedAnswer)]}
                          </p>
                          {!result.isCorrect && (
                            <p className="text-sm text-green-700 mt-1">
                              Correct answer: {question.options[['A', 'B', 'C', 'D'].indexOf(question.correctAnswer)]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRetakeQuiz}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <RotateCcw className="w-5 h-5" />
                  Retake Quiz
                </button>
                <button
                  onClick={handleBackToStart}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                  New Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Question Screen
  const currentQuestion = currentQuiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === currentQuiz.questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{currentQuiz.title} Quiz</h1>
              <p className="text-gray-600">
                Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
              </p>
            </div>
            <button
              onClick={handleBackToStart}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-xl transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/60 rounded-full h-3 mb-8">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{
                width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%`
              }}
            />
          </div>

          {/* Question Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showAnswer}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                    selectedAnswer === index
                      ? showAnswer
                        ? index === ['A', 'B', 'C', 'D'].indexOf(currentQuestion.correctAnswer)
                          ? 'bg-green-100 border-green-300 text-green-800'
                          : 'bg-red-100 border-red-300 text-red-800'
                        : 'bg-purple-100 border-purple-300 text-purple-800'
                      : showAnswer && index === ['A', 'B', 'C', 'D'].indexOf(currentQuestion.correctAnswer)
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : 'bg-white/50 border-gray-200 text-gray-800 hover:bg-purple-50 hover:border-purple-200'
                  } ${showAnswer ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 hover:shadow-md'}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showAnswer && selectedAnswer === index && index !== ['A', 'B', 'C', 'D'].indexOf(currentQuestion.correctAnswer) && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    {showAnswer && index === ['A', 'B', 'C', 'D'].indexOf(currentQuestion.correctAnswer) && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {showAnswer && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-blue-800 font-medium mb-2">Explanation:</p>
                <p className="text-blue-700">{currentQuestion.explanation}</p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={handleBackToStart}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5" />
                Exit Quiz
              </button>

              {!showAnswer ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    selectedAnswer !== null
                      ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg hover:-translate-y-1'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Submit Answer
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  {isLastQuestion ? 'View Results' : 'Next Question'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}