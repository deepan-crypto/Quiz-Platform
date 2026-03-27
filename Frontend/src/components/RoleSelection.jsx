import React from 'react';
import { Shield, Users, BookOpen, Settings } from 'lucide-react';

export function RoleSelection({ onRoleSelect, userName }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
      {/* Floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-white/5 rounded-full blur-lg animate-bounce"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-white/5 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-white/10 rounded-full blur-xl animate-bounce"></div>
      </div>

      <div className="w-full max-w-4xl relative">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {userName}!</h1>
            <p className="text-gray-600 text-lg">Choose your role to get started</p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Admin Role */}
            <div 
              onClick={() => onRoleSelect('admin')}
              className="group cursor-pointer bg-white/60 rounded-2xl p-8 border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Admin</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Create and manage quizzes, generate quiz codes, and monitor quiz activities. Perfect for educators and quiz creators.
                </p>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Settings className="w-5 h-5 text-blue-500" />
                    <span>Create custom quizzes</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    <span>Generate shareable codes</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span>Manage quiz sessions</span>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300">
                    Continue as Admin
                  </div>
                </div>
              </div>
            </div>

            {/* User Role */}
            <div 
              onClick={() => onRoleSelect('user')}
              className="group cursor-pointer bg-white/60 rounded-2xl p-8 border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">User</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Join quizzes using codes, test your knowledge, and track your progress. Perfect for students and quiz takers.
                </p>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3 text-gray-700">
                    <BookOpen className="w-5 h-5 text-green-500" />
                    <span>Take interactive quizzes</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span>Get instant feedback</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Settings className="w-5 h-5 text-green-500" />
                    <span>Track your scores</span>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold group-hover:from-green-600 group-hover:to-green-700 transition-all duration-300">
                    Continue as User
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Note: You can change your role anytime by logging out and logging back in
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}