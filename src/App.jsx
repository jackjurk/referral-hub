import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, db } from './services/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Import pages (to be created)
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AgeVerification from './pages/AgeVerification';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ageVerified, setAgeVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setAgeVerified(userDoc.data().ageVerified || false);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route 
          path="/age-verification" 
          element={
            user && !ageVerified 
              ? <AgeVerification setAgeVerified={setAgeVerified} /> 
              : <Navigate to="/" />
          } 
        />
        <Route 
          path="/*" 
          element={
            user 
              ? (ageVerified ? <Dashboard /> : <Navigate to="/age-verification" />)
              : <Navigate to="/login" />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
