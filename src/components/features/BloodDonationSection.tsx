import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Heart, Users, Award, CalendarDays, MapPin, Share2, ArrowRight, Zap, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

interface BloodPost {
  id: number;
  patientName: string;
  description: string;
  bloodType: string;
  quantity: number;
  hospitalName: string;
  urgency?: 'normal' | 'urgent' | 'emergency';
}

interface DashboardData {
  totalDonor: number;
  totalDonation: number;
  getTotalPost: number;
  bloodRequestPosts: BloodPost[];
}

const BloodDropAnimation = ({ children, delay = 0 }) => (
    <motion.div
        initial={{ scale: 0, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay,
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
    >
      {children}
    </motion.div>
);

const PulseAnimation = ({ children }) => (
    <motion.div
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: ["0px 0px 0px rgba(239, 68, 68, 0)", "0px 0px 15px rgba(239, 68, 68, 0.3)", "0px 0px 0px rgba(239, 68, 68, 0)"]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
    >
      {children}
    </motion.div>
);

export function BloodDonationSection() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data: baseResponse } = await api.get('/api/v1/blood/dashboard-blood');
      if (baseResponse.code === 'XS0001') {
        setDashboardData(baseResponse.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Blood Donors', value: dashboardData?.totalDonor || 0, icon: <Droplet />, color: 'from-red-500 to-rose-600' },
    { label: 'Lives Saved', value: dashboardData?.totalDonation || 0, icon: <Heart />, color: 'from-pink-500 to-rose-600' },
    { label: 'Active Posts', value: dashboardData?.getTotalPost || 0, icon: <Activity />, color: 'from-orange-500 to-red-600' }
  ];

  const mainLinks = [
    { to: "/blood-donation/donor", icon: <Droplet />, label: "Become a Donor", gradient: 'from-red-500 to-rose-600' },
    { to: "/blood-donation/recipient", icon: <Users />, label: "Request Blood", gradient: 'from-blue-500 to-indigo-600' },
    { to: "/blood-donation/history", icon: <CalendarDays />, label: "Donation History", gradient: 'from-purple-500 to-violet-600' },
    { to: "/blood-donation/donors", icon: <MapPin />, label: "Find Donors", gradient: 'from-amber-500 to-orange-600' }
  ];

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-500';
      case 'urgent': return 'bg-orange-500';
      default: return 'bg-green-500';
    }
  };

  return (
      <div className="relative py-16 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-4">
              Blood Donation Network
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Join our life-saving community. Every drop counts in making a difference. Connect with donors and recipients in real-time.
            </p>
          </motion.div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {mainLinks.map((item, idx) => (
                <BloodDropAnimation key={idx} delay={idx * 0.1}>
                  <Link
                      to={item.to}
                      onMouseEnter={() => setHoveredCard(idx)}
                      onMouseLeave={() => setHoveredCard(null)}
                      className="relative group"
                  >
                    <motion.div
                        animate={{
                          scale: hoveredCard === idx ? 1.05 : 1,
                          rotate: hoveredCard === idx ? [0, -1, 1, 0] : 0
                        }}
                        transition={{ duration: 0.3 }}
                        className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                    >
                      {/* Background Gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                      {/* Icon */}
                      <motion.div
                          animate={{
                            rotate: hoveredCard === idx ? 360 : 0
                          }}
                          transition={{ duration: 0.8 }}
                          className={`bg-gradient-to-br ${item.gradient} w-14 h-14 rounded-xl flex items-center justify-center mb-4 text-white`}
                      >
                        {item.icon}
                      </motion.div>

                      <h3 className="font-semibold text-gray-800 text-lg mb-2">{item.label}</h3>
                      <p className="text-gray-500 text-sm">
                        {idx === 0 && "Save lives by donating blood regularly"}
                        {idx === 1 && "Get help when you need blood urgently"}
                        {idx === 2 && "Track your donation journey"}
                        {idx === 3 && "Find nearby donors quickly"}
                      </p>

                      <div className="mt-4 flex items-center text-sm font-medium bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                        Get Started
                        <ArrowRight className="ml-1 h-4 w-4 text-red-600" />
                      </div>
                    </motion.div>
                  </Link>
                </BloodDropAnimation>
            ))}
          </div>

          {/* Stats and Recent Posts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Stats Section */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Zap className="mr-2 text-yellow-500" />
                Our Impact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="bg-white rounded-2xl shadow-lg p-6 text-center cursor-pointer"
                    >
                      <motion.div
                          animate={{
                            rotate: [0, 10, -10, 0]
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut"
                          }}
                          className={`bg-gradient-to-br ${stat.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white`}
                      >
                        {stat.icon}
                      </motion.div>
                      <motion.div
                          className="text-3xl font-bold mb-1"
                          animate={{
                            scale: [1, 1.1, 1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                      >
                        {loading ? (
                            <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
                        ) : (
                            <span className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value.toLocaleString()}+
                      </span>
                        )}
                      </motion.div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Recent Posts Section */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold flex items-center">
                  <Heart className="mr-2 text-red-500" />
                  Urgent Requests
                </h3>
                <Link to="/blood-donation/posts" className="text-red-600 hover:text-red-700 font-medium text-sm">
                  View All →
                </Link>
              </div>

              <div className="space-y-4">
                {loading ? (
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map(i => (
                          <div key={i} className="flex gap-4 bg-white p-4 rounded-xl">
                            <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                      ))}
                    </div>
                ) : dashboardData?.bloodRequestPosts?.length ? (
                    <AnimatePresence>
                      {dashboardData.bloodRequestPosts.slice(0, 3).map((post, index) => (
                          <motion.div
                              key={post.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: index * 0.1 }}
                              whileHover={{ scale: 1.02, x: 10 }}
                          >
                            <Link
                                to={`/blood-donation/post/${post.id}`}
                                className="flex gap-4 bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                            >
                              <div className="relative overflow-hidden rounded-lg">
                                <img
                                    src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=300&h=200&q=80"
                                    alt={post.patientName}
                                    className="w-24 h-24 object-cover transform group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getUrgencyColor(post.urgency)} animate-pulse`}></div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-gray-800">{post.patientName}</h4>
                                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                              {post.bloodType?.replace('_POS', '+').replace('_NEG', '-') || 'O+'}
                            </span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-1 mb-1">{post.description}</p>
                                <div className="flex items-center text-xs text-gray-500">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  <span>{post.hospitalName || 'City Hospital'}</span>
                                  <span className="mx-2">•</span>
                                  <span>{post.quantity || 1} unit{post.quantity > 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                      ))}
                    </AnimatePresence>
                ) : (
                    <div className="text-center py-8 bg-white rounded-xl">
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No urgent requests at the moment</p>
                    </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* CTA Section */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-16 text-center"
          >
            <PulseAnimation>
              <Link to="/blood-donation/create-post">
                <button className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                <span className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Create Emergency Request
                </span>
                </button>
              </Link>
            </PulseAnimation>
            <p className="mt-4 text-gray-600">Join thousands of heroes saving lives every day</p>
          </motion.div>
        </div>

        <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
      </div>
  );
}