import React, { useState } from 'react';
import { Play, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
// Types are now defined as JSDoc comments in types/quiz.js

export function QuizParticipation({ onBack }) {
  const [quizCode, setQuizCode] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizResults, setQuizResults] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchQuizByCode = async () => {
    if (!quizCode || quizCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:3001/api/quiz/code/${quizCode}`);
      const data = await response.json();

      if (data.success) {
        setCurrentQuiz(data.quiz);
      } else {
        setError(data.error || 'Quiz not found');
      }
    } catch (error) {
      setError('Failed to fetch quiz');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (index) => {
    setSelectedAnswer(index);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null || !currentQuiz) return;

    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === ['A', 'B', 'C', 'D'].indexOf(currentQuestion.correctAnswer);

    // Save result
    const result = {
      questionId: currentQuestion.id,
      selectedAnswer: ['A', 'B', 'C', 'D'][selectedAnswer],
      isCorrect: isCorrect
    };

    const newQuizResults = [...quizResults, result];
    setQuizResults(newQuizResults);

    // Move to next question or complete quiz
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      // Quiz completed - send results to backend
      console.log('Quiz completed! Sending results to backend...');
      sendQuizResults(newQuizResults);
      setQuizCompleted(true);
    }
  };

  const calculateScore = () => {
    return quizResults.filter(result => result.isCorrect).length;
  };

  const sendQuizResults = async (finalResults) => {
    if (!currentQuiz || !finalResults || finalResults.length === 0) return;

    const score = finalResults.filter(result => result.isCorrect).length;
    const userId = `Anonymous_${Date.now()}`;

    const resultData = {
      quizId: currentQuiz.id,
      userId: userId,
      userName: 'Anonymous User',
      score: score,
      totalQuestions: currentQuiz.questions.length,
      answers: finalResults,
      completedAt: new Date()
    };

    try {
      console.log('Sending quiz result from QuizParticipation:', {
        quizId: resultData.quizId,
        userId: resultData.userId,
        score: resultData.score,
        totalQuestions: resultData.totalQuestions,
        answersCount: resultData.answers.length
      });

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
        setSubmitSuccess(true);
        // Clear success message after 3 seconds
        setTimeout(() => setSubmitSuccess(false), 3000);
      } else {
        console.error('Error saving quiz result:', data.error);
      }
    } catch (error) {
      console.error('Error submitting quiz result:', error);
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setQuizResults([]);
    setQuizCompleted(false);
    setQuizCode('');
    setSubmitSuccess(false);
  };

  if (!currentQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 w-full max-w-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Enter Quiz Code
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                6-Digit Quiz Code
              </label>
              <input
                type="text"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 text-center font-mono text-lg"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div className="flex gap-4">
              <button
                onClick={onBack}
                className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-gray-600"
              >
                Back
              </button>
              <button
                onClick={fetchQuizByCode}
                disabled={loading || quizCode.length !== 6}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Start Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const score = calculateScore();
    const totalQuestions = currentQuiz.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 w-full max-w-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Quiz Completed!
          </h2>

          {submitSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Results submitted successfully!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">Your quiz results have been sent to the admin panel.</p>
            </div>
          )}

          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-800 mb-2">
              {score} / {totalQuestions}
            </div>
            <div className="text-2xl font-semibold text-blue-600 mb-4">
              {percentage}%
            </div>
            <div className="text-gray-600">
              {percentage >= 80 ? 'Excellent!' : 
               percentage >= 60 ? 'Good job!' : 
               percentage >= 40 ? 'Not bad!' : 'Keep practicing!'}
            </div>
          </div>

          <div className="space-y-4">
            {currentQuiz.questions.map((question, index) => {
              const result = quizResults[index];
              return (
                <div key={question.id} className="p-4 border rounded-lg">
                  <p className="font-semibold mb-2">{question.question}</p>
                  <p className={`text-sm ${result?.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {result?.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </p>
                </div>
              );
            })}
          </div>

          <button
            onClick={resetQuiz}
            className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            Take Another Quiz
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = currentQuiz.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            {currentQuiz.title}
          </h2>
          <div className="text-gray-600">
            Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {currentQuestion.question}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                  selectedAnswer === index
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-gray-600"
          >
            Back
          </button>
          
          <button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
