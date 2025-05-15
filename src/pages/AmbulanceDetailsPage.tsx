// AmbulanceDetailsPage.tsx - Complete component
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Mail, Star, Clock, Heart, Truck, Stethoscope,
  Shield, AlertTriangle, CheckCircle, Users, Siren, Thermometer, Clipboard,
  Navigation, Banknote, Activity, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

interface Ambulance {
  id: number;
  user: {
    fname: string;
    lname: string;
    phone: string;
    email: string;
    area: string;
    upazila: {
      name: string;
      district: {
        name: string;
        division: {
          name: string;
        };
      };
    };
  };
  ambulanceType: string;
  ambulanceNumber: string;
  ambulanceStatus: string;
  about: string;
  serviceOffers: string[];
  hospitalAffiliation: string;
  coverageAreas: string[];
  responseTime: number;
  doctors: number;
  nurses: number;
  paramedics: number;
  teamQualification: string[];
  startingFee: number;
  averageRating: number;
  totalReviews: number;
}

interface AmbulanceFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface Review {
  id: number;
  user: string;
  avatar?: string;
  rating: number;
  comment: string;
  date: string;
}

export function AmbulanceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ambulance, setAmbulance] = useState<Ambulance | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'team' | 'reviews'>('overview');
  const [showCallModal, setShowCallModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [canReview, setCanReview] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [submitReviewLoading, setSubmitReviewLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (id) fetchAmbulanceDetails(id);
  }, [id]);

  const fetchAmbulanceDetails = async (ambulanceId: string) => {
    try {
      setLoading(true);
      const { data: baseResponse } = await api.get(`/api/v1/ambulance/${ambulanceId}`);

      if (baseResponse.code === 'XS0001') {
        setAmbulance(baseResponse.data);

        // Check review eligibility
        try {
          const eligibilityResponse = await api.get(`/api/v1/ambulance/can-review/${ambulanceId}`);
          if (eligibilityResponse.data.code === 'XS0001') {
            setCanReview(!!eligibilityResponse.data.data);
          }
        } catch (error) {
          console.error('Failed to check review eligibility:', error);
        }

        // Fetch reviews if available in response
        if (baseResponse.data.reviews) {
          setReviews(baseResponse.data.reviews);
        }
      }
    } catch (error) {
      console.error('Failed to fetch ambulance details:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!ambulance || newRating < 1 || newRating > 5 || !newReview.trim()) {
      alert('Please provide a rating and review');
      return;
    }

    setSubmitReviewLoading(true);
    try {
      const response = await api.post('/api/v1/ambulance/create-ambulance-review', {
        ambulanceId: ambulance.id,
        rating: newRating,
        review: newReview.trim()
      });

      if (response.data.code === 'XS0001') {
        alert('Review submitted successfully!');
        setNewRating(0);
        setNewReview('');
        fetchAmbulanceDetails(ambulance.id.toString());
      } else {
        alert('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review');
    } finally {
      setSubmitReviewLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!ambulance) return;

    setBookingStatus('loading');
    try {
      const { data } = await api.post('/api/v1/ambulance/booking/create', {
        ambulanceId: ambulance.id,
      });

      if (data.code === 'XS0001') {
        setBookingStatus('success');
      } else {
        setBookingStatus('error');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setBookingStatus('error');
    }
  };

  const features: AmbulanceFeature[] = [
    {
      icon: <Truck className="text-red-500" size={24} />,
      title: 'Modern Ambulance Fleet',
      description: 'Equipped with latest medical technology and maintained to highest standards.'
    },
    {
      icon: <Stethoscope className="text-blue-500" size={24} />,
      title: 'Professional Medical Team',
      description: 'Qualified doctors, nurses, and paramedics trained in emergency care.'
    },
    {
      icon: <Clock className="text-green-500" size={24} />,
      title: 'Quick Response Time',
      description: 'Rapid response times ensuring help arrives when you need it most.'
    },
    {
      icon: <Shield className="text-purple-500" size={24} />,
      title: 'Safety Standards',
      description: 'Strict safety protocols and international standards compliance.'
    },
    {
      icon: <Navigation className="text-orange-500" size={24} />,
      title: 'GPS Tracking',
      description: 'Real-time tracking for efficient routing and accurate arrival times.'
    },
    {
      icon: <Banknote className="text-emerald-500" size={24} />,
      title: 'Transparent Pricing',
      description: 'Clear upfront pricing with no hidden fees or unexpected charges.'
    }
  ];

  const getAmbulanceTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'icu':
        return <Heart className="w-8 h-8 text-purple-500" />;
      case 'freezing':
        return <Thermometer className="w-8 h-8 text-blue-500" />;
      default:
        return <Truck className="w-8 h-8 text-red-500" />;
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
          <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-red-500" />
          </motion.div>
        </div>
    );
  }

  if (!ambulance) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
          <div className="text-center">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ambulance Not Found</h2>
            <p className="text-gray-600 mb-4">The ambulance you're looking for doesn't exist.</p>
            <Link
                to="/ambulance"
                className="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Services
            </Link>
          </div>
        </div>
    );
  }

  const backLink = "/ambulance";

  return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
        {/* Hero Section with Enhanced Animation */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative h-[500px] overflow-hidden"
        >
          <img
              src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1920&h=800&q=80"
              alt="Ambulance"
              className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 to-red-800/80">
            <div className="container mx-auto px-4 h-full flex items-center">
              <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="max-w-3xl"
              >
                <Link
                    to={backLink}
                    className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors group"
                >
                  <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to Ambulance Services
                </Link>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    {ambulance.user.fname} {ambulance.user.lname}
                  </h1>
                  <div className="flex flex-wrap items-center gap-6 text-white/90 mb-6">
                    <div className="flex items-center gap-2">
                      <Star className="text-yellow-400" size={20} fill="currentColor" />
                      <span className="text-lg">{ambulance.averageRating?.toFixed(1) || '0'} Rating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={20} />
                      <span className="text-lg">{ambulance.responseTime} min Response</span>
                    </div>
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`px-4 py-1 rounded-full text-sm font-medium ${
                            ambulance.ambulanceStatus === 'AVAILABLE'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                        }`}
                    >
                      {ambulance.ambulanceStatus === 'AVAILABLE' ? 'Available Now' : 'Currently Busy'}
                    </motion.div>
                  </div>
                  <p className="text-xl text-white/90">{ambulance.about}</p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="container mx-auto px-4 -mt-20 relative z-10">
          {/* Quick Info Card with Animation */}
          <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-xl p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
              >
                <div className="bg-red-100 p-4 rounded-xl">
                  {getAmbulanceTypeIcon(ambulance.ambulanceType)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Ambulance Type</h3>
                  <p className="text-gray-600 capitalize">{ambulance.ambulanceType} Ambulance</p>
                </div>
              </motion.div>

              <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
              >
                <div className="bg-green-100 p-4 rounded-xl">
                  <Banknote className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Base Fare</h3>
                  <p className="text-gray-600 font-bold text-lg">৳ {ambulance.startingFee}</p>
                </div>
              </motion.div>

              <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
              >
                <div className="bg-blue-100 p-4 rounded-xl">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Medical Team</h3>
                  <p className="text-gray-600">
                    {ambulance.doctors} Doctor{ambulance.doctors !== 1 ? 's' : ''},
                    {ambulance.nurses} Nurse{ambulance.nurses !== 1 ? 's' : ''},
                    {ambulance.paramedics} Paramedic{ambulance.paramedics !== 1 ? 's' : ''}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Main Content with Animations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2">
              {/* Animated Tabs */}
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
              >
                <div className="flex border-b">
                  {['overview', 'features', 'team', 'reviews'].map((tab) => (
                      <motion.button
                          key={tab}
                          whileHover={{ backgroundColor: '#fef2f2' }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex-1 py-4 px-6 text-center font-medium capitalize transition-colors ${
                              activeTab === tab
                                  ? 'text-red-500 border-b-2 border-red-500'
                                  : 'text-gray-600 hover:text-red-500'
                          }`}
                          onClick={() => setActiveTab(tab as typeof activeTab)}
                      >
                        {tab}
                      </motion.button>
                  ))}
                </div>

                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                          <h2 className="text-xl font-semibold mb-4">About This Service</h2>
                          <p className="text-gray-700 mb-6">{ambulance.about}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <h3 className="font-semibold mb-3">Services Offered</h3>
                              <ul className="space-y-2">
                                {ambulance.serviceOffers.map((service, idx) => (
                                    <motion.li
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-center gap-2"
                                    >
                                      <CheckCircle size={16} className="text-green-500" />
                                      <span>{service}</span>
                                    </motion.li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-3">Coverage Areas</h3>
                              <ul className="space-y-2">
                                {ambulance.coverageAreas.map((area, idx) => (
                                    <motion.li
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-center gap-2"
                                    >
                                      <MapPin size={16} className="text-blue-500" />
                                      <span>{area}</span>
                                    </motion.li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-3">Hospital Affiliation</h3>
                            <div className="flex items-center gap-2">
                              <Heart size={16} className="text-red-500" />
                              <span>{ambulance.hospitalAffiliation}</span>
                            </div>
                          </div>
                        </motion.div>
                    )}

                    {/* Features Tab */}
                    {activeTab === 'features' && (
                        <motion.div
                            key="features"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                          <h2 className="text-xl font-semibold mb-6">Key Features & Amenities</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {features.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-gray-50 rounded-xl p-4 flex items-start gap-4"
                                >
                                  <div className="bg-white p-3 rounded-lg shadow-sm">
                                    {feature.icon}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold">{feature.title}</h3>
                                    <p className="text-sm text-gray-600">{feature.description}</p>
                                  </div>
                                </motion.div>
                            ))}
                          </div>
                          <div className="bg-red-50 rounded-xl p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                              <Clipboard className="text-red-500" />
                              Equipment Available
                            </h3>
                            <ul className="grid grid-cols-2 gap-3">
                              {[
                                'Advanced Life Support',
                                'Cardiac Monitor',
                                'Defibrillator',
                                'Ventilator Support',
                                'Oxygen Supply',
                                'Emergency Medications',
                                'Trauma Kit',
                                'Patient Monitoring System'
                              ].map((item, idx) => (
                                  <motion.li
                                      key={idx}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: idx * 0.05 }}
                                      className="flex items-center gap-2 text-gray-700"
                                  >
                                    <CheckCircle size={16} className="text-green-500" />
                                    {item}
                                  </motion.li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                    )}

                    {/* Medical Team Tab */}
                    {activeTab === 'team' && (
                        <motion.div
                            key="team"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                          <h2 className="text-xl font-semibold mb-6">Medical Team</h2>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                              { count: ambulance.doctors, label: 'Doctor', icon: <Stethoscope className="text-blue-500" size={32} /> },
                              { count: ambulance.nurses, label: 'Nurse', icon: <Heart className="text-green-500" size={32} /> },
                              { count: ambulance.paramedics, label: 'Paramedic', icon: <Users className="text-purple-500" size={32} /> },
                            ].map((team, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ scale: 1.05 }}
                                    className="bg-gray-50 rounded-xl p-6 text-center"
                                >
                                  <motion.div
                                      animate={{ rotate: [0, 10, -10, 0] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                      className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm"
                                  >
                                    {team.icon}
                                  </motion.div>
                                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{team.count}</h3>
                                  <p className="text-gray-600">{team.label}{team.count !== 1 && 's'}</p>
                                </motion.div>
                            ))}
                          </div>

                          <div className="mt-8">
                            <h3 className="font-semibold mb-4">Team Qualifications</h3>
                            <ul className="space-y-2">
                              {ambulance.teamQualification?.map((qual, idx) => (
                                  <motion.li
                                      key={idx}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.1 }}
                                      className="flex items-center gap-2"
                                  >
                                    <CheckCircle size={16} className="text-green-500" />
                                    <span>{qual}</span>
                                  </motion.li>
                              )) || (
                                  <li className="text-gray-500">Qualification details not provided</li>
                              )}
                            </ul>
                          </div>
                        </motion.div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                        <motion.div
                            key="reviews"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold">Customer Reviews</h2>
                            <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                              <Star className="text-yellow-500" size={18} fill="currentColor" />
                              <span className="font-semibold">{ambulance.averageRating?.toFixed(1) || '0'} Rating</span>
                            </div>
                          </div>

                          {reviews.length > 0 ? (
                              <div className="space-y-6 mb-10">
                                {reviews.map((review, idx) => (
                                    <motion.div
                                        key={review.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="border-b pb-6 last:border-b-0 last:pb-0"
                                    >
                                      <div className="flex items-center gap-4 mb-3">
                                        <img
                                            src={review.avatar || `https://i.pravatar.cc/100?img=${idx + 1}`}
                                            alt={review.user}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div>
                                          <h3 className="font-medium">{review.user}</h3>
                                          <p className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="ml-auto flex">
                                          {[...Array(5)].map((_, i) => (
                                              <Star
                                                  key={i}
                                                  size={16}
                                                  className={i < review.rating ? "text-yellow-500" : "text-gray-300"}
                                                  fill={i < review.rating ? "currentColor" : "none"}
                                              />
                                          ))}
                                        </div>
                                      </div>
                                      <p className="text-gray-700">{review.comment}</p>
                                    </motion.div>
                                ))}
                              </div>
                          ) : (
                              <p className="text-gray-400 text-center mb-10">No reviews available yet.</p>
                          )}

                          {canReview && (
                              <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="bg-white p-6 rounded-xl shadow border"
                              >
                                <h3 className="text-lg font-semibold mb-3">Write a Review</h3>
                                <div className="flex items-center gap-2 mb-3">
                                  {[...Array(5)].map((_, i) => (
                                      <motion.button
                                          key={i}
                                          whileHover={{ scale: 1.2 }}
                                          whileTap={{ scale: 0.9 }}
                                          type="button"
                                          onClick={() => setNewRating(i + 1)}
                                      >
                                        <Star
                                            size={24}
                                            className={i < newRating ? "text-yellow-500" : "text-gray-300"}
                                            fill={i < newRating ? "currentColor" : "none"}
                                        />
                                      </motion.button>
                                  ))}
                                </div>
                                <textarea
                                    rows={3}
                                    className="w-full border rounded-lg p-3 text-sm mb-4 focus:ring-2 focus:ring-red-300 focus:border-red-300"
                                    placeholder="Write your review..."
                                    value={newReview}
                                    onChange={(e) => setNewReview(e.target.value)}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={submitReview}
                                    disabled={submitReviewLoading}
                                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  {submitReviewLoading && <Loader2 className="animate-spin" size={16} />}
                                  Submit Review
                                </motion.button>
                              </motion.div>
                          )}
                        </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Location Map */}
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-2xl shadow-lg p-6 mb-8"
              >
                <h2 className="text-xl font-semibold mb-4">Location</h2>
                <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="text-red-500 mx-auto mb-2" size={32} />
                    <span className="text-gray-700 font-medium">{ambulance.user.area}</span>
                    <p className="text-gray-500 text-sm">
                      {ambulance.user.upazila.name}, {ambulance.user.upazila.district.name}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar with Enhanced Animations */}
            <div className="space-y-6">
              {/* Contact Info Card */}
              <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white rounded-2xl shadow-lg p-6 sticky top-6"
              >
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <MapPin size={18} className="text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900">{ambulance.user.area}</p>
                      <p className="text-sm text-gray-600">
                        {ambulance.user.upazila.name}, {ambulance.user.upazila.district.name}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Phone size={18} className="text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900">{ambulance.user.phone}</p>
                      <p className="text-sm text-gray-600">24/7 Emergency</p>
                    </div>
                  </motion.div>

                  <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Mail size={18} className="text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900">{ambulance.user.email}</p>
                      <p className="text-sm text-gray-600">Email Support</p>
                    </div>
                  </motion.div>

                  <motion.div
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <Clock size={18} className="text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900">24/7 Available</p>
                      <p className="text-sm text-gray-600">Emergency Services</p>
                    </div>
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCallModal(true)}
                      className="w-full py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    <Phone size={20} />
                    Call Now
                  </motion.button>

                  <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowBookingModal(true)}
                      disabled={ambulance.ambulanceStatus !== 'AVAILABLE'}
                      className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transition-all ${
                          ambulance.ambulanceStatus === 'AVAILABLE'
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    <Activity size={20} />
                    {ambulance.ambulanceStatus === 'AVAILABLE' ? 'Book Now' : 'Not Available'}
                  </motion.button>
                </div>
              </motion.div>

              {/* Emergency Info Card */}
              <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-red-50 rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-700">
                  <Siren className="text-red-500" size={24} /> Emergency Info
                </h2>
                <div className="space-y-3 text-gray-700">
                  <div className="flex justify-between items-center">
                    <span>Response Time:</span>
                    <span className="font-semibold">{ambulance.responseTime} mins</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Base Fare:</span>
                    <span className="font-semibold text-red-600">৳ {ambulance.startingFee}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Availability:</span>
                    <span className={`font-semibold ${
                        ambulance.ambulanceStatus === 'AVAILABLE' ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {ambulance.ambulanceStatus}
                  </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Ambulance Type:</span>
                    <span className="font-semibold capitalize">{ambulance.ambulanceType}</span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl shadow-lg p-6 text-white"
              >
                <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">{ambulance.totalReviews || 0}</div>
                    <div className="text-red-100">Total Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">{ambulance.averageRating?.toFixed(1) || '0'}</div>
                    <div className="text-red-100">Average Rating</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Call Modal with Animation */}
        <AnimatePresence>
          {showCallModal && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="bg-white rounded-2xl p-6 max-w-md w-full"
                >
                  <div className="text-center mb-6">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4"
                    >
                      <Phone className="w-8 h-8 text-red-500" />
                    </motion.div>
                    <h2 className="text-xl font-bold mb-2">Call {ambulance.user.fname} {ambulance.user.lname}</h2>
                    <p className="text-gray-600">Emergency Ambulance Service</p>
                    <p className="text-2xl font-bold text-red-500 mt-4">{ambulance.user.phone}</p>
                  </div>
                  <div className="flex gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCallModal(false)}
                        className="flex-1 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      Cancel
                    </motion.button>
                    <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href={`tel:${ambulance.user.phone}`}
                        className="flex-1 py-3 bg-red-500 text-white rounded-lg text-center hover:bg-red-600 font-medium"
                    >
                      Call Now
                    </motion.a>
                  </div>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>

        {/* Booking Modal with Animation */}
        <AnimatePresence>
          {showBookingModal && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                  onClick={() => bookingStatus === 'idle' && setShowBookingModal(false)}
              >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white rounded-2xl p-6 max-w-md w-full"
                >
                  {bookingStatus === 'idle' && (
                      <>
                        <div className="text-center mb-6">
                          <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"
                          >
                            <Activity className="w-8 h-8 text-green-500" />
                          </motion.div>
                          <h2 className="text-xl font-bold mb-2">Confirm Booking</h2>
                          <p className="text-gray-600">Book this ambulance for emergency service?</p>
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><strong>Type:</strong> {ambulance.ambulanceType} Ambulance</p>
                              <p><strong>Rate:</strong> ৳ {ambulance.startingFee}</p>
                              <p><strong>Response:</strong> {ambulance.responseTime} minutes</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setShowBookingModal(false)}
                              className="flex-1 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleBooking}
                              className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                          >
                            Confirm Booking
                          </motion.button>
                        </div>
                      </>
                  )}

                  {bookingStatus === 'loading' && (
                      <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
                        <p className="text-gray-600">Processing your booking...</p>
                      </div>
                  )}

                  {bookingStatus === 'success' && (
                      <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="text-center"
                      >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"
                        >
                          <CheckCircle className="w-10 h-10 text-green-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold mb-2 text-green-600">Booking Successful!</h2>
                        <p className="text-gray-600 mb-6">Your ambulance has been successfully booked.</p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setShowBookingModal(false);
                              setBookingStatus('idle');
                            }}
                            className="py-3 px-6 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                        >
                          Close
                        </motion.button>
                      </motion.div>
                  )}

                  {bookingStatus === 'error' && (
                      <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="text-center"
                      >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4"
                        >
                          <AlertTriangle className="w-10 h-10 text-red-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold mb-2 text-red-600">Booking Failed!</h2>
                        <p className="text-gray-600 mb-6">Something went wrong. Please try again later.</p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setShowBookingModal(false);
                              setBookingStatus('idle');
                            }}
                            className="py-3 px-6 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                        >
                          Close
                        </motion.button>
                      </motion.div>
                  )}
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}