import React, { useState, useEffect } from 'react';
import { AuthForm } from './components/AuthForm';
import { AdminPanel } from './components/AdminPanel';
import { UserPanel } from './components/UserPanel';
import { RoleSelection } from './components/RoleSelection';
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
        const response = await fetch(`http://localhost:3001/api/quiz/admin/${authState.user.id}`);
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

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };
  
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
}

export default App;