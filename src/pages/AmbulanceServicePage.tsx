// AmbulanceServicePage.tsx - Enhanced with animations and attractive UI
import { useState } from 'react';
import {
  Truck, Thermometer, Heart, Phone, MapPin, Clock, ArrowRight,
  Shield, AlertCircle, Star, Zap, Activity, Stethoscope
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface AmbulanceType {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
  price: string;
  color: string;
  delay: number;
}

const ambulanceTypes: AmbulanceType[] = [
  {
    id: 'general',
    name: 'General Ambulance',
    icon: <Truck className="w-16 h-16" />,
    description: 'Basic life support ambulance for non-critical patient transport',
    features: [
      'Basic medical equipment',
      'Trained paramedic staff',
      'Patient stretcher',
      'First aid supplies',
      'Oxygen support'
    ],
    price: '৳ 2000/trip',
    color: 'from-red-500 to-rose-600',
    delay: 0
  },
  {
    id: 'icu',
    name: 'ICU Ambulance',
    icon: <Heart className="w-16 h-16" />,
    description: 'Advanced life support ambulance with ICU facilities',
    features: [
      'Full ICU equipment',
      'Specialized medical team',
      'Ventilator support',
      'Cardiac monitoring',
      'Emergency medications'
    ],
    price: '৳ 5000/trip',
    color: 'from-purple-500 to-pink-600',
    delay: 0.1
  },
  {
    id: 'freezing',
    name: 'Freezing Ambulance',
    icon: <Thermometer className="w-16 h-16" />,
    description: 'Specialized temperature-controlled transport service',
    features: [
      'Temperature control system',
      'Specialized storage',
      'Professional handling',
      '24/7 availability',
      'Long-distance transport'
    ],
    price: '৳ 3000/trip',
    color: 'from-blue-500 to-cyan-600',
    delay: 0.2
  }
];

const floatingAnimation = {
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export function AmbulanceServicePage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSeeDetails = () => {
    if (selectedType) {
      navigate(`/ambulance/book/${selectedType}`);
    }
  };

  return (
      <div className="relative min-h-screen bg-gradient-to-b from-red-50 via-white to-red-50 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
              className="absolute -top-20 -left-20 w-96 h-96 bg-red-100/20 rounded-full blur-3xl"
          />
          <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
            >
              <motion.div
                  animate={pulseAnimation.animate}
                  className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-r from-red-500 to-rose-600 rounded-full shadow-lg"
              >
                <Truck className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                Emergency Ambulance Services
              </h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                24/7 emergency ambulance services with professional medical support and rapid response
              </p>
            </motion.div>

            {/* Emergency Call Button */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-12 text-center"
            >
              <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-3"
                  onClick={() => window.location.href = 'tel:+8801234567890'}
              >
                <Phone className="animate-pulse" size={24} />
                Emergency Call: +880 1234-567890
              </motion.button>
            </motion.div>

            {/* Ambulance type selection with floating animation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {ambulanceTypes.map((type) => (
                  <motion.div
                      key={type.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: type.delay }}
                      whileHover={{ y: -10 }}
                      onClick={() => setSelectedType(type.id)}
                      className="cursor-pointer"
                  >
                    <motion.div
                        animate={selectedType === type.id ? floatingAnimation.animate : {}}
                        className={`
                    relative bg-white rounded-3xl shadow-lg p-6 transition-all duration-300
                    ${selectedType === type.id
                            ? 'ring-4 ring-offset-2 ring-red-500 shadow-2xl transform scale-105'
                            : 'hover:shadow-xl'
                        }
                  `}
                    >
                      <motion.div
                          className={`
                      absolute inset-0 rounded-3xl bg-gradient-to-br ${type.color} opacity-10
                      ${selectedType === type.id ? 'opacity-20' : ''}
                    `}
                      />

                      <div className="relative flex flex-col items-center text-center">
                        <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className={`
                        mb-4 p-4 rounded-2xl bg-gradient-to-br ${type.color} text-white
                        shadow-lg transform transition-all duration-300
                      `}
                        >
                          {type.icon}
                        </motion.div>

                        <h3 className="text-xl font-semibold mb-2">{type.name}</h3>
                        <p className="text-gray-600 text-sm mb-4">{type.description}</p>

                        <motion.div
                            className="flex items-center gap-2 mt-auto"
                            whileHover={{ scale: 1.05 }}
                        >
                      <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">
                        {type.price}
                      </span>
                        </motion.div>

                        {selectedType === type.id && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-4 -right-4 bg-green-500 text-white rounded-full p-2 shadow-lg"
                            >
                              <Check size={20} />
                            </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
              ))}
            </div>

            {/* Selected type details with animation */}
            <AnimatePresence mode="wait">
              {selectedType && (
                  <motion.div
                      key={selectedType}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="max-w-4xl mx-auto"
                  >
                    <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm bg-white/90">
                      <motion.h2
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-2xl font-bold mb-8 flex items-center gap-3"
                      >
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${ambulanceTypes.find(t => t.id === selectedType)?.color} text-white`}>
                          {ambulanceTypes.find(t => t.id === selectedType)?.icon}
                        </div>
                        {ambulanceTypes.find(t => t.id === selectedType)?.name} Features
                      </motion.h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <motion.ul className="space-y-4">
                            {ambulanceTypes
                                .find(t => t.id === selectedType)
                                ?.features.map((feature, index) => (
                                    <motion.li
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                      <motion.div
                                          whileHover={{ scale: 1.2, rotate: 360 }}
                                          transition={{ duration: 0.3 }}
                                          className="text-red-500"
                                      >
                                        <ArrowRight size={20} />
                                      </motion.div>
                                      <span className="text-gray-700">{feature}</span>
                                    </motion.li>
                                ))}
                          </motion.ul>
                        </div>

                        {/* Booking box with pulse animation */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-100"
                        >
                          <h3 className="font-semibold text-lg mb-4">Quick Booking</h3>
                          <div className="space-y-4 mb-6">
                            <motion.div
                                className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm"
                                whileHover={{ x: 5 }}
                            >
                              <Phone size={20} className="text-red-500" />
                              <span>Emergency: +880 1234-567890</span>
                            </motion.div>
                            <motion.div
                                className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm"
                                whileHover={{ x: 5 }}
                            >
                              <MapPin size={20} className="text-red-500" />
                              <span>Available in all major cities</span>
                            </motion.div>
                            <motion.div
                                className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm"
                                whileHover={{ x: 5 }}
                            >
                              <Clock size={20} className="text-red-500" />
                              <span>24/7 Service</span>
                            </motion.div>
                          </div>

                          <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleSeeDetails}
                              className="w-full py-3 px-6 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                          >
                            Book Now
                          </motion.button>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
              )}
            </AnimatePresence>

            {/* Why choose us section with stagger animation */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-20"
            >
              <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Service?</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { icon: <Clock />, title: '24/7 Availability', desc: 'Round-the-clock emergency response' },
                  { icon: <Stethoscope />, title: 'Expert Medical Team', desc: 'Highly trained professionals' },
                  { icon: <Zap />, title: 'Rapid Response', desc: 'Fastest response time in the city' },
                  { icon: <Shield />, title: 'Safety First', desc: 'International safety standards' }
                ].map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        whileHover={{ y: -10, scale: 1.05 }}
                        className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all text-center"
                    >
                      <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl"
                      >
                        {item.icon}
                      </motion.div>
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Stats section with counting animation */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-20 bg-gradient-to-r from-red-500 to-rose-600 rounded-3xl p-12 text-white"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { value: '10k+', label: 'Lives Saved' },
                  { value: '50+', label: 'Ambulances' },
                  { value: '24/7', label: 'Service Hours' },
                  { value: '5min', label: 'Avg Response' }
                ].map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1 + index * 0.1, type: "spring" }}
                    >
                      <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-4xl font-bold mb-2"
                      >
                        {stat.value}
                      </motion.div>
                      <div className="text-red-100">{stat.label}</div>
                    </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
  );
}

// Missing import for Check icon
import { Check } from 'lucide-react';