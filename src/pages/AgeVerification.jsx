import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function AgeVerification({ setAgeVerified }) {
  useEffect(() => {
    console.log('AgeVerification component mounted');
    if (!auth.currentUser) {
      console.log('No user found, redirecting to login');
      navigate('/login');
    } else {
      console.log('Current user:', auth.currentUser.email);
    }
  }, []);
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ageNum = parseInt(age);

    if (isNaN(ageNum) || ageNum < 18) {
      setError('You must be at least 18 years old to use this service.');
      return;
    }

    try {
      console.log('Starting age verification process...');
      if (!auth.currentUser) {
        throw new Error('No user is signed in');
      }

      const userId = auth.currentUser.uid;
      console.log('User ID:', userId);
      const userRef = doc(db, 'users', userId);
      
      console.log('Checking if user document exists...');
      const userDoc = await getDoc(userRef);
      
      const userData = {
        ageVerified: true,
        is21Plus: ageNum >= 21,
        verifiedAt: new Date().toISOString()
      };

      console.log('Updating user data:', userData);

      if (!userDoc.exists()) {
        console.log('Creating new user document...');
        await setDoc(userRef, {
          ...userData,
          email: auth.currentUser.email,
          createdAt: new Date().toISOString(),
          usedReferrals: [],
          unlockedReferrals: []
        });
      } else {
        console.log('Updating existing user document...');
        await setDoc(userRef, userData, { merge: true });
      }

      console.log('Database update successful');
      console.log('Setting age verified state...');
      setAgeVerified(true);
      console.log('Navigating to dashboard...');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Age verification error:', error);
      setError('Failed to verify age: ' + error.message);
      if (error.code === 'permission-denied') {
        setError('Database access error. Please try logging out and back in.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Age Verification Required
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please verify your age to continue. You must be at least 18 years old to use this service.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700">
              Enter your age
            </label>
            <input
              id="age"
              name="age"
              type="number"
              required
              min="18"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Verify Age
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
