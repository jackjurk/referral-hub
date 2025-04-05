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
        { name: 'Coinbase', code: 'NEWBTC', description: '$5 in BTC + up to $200 trading bonus' },
        { name: 'Binance.US', code: 'BNBFREE', description: 'Zero trading fees + $10 in BNB' },
        { name: 'Crypto.com', code: 'CDC2024', description: '$25 bonus + 2% extra card cashback' },
        { name: 'Gemini', code: 'GEMSTART', description: '$10 BTC + 10 free trades' },
        { name: 'BlockFi', code: 'BLOCKSTART', description: '$50 BTC with $100 deposit' },
        { name: 'Kraken', code: 'KRKSTART', description: '0.1% trading fees for 30 days' }
      ]
    },
    { 
      id: 'food', 
      name: 'Food Delivery', 
      price: '$10', 
      description: 'Unlock exclusive food delivery promotions and referral codes',
      content: [
        { name: 'DoorDash', code: 'DASH2024', description: '$30 off first 2 orders + free delivery' },
        { name: 'UberEats', code: 'EATS75', description: '75% off first order up to $25' },
        { name: 'GrubHub', code: 'GRUB40', description: '40% off first order up to $20' },
        { name: 'Postmates', code: 'PMATES', description: 'Free delivery + $15 off first order' },
        { name: 'Caviar', code: 'CAVNEW', description: '$40 off first 2 luxury orders' },
        { name: 'Seamless', code: 'SMOOTH', description: '$20 off first 2 orders' },
        { name: 'ChowNow', code: 'CHOWNOW', description: '25% off first 3 local orders' },
        { name: 'Delivery.com', code: 'DELFREE', description: 'Free delivery for 2 months' },
        { name: 'EatStreet', code: 'STREET50', description: '50% off first order up to $30' }
      ]
    },
    { 
      id: 'sports', 
      name: 'Sports Betting', 
      price: '$10', 
      description: 'Access premium sports betting offers and bonuses',
      content: [
        { name: 'DraftKings', code: 'DK1000', description: 'Up to $1000 deposit match + $50 free' },
        { name: 'FanDuel', code: 'FD150', description: '$150 bonus bets, no deposit needed' },
        { name: 'BetMGM', code: 'MGMWIN', description: 'First bet paid back up to $1500' },
        { name: 'Caesars', code: 'CZRMAX', description: '$1000 bonus + 1000 tier credits' },
        { name: 'BetRivers', code: 'RIVERS', description: '2nd chance bet up to $500' },
        { name: 'WynnBet', code: 'WYNNVIP', description: 'Bet $100, get $100 free bet' }
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
        { name: 'Netflix', code: 'NFLXNEW', description: 'First 3 months at $6.99/month' },
        { name: 'Hulu', code: 'HULU2024', description: '$2/month for 12 months, all plans' },
        { name: 'Disney+', code: 'DISNEYYR', description: '12 months for price of 10' },
        { name: 'HBO Max', code: 'HBOSTART', description: '7-day free trial + 20% off year' },
        { name: 'Paramount+', code: 'PARAMNT', description: '30-day free trial + $30 off annual' },
        { name: 'Apple TV+', code: 'APPLETV', description: '6 months free with new device' },
        { name: 'YouTube TV', code: 'YTNEW', description: '$54.99/month for 3 months' },
        { name: 'Peacock', code: 'PEACOCK', description: 'Premium for $2.99/month, 1 year' },
        { name: 'Discovery+', code: 'DISCOVER', description: 'Ad-free plan $4.99/month, 1 year' }
      ]
    },
    { 
      id: 'travel',
      name: 'Travel',
      price: '$10',
      image: '✈️',
      description: 'Hotel and airline booking discounts',
      content: [
        { name: 'Expedia', code: 'EXPACK', description: '$200 off $1000+ packages + free insurance' },
        { name: 'Hotels.com', code: 'BONUS', description: 'Every 5th night free + $50 credit' },
        { name: 'Booking.com', code: 'GENIUS', description: 'Instant Genius status + 15% off' },
        { name: 'Airbnb', code: 'ABNB50', description: '50% off first stay up to $200' },
        { name: 'Southwest', code: 'RAPID', description: '5000 bonus points + companion pass' },
        { name: 'Delta', code: 'SKYMILES', description: '5000 bonus miles + priority boarding' },
        { name: 'United', code: 'UNITED24', description: 'Double miles first 3 months' },
        { name: 'Priceline', code: 'VIP2024', description: 'Name your price + 5% extra off' },
        { name: 'KAYAK', code: 'KAYAKPRO', description: 'Price alerts + $50 hotel credit' }
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
