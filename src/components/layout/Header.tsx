// src/components/layout/Header.tsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, ChevronDown, User, Bell, Heart, X, LogIn,
  MapPin, Settings, LogOut, Home, Calendar,
  MessageSquare, PenSquare, Stethoscope, AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useNotificationStore } from '../../stores/notificationStore';
import { useLocationStore } from '../../stores/LocationStore';
import { logout } from '../../pages/auth/auth';
import { api } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  name: string;
  path: string;
  icon: JSX.Element;
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationStore = useNotificationStore();
  const locationStore = useLocationStore();
  const unreadCount = notificationStore.getUnreadCount();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{ role?: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/v1/user');
        setUser(res.data?.data || null);
      } catch (err) {
        setUser(null);
      }
    };

    fetchUser();
    notificationStore.fetchUnreadCount();

    // Set up interval to periodically check for new notifications
    const interval = setInterval(() => {
      notificationStore.fetchUnreadCount();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Close mobile menu on location change
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    // Add scroll listener
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const mainNavItems: NavItem[] = [
    { name: 'Home', path: '/', icon: <Home size={18} /> },
    { name: 'Health Alerts', path: '/alerts', icon: <AlertTriangle size={18} /> },
    { name: 'Find Pharmacies', path: '/find-pharmacies', icon: <MapPin size={18} /> },
    { name: 'Appointments', path: '/appointments', icon: <Calendar size={18} /> },
    { name: 'Blood Donation', path: '/blood-donation', icon: <Heart size={18} /> },
    { name: 'Ambulance', path: '/ambulance', icon: <Stethoscope size={18} /> },
    { name: 'Community', path: '/community/users', icon: <MessageSquare size={18} /> }
  ];

  const userMenuItems = [
    ...(user?.role === 'USER' ? [{ name: 'Patient Dashboard', path: '/patient/dashboard', icon: <User size={18} /> }] : []),
    ...(user?.role === 'DOCTOR' ? [{ name: 'Doctor Dashboard', path: '/doctor/dashboard', icon: <User size={18} /> }] : []),
    ...(user?.role === 'HEALTH_AUTHORIZATION' ? [{ name: 'Health Authorization Dashboard', path: '/health-authorization', icon: <AlertTriangle size={18} /> }] : []),
    ...(user?.role === 'PHARMACY' ? [{ name: 'Pharmacy Dashboard', path: '/pharmacy/dashboard', icon: <MapPin size={18} /> }] : []),
    ...(user?.role === 'AMBULANCE' ? [{ name: 'Ambulance Dashboard', path: '/ambulance-dashboard', icon: <Stethoscope size={18} /> }] : []),
    { name: 'Settings', path: '/settings', icon: <Settings size={18} /> }
  ];

  const bloodDonationSubmenu = [
    { name: 'Blood Donation Home', path: '/blood-donation' },
    { name: 'Blood Donation Posts', path: '/blood-donation/posts' },
    { name: 'Find Donors', path: '/blood-donation/donors' },
    { name: 'Donate Blood', path: '/blood-donation/donor' },
    { name: 'Request Blood', path: '/blood-donation/recipient' },
    { name: 'Donation History', path: '/blood-donation/history' }
  ];

  const communitySubmenu = [
    { name: 'User Community', path: '/community/users' },
    { name: 'Doctor Articles', path: '/community/doctors' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLocationService = async () => {
    if (!locationStore.locationAllowed) {
      await locationStore.updateLocation();
    } else {
      await locationStore.disableLocation();
    }
  };

  return (
      <header className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white shadow-md' : 'bg-white shadow-sm'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-red-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-blue-500 bg-clip-text text-transparent">
                XENON
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {mainNavItems.map((item, index) => (
                  item.name === 'Blood Donation' || item.name === 'Community' ? (
                      <div key={index} className="relative group">
                        <button className={`px-3 py-2 rounded-lg group-hover:bg-gray-50 transition-colors flex items-center gap-1 ${
                            location.pathname.includes(item.path)
                                ? 'text-red-600'
                                : 'text-gray-700 hover:text-red-600'
                        }`}>
                          {item.icon}
                          <span className="ml-1">{item.name}</span>
                          <ChevronDown size={16} className="group-hover:transform group-hover:rotate-180 transition-transform" />
                        </button>
                        <div className="absolute left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                          <div className="p-2">
                            {item.name === 'Blood Donation' ?
                                bloodDonationSubmenu.map((subItem, subIndex) => (
                                    <Link
                                        key={subIndex}
                                        to={subItem.path}
                                        className={`block px-4 py-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors ${
                                            location.pathname === subItem.path ? 'text-red-600 bg-red-50' : 'text-gray-700'
                                        }`}
                                    >
                                      {subItem.name}
                                    </Link>
                                )) :
                                communitySubmenu.map((subItem, subIndex) => (
                                    <Link
                                        key={subIndex}
                                        to={subItem.path}
                                        className={`block px-4 py-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors ${
                                            location.pathname === subItem.path ? 'text-red-600 bg-red-50' : 'text-gray-700'
                                        }`}
                                    >
                                      {subItem.name}
                                    </Link>
                                ))
                            }
                          </div>
                        </div>
                      </div>
                  ) : (
                      <Link
                          key={index}
                          to={item.path}
                          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                              location.pathname === item.path
                                  ? 'text-red-600 bg-red-50'
                                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                          }`}
                      >
                        {item.icon}
                        <span className="ml-1">{item.name}</span>
                      </Link>
                  )
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Location Toggle */}
              <button
                  onClick={toggleLocationService}
                  disabled={locationStore.isLoading}
                  className={`flex items-center p-2 rounded-full transition-colors ${
                      locationStore.locationAllowed ? 'text-green-600 hover:bg-green-50' : 'text-gray-500 hover:bg-gray-50 hover:text-red-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={locationStore.locationAllowed ? 'Location enabled' : 'Enable location'}
              >
                <MapPin size={20} />
              </button>

              {/* Notifications */}
              <Link
                  to="/alerts"
                  className="relative p-2 text-gray-500 hover:text-red-600 hover:bg-gray-50 rounded-full transition-colors"
                  state={{ tab: 'notifications' }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                      {unreadCount}
                    </span>
                )}
              </Link>

              {/* User Menu */}
              {user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                        className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.role?.charAt(0) || 'U'}
                      </div>
                      <ChevronDown size={16} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isUserMenuOpen && (
                          <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              transition={{ duration: 0.2 }}
                              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50"
                          >
                            <div className="p-2">
                              {userMenuItems.map((item, index) => (
                                  <Link
                                      key={index}
                                      to={item.path}
                                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                      onClick={() => setIsUserMenuOpen(false)}
                                  >
                                    {item.icon}
                                    <span className="ml-2">{item.name}</span>
                                  </Link>
                              ))}
                              <hr className="my-2" />
                              <button
                                  className="w-full text-left flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  onClick={() => {
                                    setIsUserMenuOpen(false);
                                    handleLogout();
                                  }}
                              >
                                <LogOut size={18} className="mr-2" />
                                Logout
                              </button>
                            </div>
                          </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
              ) : (
                  <Link to="/login">
                    <Button className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700">
                      <LogIn size={18} />
                      Get Started
                    </Button>
                  </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-4">
              {/* Mobile Notifications */}
              <Link
                  to="/alerts"
                  className="relative p-2 text-gray-500 hover:text-red-600 hover:bg-gray-50 rounded-full transition-colors"
                  state={{ tab: 'notifications' }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                      {unreadCount}
                    </span>
                )}
              </Link>

              <button
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
              <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="lg:hidden bg-white border-t border-gray-100 shadow-md"
              >
                <nav className="p-4 space-y-2">
                  {mainNavItems.map((item, index) => (
                      item.name === 'Blood Donation' || item.name === 'Community' ? (
                          <div key={index} className="mb-2">
                            <div className={`px-4 py-2 font-medium flex items-center ${
                                location.pathname.includes(item.path) ? 'text-red-600' : 'text-gray-700'
                            }`}>
                              {item.icon}
                              <span className="ml-2">{item.name}</span>
                            </div>
                            <div className="pl-8 space-y-1 mt-1">
                              {item.name === 'Blood Donation' ?
                                  bloodDonationSubmenu.map((subItem, subIndex) => (
                                      <Link
                                          key={subIndex}
                                          to={subItem.path}
                                          className={`block px-4 py-2 rounded-lg transition-colors ${
                                              location.pathname === subItem.path
                                                  ? 'text-red-600 bg-red-50'
                                                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                                          }`}
                                          onClick={() => setIsMenuOpen(false)}
                                      >
                                        {subItem.name}
                                      </Link>
                                  )) :
                                  communitySubmenu.map((subItem, subIndex) => (
                                      <Link
                                          key={subIndex}
                                          to={subItem.path}
                                          className={`block px-4 py-2 rounded-lg transition-colors ${
                                              location.pathname === subItem.path
                                                  ? 'text-red-600 bg-red-50'
                                                  : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                                          }`}
                                          onClick={() => setIsMenuOpen(false)}
                                      >
                                        {subItem.name}
                                      </Link>
                                  ))
                              }
                            </div>
                          </div>
                      ) : (
                          <Link
                              key={index}
                              to={item.path}
                              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                                  location.pathname === item.path
                                      ? 'text-red-600 bg-red-50'
                                      : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                              }`}
                              onClick={() => setIsMenuOpen(false)}
                          >
                            {item.icon}
                            <span className="ml-2">{item.name}</span>
                          </Link>
                      )
                  ))}

                  {/* Location Toggle in Mobile Menu */}
                  <button
                      onClick={toggleLocationService}
                      disabled={locationStore.isLoading}
                      className={`w-full text-left flex items-center px-4 py-2 rounded-lg transition-colors ${
                          locationStore.locationAllowed
                              ? 'text-green-600 bg-green-50'
                              : 'text-gray-700 hover:text-red-600 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <MapPin size={18} />
                    <span className="ml-2">
                      {locationStore.isLoading
                          ? 'Processing...'
                          : locationStore.locationAllowed
                              ? 'Location Enabled'
                              : 'Enable Location'
                      }
                    </span>
                  </button>

                  {user && (
                      <>
                        <hr className="my-2" />
                        <div className="px-4 text-sm text-gray-500 font-semibold">Account</div>
                        {userMenuItems.map((item, index) => (
                            <Link
                                key={index}
                                to={item.path}
                                className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                              {item.icon}
                              <span className="ml-2">{item.name}</span>
                            </Link>
                        ))}
                        <button
                            className="w-full text-left flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => {
                              setIsMenuOpen(false);
                              handleLogout();
                            }}
                        >
                          <LogOut size={18} className="mr-2" />
                          Logout
                        </button>
                      </>
                  )}
                </nav>
              </motion.div>
          )}
        </AnimatePresence>
      </header>
  );
}

export default Header;