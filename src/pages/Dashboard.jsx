import { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('food');
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const navigate = useNavigate();

  const categories = [
    { id: 'food', name: 'Food Delivery', price: '$1', description: 'Unlock exclusive food delivery promotions and referral codes' },
    { id: 'sports', name: 'Sports Betting', price: '$25', description: 'Access premium sports betting offers and bonuses' },
    { id: 'retail', name: 'Retail', price: '$1', description: 'Get special shopping discounts and cashback offers' },
    { id: 'rideshare', name: 'Ride Share', price: '$5', description: 'Save on your rides with exclusive promo codes' },
    { id: 'gambling', name: 'Gambling', price: '$25', description: 'Premium gambling offers and referral bonuses' }
  ];

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUser({ id: auth.currentUser.uid, ...userDoc.data() });
        } else {
          // Initialize user document if it doesn't exist
          const userData = {
            email: auth.currentUser.email,
            unlockedReferrals: [],
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', auth.currentUser.uid), userData);
          setUser({ id: auth.currentUser.uid, ...userData });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (auth.currentUser) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleUnlockClick = (category) => {
    setSelectedCategory(category);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedCategory) return;
    
    const categoryId = selectedCategory.id;
    setUnlocking(true);
    setError('');
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      const unlockedReferrals = userData.unlockedReferrals || [];

      if (unlockedReferrals.includes(categoryId)) {
        setError('You have already unlocked this category');
        return;
      }

      // In a real app, we would handle payment here
      await updateDoc(userRef, {
        unlockedReferrals: [...unlockedReferrals, categoryId]
      });

      setUser({ ...user, unlockedReferrals: [...unlockedReferrals, categoryId] });
      setError('Category unlocked successfully!');
    } catch (error) {
      setError('Failed to unlock category: ' + error.message);
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Referral Hub</h1>
            </div>
            <div className="flex items-center">
              <span className="mr-4">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-4 border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === category.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow rounded-lg">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`${activeTab === category.id ? 'block' : 'hidden'}`}
            >
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.name}</h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">{category.description}</p>
                
                {user?.unlockedReferrals?.includes(category.id) ? (
                  <div className="bg-green-50 p-4 rounded-lg inline-block">
                    <p className="text-green-700">You've unlocked this category!</p>
                    <p className="text-sm text-green-600 mt-2">Check back soon for new offers.</p>
                  </div>
                ) : (
                  <button
                    onClick={() => handleUnlockClick(category)}
                    disabled={unlocking}
                    className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {unlocking ? 'Processing...' : `Unlock Now - ${category.price}`}
                  </button>
                )}
                
                {error && (
                  <p className={`mt-4 text-sm ${error.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                    {error}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        category={selectedCategory}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
