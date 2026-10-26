import React, { useState, useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { AdminPanel } from './components/AdminPanel';
import { UserPanel } from './components/UserPanel';
import { RoleSelection } from './components/RoleSelection';
import API_BASE_URL from './config/api';
// Types are now defined as JSDoc comments in types files

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null
  });
  const [quizzes, setQuizzes] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Fetch quizzes when app loads for admins
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!authState.user?.id) return;

      try {
        // Use admin-specific endpoint to get only quizzes created by this admin
        const response = await fetch(`${API_BASE_URL}/api/quiz/admin/${authState.user.id}`);
        const data = await response.json();

        if (data.success) {
          console.log('Fetched quizzes for admin:', authState.user.id, data.quizzes);
          setQuizzes(data.quizzes);
        } else {
          console.error('Error fetching admin quizzes:', data.error);
          setQuizzes([]);
        }
      } catch (error) {
        console.error('Error fetching admin quizzes:', error);
        setQuizzes([]);
      }
    };

    // Only fetch quizzes if user is authenticated as admin
    if (authState.isAuthenticated && authState.user?.role === 'admin') {
      fetchQuizzes();
    } else {
      // Clear quizzes if not an admin or not authenticated
      setQuizzes([]);
    }
  }, [authState]);
  
      const handleAuth = (userData) => {
            console.log('User authenticated:', userData); // Debug log
            console.log('User role from backend:', userData.role); // Debug log

        // Create user object with real data from backend
        const user = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        };

       console.log('User object created:', user); // Debug log

       setAuthState({
         isAuthenticated: true,
         user
       });
     };
    
  const handleCreateQuiz = (newQuiz) => {
    console.log('Adding/Updating quiz in state:', newQuiz); // Debug log
    setQuizzes(prevQuizzes => {
      // Check if the quiz already exists
      const existingQuizIndex = prevQuizzes.findIndex(q => q.id === newQuiz.id);
      
      if (existingQuizIndex >= 0) {
        // Update existing quiz
        const updatedQuizzes = [...prevQuizzes];
        updatedQuizzes[existingQuizIndex] = newQuiz;
        return updatedQuizzes;
      } else {
        // Add new quiz
        return [...prevQuizzes, newQuiz];
      }
    });
  };
  
  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null
    });
    setSelectedRole(null); // Reset role selection on logout
    setQuizzes([]); // Clear quizzes to prevent data leakage between admin sessions
  };

  // Early pre-warming ping for Render free tier backend
  const [serverWarmup, setServerWarmup] = useState({
    status: 'checking', // 'checking' | 'waking' | 'ready' | 'idle'
    message: ''
  });

  useEffect(() => {
    let isMounted = true;
    // If backend takes longer than 2.5 seconds to respond, show warming status
    const timer = setTimeout(() => {
      if (isMounted) {
        setServerWarmup({
          status: 'waking',
          message: 'Connecting to server (waking up free tier instance, ~30s)...'
        });
      }
    }, 2500);

    fetch(`${API_BASE_URL}/health`)
      .then((res) => res.json())
      .then(() => {
        clearTimeout(timer);
        if (isMounted) {
          setServerWarmup((prev) => {
            if (prev.status === 'waking') {
              setTimeout(() => {
                if (isMounted) setServerWarmup({ status: 'idle', message: '' });
              }, 3000);
              return { status: 'ready', message: 'Backend connected successfully!' };
            }
            return { status: 'idle', message: '' };
          });
        }
      })
      .catch((err) => {
        clearTimeout(timer);
        console.warn('Initial server warmup check:', err.message);
      });

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };
  
  const renderContent = () => {
    // Show role selection if no role is selected
    if (!selectedRole) {
      return <RoleSelection onRoleSelect={handleRoleSelect} />;
    }

    // Show authentication form if not authenticated but role is selected
    if (!authState.isAuthenticated) {
      return <AuthForm onAuth={handleAuth} selectedRole={selectedRole} />;
    }
    
    // Show appropriate panel based on user role
    console.log('User role check:', authState.user?.role, 'Full user object:', authState.user);
    if (authState.user?.role === 'admin') {
      console.log('Rendering AdminPanel with user:', authState.user);
      return (
        <AdminPanel
          quizzes={quizzes}
          onCreateQuiz={handleCreateQuiz}
          onLogout={handleLogout}
          user={authState.user}
        />
      );
    }

    console.log('Rendering UserPanel with user:', authState.user);
    console.log('User name being passed:', authState.user?.name || 'EMPTY');

    return (
      <UserPanel
        quizzes={quizzes}
        onLogout={handleLogout}
        user={authState.user}
      />
    );
  };

  return (
    <>
      {serverWarmup.status !== 'idle' && serverWarmup.status !== 'checking' && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-xs md:text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
            serverWarmup.status === 'ready'
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-indigo-600 text-white shadow-indigo-500/20 animate-pulse'
          }`}
        >
          {serverWarmup.status === 'waking' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
              <span>{serverWarmup.message}</span>
            </>
          ) : (
            <>
              <span>✓</span>
              <span>{serverWarmup.message}</span>
            </>
          )}
        </div>
      )}
      {renderContent()}
    </>
  );
}

export default App;