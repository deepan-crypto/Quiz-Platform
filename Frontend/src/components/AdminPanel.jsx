import React, { useState, useEffect } from 'react';
import { Plus, Copy, BookOpen, Users, Code, LogOut, BarChart2, Edit, Save, X, Eye } from 'lucide-react';
// Types are now defined as JSDoc comments in types files

export function AdminPanel({ quizzes, onCreateQuiz, onLogout, user }) {
  const [topicInput, setTopicInput] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(3);
  const [difficulty, setDifficulty] = useState('easy');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [quizResults, setQuizResults] = useState({});
  const [loadingResults, setLoadingResults] = useState({});

  // Quiz editing state
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editingQuestions, setEditingQuestions] = useState([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch results for all quizzes when component mounts or when quizzes change
  useEffect(() => {
    console.log('AdminPanel useEffect triggered, quizzes:', quizzes);
    if (user?.id) {
      fetchAllAdminResults();
    }
  }, [quizzes, user]);

  const fetchAllAdminResults = async () => {
    if (!user?.id) return;

    console.log('Fetching all results for admin:', user.id);
    try {
      const response = await fetch(`http://localhost:3001/api/quiz/admin-results/${user.id}`);
      const data = await response.json();
      console.log('Admin results API Response:', data);

      if (data.success) {
        // Convert admin results format to the expected quiz results format
        const resultsMap = {};
        data.results.forEach(quizResult => {
          resultsMap[quizResult.quizId] = quizResult.results || [];
        });

        // Also set results for any quizzes that don't have results yet
        quizzes.forEach(quiz => {
          if (!resultsMap[quiz.id]) {
            resultsMap[quiz.id] = [];
          }
        });

        console.log('Setting quiz results map:', resultsMap);
        setQuizResults(resultsMap);
      } else {
        console.error('Error fetching admin results:', data.error);
        // Set empty arrays for all quizzes
        const emptyResults = {};
        quizzes.forEach(quiz => {
          emptyResults[quiz.id] = [];
        });
        setQuizResults(emptyResults);
      }
    } catch (error) {
      console.error('Error fetching admin results:', error);
      // Set empty arrays for all quizzes
      const emptyResults = {};
      quizzes.forEach(quiz => {
        emptyResults[quiz.id] = [];
      });
      setQuizResults(emptyResults);
    }
  };


  const generateQuizCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateQuiz = async () => {
    if (!topicInput) return;

    setIsCreating(true);

    try {
      const response = await fetch('http://localhost:3001/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topicInput,
          difficulty: difficulty,
          numberOfQuestions: numberOfQuestions,
          category: 'General',
          adminId: user?.id // Pass the current admin's ID
        }),
      });

      const data = await response.json();
      console.log('Backend response:', data); // Debug log

      if (data.success) {
        console.log('Quiz data received:', data.quiz); // Debug log
        
        // Save the generated quiz to database
        const saveResponse = await fetch('http://localhost:3001/api/quiz/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data.quiz),
        });

        const saveData = await saveResponse.json();
        
        if (saveData.success) {
          console.log('Quiz saved successfully:', saveData);
          // Update the quiz with the correct ID from the backend
          const updatedQuiz = { ...data.quiz, id: saveData.quizId };
          onCreateQuiz(updatedQuiz);

          // Refresh all admin results to include the new quiz
          setTimeout(() => {
            fetchAllAdminResults();
          }, 1000);
        } else {
          console.error('Error saving quiz:', saveData.error);
        }
      } else {
        console.error('Error generating quiz:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setTopicInput('');
      setIsCreating(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const fetchQuizResults = async (quizId) => {
    // Set loading state for this specific quiz
    setLoadingResults(prev => ({ ...prev, [quizId]: true }));

    // For individual quiz refresh, we'll refresh all admin results
    // This ensures consistency and proper data association
    try {
      await fetchAllAdminResults();
    } catch (error) {
      console.error('Error refreshing quiz results:', error);
    } finally {
      // Reset loading state for this specific quiz
      setLoadingResults(prev => ({ ...prev, [quizId]: false }));
    }
  };

  const calculateAverageScore = (results) => {
    if (results.length === 0) return 0;
    const totalScore = results.reduce((sum, result) => sum + (result.score / result.totalQuestions) * 100, 0);
    return Math.round(totalScore / results.length);
  };

  // Quiz editing functions
  const fetchQuizDetails = async (quizId) => {
    setIsLoadingQuiz(true);
    try {
      const response = await fetch(`http://localhost:3001/api/quiz/${quizId}`);
      const data = await response.json();

      if (data.success) {
        setEditingQuiz(data.quiz);
        setEditingQuestions([...data.quiz.questions]);
        setShowEditModal(true);
      } else {
        console.error('Error fetching quiz details:', data.error);
        alert('Failed to load quiz details');
      }
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      alert('Failed to load quiz details');
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const updateQuestion = (questionIndex, field, value) => {
    const updatedQuestions = [...editingQuestions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      [field]: value
    };
    setEditingQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...editingQuestions];
    const options = [...updatedQuestions[questionIndex].options];
    options[optionIndex] = value;
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options
    };
    setEditingQuestions(updatedQuestions);
  };

  const saveQuizChanges = async () => {
    if (!editingQuiz) return;

    setIsSavingQuiz(true);
    try {
      const updatedQuiz = {
        ...editingQuiz,
        questions: editingQuestions
      };

      const response = await fetch(`http://localhost:3001/api/quiz/${editingQuiz.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedQuiz),
      });

      const data = await response.json();

      if (data.success) {
        // Update the quiz in the local state
        const updatedQuizzes = quizzes.map(quiz => 
          quiz.id === editingQuiz.id ? { ...quiz, ...updatedQuiz } : quiz
        );
        onCreateQuiz(updatedQuizzes[0]); // Update the parent state
        
        setShowEditModal(false);
        setEditingQuiz(null);
        setEditingQuestions([]);
        alert('Quiz updated successfully!');
      } else {
        console.error('Error updating quiz:', data.error);
        alert('Failed to update quiz');
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      alert('Failed to update quiz');
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingQuiz(null);
    setEditingQuestions([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name}! Create and manage your quizzes</p>
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

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
            <Plus className="w-7 h-7 text-blue-600" />
            Create New Quiz
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Topic
              </label>
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Enter topic name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions
              </label>
              <input
                type="number"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                min="1"
                className="w-20 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
              />
            </div>
            
            <div className="flex-1">
              <button
                onClick={handleCreateQuiz}
                disabled={isCreating || !topicInput}
                className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                  isCreating || !topicInput ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create Quiz
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Created Quizzes */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Created Quizzes</h2>
          
          {quizzes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No quizzes created yet</p>
              <p className="text-gray-400">Create your first quiz to get started!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white/60 rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{quiz.title}</h3>
                      <p className="text-gray-600 mb-2">{quiz.questions.length} questions</p>
                      <p className="text-sm text-gray-500">
                        Created {new Date(quiz.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Code className="w-4 h-4 text-blue-600" />
                          <span className="font-mono text-lg font-bold text-blue-700">
                            {quiz.uniqueCode}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => copyToClipboard(quiz.uniqueCode)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          copiedCode === quiz.uniqueCode
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Copy className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => fetchQuizDetails(quiz.id)}
                        disabled={isLoadingQuiz}
                        className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-200 flex items-center gap-1"
                      >
                        {isLoadingQuiz ? (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                        <span className="text-sm font-medium">View/Edit</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Quiz Results Section */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-blue-500" />
                        Quiz Results
                      </h4>
                      <button
                        onClick={() => fetchQuizResults(quiz.id)}
                        disabled={loadingResults[quiz.id]}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        {loadingResults[quiz.id] ? (
                          <>
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                          </>
                        ) : (
                          'Refresh Results'
                        )}
                      </button>
                    </div>
                    
                    {(() => {
                      console.log('Rendering quiz results for', quiz.id, ':', quizResults[quiz.id]);
                      const results = quizResults[quiz.id];
                      if (results === undefined) {
                        return (
                          <div className="mt-3">
                            <p className="text-gray-500">Loading results...</p>
                          </div>
                        );
                      } else if (results.length > 0) {
                        return (
                          <div className="mt-3 space-y-4">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600">Total Attempts</p>
                                <p className="text-2xl font-bold text-blue-700">{results.length}</p>
                              </div>
                              <div className="bg-green-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600">Average Score</p>
                                <p className="text-2xl font-bold text-green-700">
                                  {calculateAverageScore(results)}%
                                </p>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600">Recent Attempt</p>
                                <p className="text-lg font-bold text-purple-700">
                                  {new Date(results[0].completedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {/* Individual Results */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h5 className="text-md font-semibold text-gray-700 mb-3">Individual Attempts</h5>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {results.map((result, index) => (
                                  <div key={index} className="flex items-center justify-between bg-white rounded p-3 shadow-sm">
                                    <div className="flex items-center gap-3">
                                      <Users className="w-4 h-4 text-blue-500" />
                                      <span className="font-medium text-gray-800">
                                        {result.userName || 'Anonymous'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                      <span className="text-gray-600">
                                        {result.score}/{result.totalQuestions} ({Math.round((result.score / result.totalQuestions) * 100)}%)
                                      </span>
                                      <span className="text-gray-500">
                                        {new Date(result.completedAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <p className="mt-3 text-gray-500">No attempts yet for this quiz.</p>
                        );
                      }
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Quiz Modal */}
        {showEditModal && editingQuiz && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Edit Quiz: {editingQuiz.title}</h2>
                <button
                  onClick={closeEditModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                <div className="space-y-6">
                  {editingQuestions.map((question, questionIndex) => (
                    <div key={questionIndex} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Question {questionIndex + 1}
                        </h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {question.correctAnswer}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question Text
                          </label>
                          <textarea
                            value={question.question}
                            onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                            rows="3"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Options
                          </label>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                                  {String.fromCharCode(65 + optionIndex)}
                                </span>
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                                <input
                                  type="radio"
                                  name={`correct-${questionIndex}`}
                                  checked={question.correctAnswer === String.fromCharCode(65 + optionIndex)}
                                  onChange={() => updateQuestion(questionIndex, 'correctAnswer', String.fromCharCode(65 + optionIndex))}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Explanation
                          </label>
                          <textarea
                            value={question.explanation || ''}
                            onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                            rows="2"
                            placeholder="Add an explanation for the correct answer..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sticky bottom-0 left-0 right-0 flex items-center justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={closeEditModal}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={saveQuizChanges}
                  disabled={isSavingQuiz}
                  className="min-w-[150px] px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingQuiz ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 shrink-0" />
                      <span className="whitespace-nowrap">Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
