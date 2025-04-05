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
    { 
      id: 'crypto',
      name: 'Crypto',
      price: '$10',
      image: '💰',
      description: 'Cryptocurrency exchange bonuses and rewards',
      content: [
        { name: 'Coinbase', code: 'CB100', description: '$100 in free Bitcoin with $1000 deposit' },
        { name: 'Binance.US', code: 'BNB50', description: '$50 in BNB token signup bonus' },
        { name: 'Crypto.com', code: 'CRO25', description: '$25 in CRO + metal card perks' },
        { name: 'Gemini', code: 'GEM20', description: '$20 Bitcoin welcome bonus' },
        { name: 'BlockFi', code: 'BF250', description: '$250 in crypto with $100 deposit' },
        { name: 'Kraken', code: 'KRKN75', description: '$75 trading fee credit' }
      ]
    },
    { 
      id: 'food', 
      name: 'Food Delivery', 
      price: '$10', 
      description: 'Unlock exclusive food delivery promotions and referral codes',
      content: [
        { name: 'DoorDash', code: 'WELCOME15', description: '$15 off first order' },
        { name: 'UberEats', code: 'EATS20', description: '20% off next 3 orders' },
        { name: 'GrubHub', code: 'GRUB10', description: '$10 off orders over $30' },
        { name: 'Postmates', code: 'POST25', description: '$25 off first 2 orders' },
        { name: 'Caviar', code: 'CAV20', description: '20% off luxury restaurants' },
        { name: 'Seamless', code: 'SEAM12', description: '$12 off first order' },
        { name: 'ChowNow', code: 'CHOW10', description: '10% off local restaurants' },
        { name: 'Delivery.com', code: 'DEL15', description: '$15 off first 3 orders' },
        { name: 'EatStreet', code: 'EAT25', description: '25% off first month' }
      ]
    },
    { 
      id: 'sports', 
      name: 'Sports Betting', 
      price: '$10', 
      description: 'Access premium sports betting offers and bonuses',
      content: [
        { name: 'DraftKings', code: 'DK200', description: '$200 sign-up bonus' },
        { name: 'FanDuel', code: 'FD100', description: '$100 risk-free bet' },
        { name: 'BetMGM', code: 'MGM50', description: '$50 free bet' },
        { name: 'Caesars', code: 'CZR1K', description: '$1000 first bet insurance' },
        { name: 'BetRivers', code: 'BR250', description: '$250 deposit match' },
        { name: 'WynnBet', code: 'WYNN100', description: '$100 free bet on signup' }
      ]
    },
    { 
      id: 'retail', 
      name: 'Retail', 
      price: '$10', 
      description: 'Get special shopping discounts and cashback offers',
      content: [
        { name: 'Amazon', code: 'SAVE30', description: '30% off first purchase' },
        { name: 'Target', code: 'NEW25', description: '$25 off $100+' },
        { name: 'Walmart', code: 'WELCOME20', description: '20% off online orders' },
        { name: 'Best Buy', code: 'BB50OFF', description: '$50 off $200+ electronics' },
        { name: 'Nike', code: 'NIKE25', description: '25% off full-price styles' },
        { name: 'Adidas', code: 'ADI30', description: '30% off sitewide' }
      ]
    },
    { 
      id: 'rideshare', 
      name: 'Ride Share', 
      price: '$10', 
      description: 'Save on your rides with exclusive promo codes',
      content: [
        { name: 'Uber', code: 'RIDE25', description: '25% off next 5 rides' },
        { name: 'Lyft', code: 'SAVE20', description: '$20 off first ride' },
        { name: 'Via', code: 'VIA15', description: '15% off all rides' },
        { name: 'Juno', code: 'JUNO30', description: '30% off first 3 rides' },
        { name: 'Gett', code: 'GETT10', description: '$10 off peak rides' },
        { name: 'Curb', code: 'CURB15', description: '15% off airport rides' }
      ]
    },
    { 
      id: 'gambling', 
      name: 'Gambling', 
      price: '$10', 
      description: 'Premium gambling offers and referral bonuses',
      content: [
        { name: 'Caesars', code: 'CZR500', description: '$500 welcome bonus' },
        { name: 'PointsBet', code: 'PB200', description: '$200 risk-free bet' },
        { name: 'BetRivers', code: 'BR100', description: '100% deposit match' },
        { name: 'Unibet', code: 'UNI250', description: '$250 risk-free first bet' },
        { name: 'FOX Bet', code: 'FOX100', description: '$100 free bet no deposit' },
        { name: 'SugarHouse', code: 'SUGAR500', description: '$500 first deposit bonus' }
      ]
    },
    { 
      id: 'streaming',
      name: 'Streaming',
      price: '$10',
      image: '📺',
      description: 'Streaming service trials and discounts',
      content: [
        { name: 'Netflix', code: 'NFLX3', description: '3 months at 50% off' },
        { name: 'Hulu', code: 'HULU99', description: '$0.99/month for 6 months' },
        { name: 'Disney+', code: 'DISNEY20', description: '20% off annual plan' },
        { name: 'HBO Max', code: 'HBO40', description: '40% off annual subscription' },
        { name: 'Paramount+', code: 'PARA50', description: '50% off first year' },
        { name: 'Apple TV+', code: 'APPLE3', description: '3 months free trial' },
        { name: 'YouTube TV', code: 'YTTV30', description: '$30 off first 3 months' },
        { name: 'Peacock', code: 'PCOCK5', description: '$5/month premium plan' },
        { name: 'Discovery+', code: 'DISC1', description: '$1/month for 3 months' }
      ]
    },
    { 
      id: 'travel',
      name: 'Travel',
      price: '$10',
      image: '✈️',
      description: 'Hotel and airline booking discounts',
      content: [
        { name: 'Expedia', code: 'EXP100', description: '$100 off $500+ packages' },
        { name: 'Hotels.com', code: 'HOTEL75', description: '$75 off 3+ night stays' },
        { name: 'Booking.com', code: 'BOOK50', description: '50% off selected hotels' },
        { name: 'Airbnb', code: 'AIR100', description: '$100 off first booking' },
        { name: 'Southwest', code: 'SWA200', description: '$200 off vacation packages' },
        { name: 'Delta', code: 'DELTA150', description: '$150 off international flights' },
        { name: 'United', code: 'UNITED100', description: '$100 off domestic flights' },
        { name: 'Priceline', code: 'PRICE20', description: '20% off express deals' },
        { name: 'KAYAK', code: 'KAYAK25', description: '25% off hotel bookings' }
      ]
    }
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

      await updateDoc(userRef, {
        unlockedReferrals: [...unlockedReferrals, categoryId]
      });

      setUser({ ...user, unlockedReferrals: [...unlockedReferrals, categoryId] });
      setShowPaymentModal(false);
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
        <div className="bg-white shadow rounded-lg p-6">
          {categories.map((category) => (
            activeTab === category.id && (
              <div key={category.id}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <span>{category.image}</span>
                      {category.name}
                    </h2>
                    <p className="text-gray-600 mt-1">{category.description}</p>
                  </div>
                  {!user?.unlockedReferrals?.includes(category.id) ? (
                    <button
                      onClick={() => handleUnlockClick(category)}
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Unlock for {category.price}
                    </button>
                  ) : (
                    <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Unlocked
                    </span>
                  )}
                </div>

                {user?.unlockedReferrals?.includes(category.id) ? (
                  <div className="space-y-4">
                    {category.content.map((promo, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold">{promo.name}</h3>
                          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md font-mono">
                            {promo.code}
                          </div>
                        </div>
                        <p className="text-gray-600">{promo.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Unlock to View Promotions</h3>
                    <p className="mt-2 text-sm text-gray-500">Purchase this category to access exclusive promotions and referral codes.</p>
                  </div>
                )}
              </div>
            )
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
