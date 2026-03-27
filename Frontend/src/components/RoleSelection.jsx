import React from 'react';
import { Shield, Users, BookOpen, Settings } from 'lucide-react';

export function RoleSelection({ onRoleSelect, userName }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-5xl relative">
        <div className="rounded-2xl shadow-2xl overflow-hidden">
          {/* Header - College Themed */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 px-8 py-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Sri Eshwar College of Engineering</h2>
                  <p className="text-blue-200 text-sm">Quiz & Assessment Platform</p>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold mb-2">Welcome, {userName}!</h1>
              <p className="text-blue-100 text-lg">Select your role to continue</p>
            </div>
          </div>

          {/* Role Cards */}
          <div className="bg-white p-8 lg:p-12">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Admin Role */}
              <div 
                onClick={() => onRoleSelect('admin')}
                className="group cursor-pointer bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">Faculty/Admin</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                    Create and manage quizzes, generate share codes, and monitor student performance across your courses.
                  </p>
                  
                  <div className="space-y-3 text-left mb-8 bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Settings className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm font-medium">Create & customize quizzes</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm font-medium">Generate shareable codes</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm font-medium">Track student results</span>
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold group-hover:from-blue-700 group-hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl">
                    Continue as Faculty
                  </button>
                </div>
              </div>

              {/* User Role */}
              <div 
                onClick={() => onRoleSelect('user')}
                className="group cursor-pointer bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-green-300 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">Student</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                    Join quizzes using codes, test your knowledge, receive instant feedback, and track your performance.
                  </p>
                  
                  <div className="space-y-3 text-left mb-8 bg-green-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 text-gray-700">
                      <BookOpen className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-medium">Take interactive quizzes</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-medium">Get instant feedback</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Settings className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-medium">View score analytics</span>
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold group-hover:from-green-700 group-hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl">
                    Continue as Student
                  </button>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-8 max-w-4xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-gray-700 text-sm">
                  <span className="font-semibold">Tip:</span> You can change your role anytime by logging out and logging back in with a different role selection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}