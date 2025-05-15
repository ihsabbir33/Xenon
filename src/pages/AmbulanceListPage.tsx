// AmbulanceListPage.tsx - Fixed search and filter functionality
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Search, MapPin, Phone, Clock, Truck, Heart, Users, Star, ArrowLeft,
  Activity, Filter, ChevronDown, Sparkles, Zap, Shield, Loader2, X
} from 'lucide-react';
import { api } from '../lib/api';
import { AmbulanceType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

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
  service_offers: string;
  hospital_affiliation: string;
  coverage_areas: string;
  response_time: number;
  doctors: number;
  nurses: number;
  paramedics: number;
  team_qualification: string;
  starting_fee: number;
  averageRating?: number;
  totalReviews?: number;
}

export function AmbulanceListPage() {
  const { type } = useParams<{ type: AmbulanceType }>();
  const navigate = useNavigate();

  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [filteredAmbulances, setFilteredAmbulances] = useState<Ambulance[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');
  const [availability, setAvailability] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true); // Show filters by default
  const [sortBy, setSortBy] = useState('default');

  // Fetch ambulances on mount and when type changes
  useEffect(() => {
    fetchAmbulances();
  }, [type]);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [ambulances, searchTerm, selectedDivision, selectedDistrict, selectedUpazila, availability, sortBy]);

  const fetchAmbulances = async () => {
    try {
      setLoading(true);
      const { data: baseResponse } = await api.get('/api/v1/ambulance/list', {
        params: {
          type: type?.toUpperCase(),
          page: 0,
          size: 100,
          sortBy: 'id',
          direction: 'asc',
        },
      });

      if (baseResponse.code === 'XS0001' && baseResponse.data.ambulances.content) {
        setAmbulances(baseResponse.data.ambulances.content);
      } else {
        setAmbulances([]);
      }
    } catch (error) {
      console.error('Failed to fetch ambulances', error);
      setAmbulances([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...ambulances];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(ambulance => {
        const fullName = `${ambulance.user.fname} ${ambulance.user.lname}`.toLowerCase();
        const area = ambulance.user.area?.toLowerCase() || '';
        const upazila = ambulance.user.upazila?.name?.toLowerCase() || '';
        const district = ambulance.user.upazila?.district?.name?.toLowerCase() || '';
        const division = ambulance.user.upazila?.district?.division?.name?.toLowerCase() || '';
        const type = ambulance.ambulanceType?.toLowerCase() || '';
        const hospital = ambulance.hospital_affiliation?.toLowerCase() || '';

        return (
            fullName.includes(search) ||
            area.includes(search) ||
            upazila.includes(search) ||
            district.includes(search) ||
            division.includes(search) ||
            type.includes(search) ||
            hospital.includes(search)
        );
      });
    }

    // Apply location filters
    if (selectedDivision) {
      filtered = filtered.filter(a =>
          a.user.upazila?.district?.division?.name === selectedDivision
      );
    }

    if (selectedDistrict) {
      filtered = filtered.filter(a =>
          a.user.upazila?.district?.name === selectedDistrict
      );
    }

    if (selectedUpazila) {
      filtered = filtered.filter(a =>
          a.user.upazila?.name === selectedUpazila
      );
    }

    // Apply availability filter
    if (availability !== 'all') {
      filtered = filtered.filter(a => {
        if (availability === 'available') return a.ambulanceStatus === 'AVAILABLE';
        if (availability === 'on_trip') return a.ambulanceStatus === 'ON_TRIP';
        if (availability === 'maintenance') return a.ambulanceStatus === 'MAINTENANCE';
        return true;
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.starting_fee - b.starting_fee);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.starting_fee - a.starting_fee);
        break;
      case 'response-time':
        filtered.sort((a, b) => a.response_time - b.response_time);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      default:
        // Keep original order
    }

    setFilteredAmbulances(filtered);
  };

  // Get unique location values from the ambulances data
  const getDivisions = () => {
    const divisions = ambulances
        .map(a => a.user.upazila?.district?.division?.name)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();
    return divisions;
  };

  const getDistricts = () => {
    if (!selectedDivision) return [];

    const districts = ambulances
        .filter(a => a.user.upazila?.district?.division?.name === selectedDivision)
        .map(a => a.user.upazila?.district?.name)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();
    return districts;
  };

  const getUpazilas = () => {
    if (!selectedDistrict) return [];

    const upazilas = ambulances
        .filter(a => a.user.upazila?.district?.name === selectedDistrict)
        .map(a => a.user.upazila?.name)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();
    return upazilas;
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedDivision('');
    setSelectedDistrict('');
    setSelectedUpazila('');
    setAvailability('all');
    setSortBy('default');
  };

  const hasActiveFilters = () => {
    return searchTerm || selectedDivision || selectedDistrict || selectedUpazila || availability !== 'all' || sortBy !== 'default';
  };

  const getAmbulanceIcon = (ambulanceType: string) => {
    switch (ambulanceType.toLowerCase()) {
      case 'icu':
        return <Heart className="w-6 h-6" />;
      case 'freezing':
        return <Truck className="w-6 h-6" />;
      default:
        return <Activity className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'ON_TRIP':
        return 'bg-yellow-100 text-yellow-800';
      case 'MAINTENANCE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
        {/* Hero Section */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative h-[400px] overflow-hidden"
        >
          <img
              src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1920&q=80"
              alt="Ambulance Service"
              className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 to-red-800/75">
            <div className="container mx-auto px-4 h-full flex items-center">
              <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
              >
                <Link to="/ambulance" className="flex items-center text-white/80 hover:text-white mb-4 transition-colors">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Ambulance
                </Link>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 capitalize">
                  {type} Ambulances
                </h1>
                <p className="text-white/90 text-lg max-w-2xl">
                  Find the right ambulance with advanced facilities
                </p>

                {/* Quick Stats */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 flex flex-wrap gap-6"
                >
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <span className="text-white font-medium">{filteredAmbulances.length} Available</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Zap className="w-5 h-5 text-yellow-300" />
                    <span className="text-white font-medium">5-min Response</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Shield className="w-5 h-5 text-yellow-300" />
                    <span className="text-white font-medium">Certified Teams</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Filters Section */}
        <div className="container mx-auto px-4">
          <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: -50, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative z-10 bg-white rounded-2xl shadow-xl p-6 md:p-8"
          >
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                  type="text"
                  placeholder="Search by hospital or area..."
                  className="pl-12 pr-4 py-4 rounded-xl w-full bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-red-300 focus:border-red-300 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Location Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Division Select */}
              <div className="relative">
                <select
                    value={selectedDivision}
                    onChange={(e) => {
                      setSelectedDivision(e.target.value);
                      setSelectedDistrict('');
                      setSelectedUpazila('');
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-300 appearance-none cursor-pointer"
                >
                  <option value="">All Divisions</option>
                  {getDivisions().map(div => (
                      <option key={div} value={div}>{div}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>

              {/* District Select */}
              <div className="relative">
                <select
                    value={selectedDistrict}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      setSelectedUpazila('');
                    }}
                    disabled={!selectedDivision}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-300 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">All Districts</option>
                  {getDistricts().map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>

              {/* Upazila Select */}
              <div className="relative">
                <select
                    value={selectedUpazila}
                    onChange={(e) => setSelectedUpazila(e.target.value)}
                    disabled={!selectedDistrict}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-300 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">All Upazilas</option>
                  {getUpazilas().map(upa => (
                      <option key={upa} value={upa}>{upa}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Status Filter */}
              <div className="relative">
                <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-300 appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="on_trip">On Trip</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>

              {/* Sort By */}
              <div className="relative">
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-300 appearance-none cursor-pointer"
                >
                  <option value="default">Default Order</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="response-time">Fastest Response</option>
                  <option value="rating">Best Rating</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters() && (
                  <button
                      onClick={clearAllFilters}
                      className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <X size={18} />
                    Clear All Filters
                  </button>
              )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters() && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-wrap gap-2 mb-4"
                >
                  {searchTerm && (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="hover:text-red-900 ml-1">×</button>
                </span>
                  )}
                  {selectedDivision && (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  {selectedDivision}
                        <button onClick={() => {
                          setSelectedDivision('');
                          setSelectedDistrict('');
                          setSelectedUpazila('');
                        }} className="hover:text-red-900 ml-1">×</button>
                </span>
                  )}
                  {selectedDistrict && (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  {selectedDistrict}
                        <button onClick={() => {
                          setSelectedDistrict('');
                          setSelectedUpazila('');
                        }} className="hover:text-red-900 ml-1">×</button>
                </span>
                  )}
                  {selectedUpazila && (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  {selectedUpazila}
                        <button onClick={() => setSelectedUpazila('')} className="hover:text-red-900 ml-1">×</button>
                </span>
                  )}
                  {availability !== 'all' && (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  Status: {availability === 'available' ? 'Available' : availability === 'on_trip' ? 'On Trip' : 'Maintenance'}
                        <button onClick={() => setAvailability('all')} className="hover:text-red-900 ml-1">×</button>
                </span>
                  )}
                  {sortBy !== 'default' && (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  Sort: {sortBy.replace('-', ' ')}
                        <button onClick={() => setSortBy('default')} className="hover:text-red-900 ml-1">×</button>
                </span>
                  )}
                </motion.div>
            )}

            {/* Results Count */}
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Found {filteredAmbulances.length} ambulances</span>
              {loading && <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</span>}
            </div>
          </motion.div>
        </div>

        {/* Ambulance Grid */}
        <div className="container mx-auto px-4 py-12">
          {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              </div>
          ) : filteredAmbulances.length === 0 ? (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
              >
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
                  <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Ambulances Found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search filters or location criteria
                  </p>
                  <button
                      onClick={clearAllFilters}
                      className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </motion.div>
          ) : (
              <motion.div
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ staggerChildren: 0.1 }}
              >
                {filteredAmbulances.map((ambulance, index) => (
                    <motion.div
                        key={ambulance.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                        onClick={() => navigate(`/ambulance/details/${ambulance.id}`)}
                    >
                      {/* Image Section */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                            src={`https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80&seed=${ambulance.id}`}
                            alt={`${ambulance.user.fname} ${ambulance.user.lname}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                        {/* Status Badge */}
                        <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ambulance.ambulanceStatus)}`}>
                      {ambulance.ambulanceStatus}
                    </span>
                        </div>

                        {/* Price Badge */}
                        <div className="absolute bottom-4 left-4">
                          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg">
                            <span className="text-red-600 font-bold text-lg">৳ {ambulance.starting_fee}</span>
                            <span className="text-gray-600 text-sm">/trip</span>
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                              {ambulance.user.fname} {ambulance.user.lname}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <MapPin size={14} />
                              {ambulance.user.area}, {ambulance.user.upazila.name}
                            </p>
                          </div>
                          <div className="bg-red-50 p-2 rounded-lg">
                            {getAmbulanceIcon(ambulance.ambulanceType)}
                          </div>
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {ambulance.ambulanceType}
                    </span>
                          <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <Clock size={12} />
                            {ambulance.response_time} min
                    </span>
                          {ambulance.averageRating && (
                              <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <Star size={12} fill="currentColor" />
                                {ambulance.averageRating.toFixed(1)}
                      </span>
                          )}
                        </div>

                        {/* Medical Team Info */}
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span>{ambulance.doctors + ambulance.nurses + ambulance.paramedics} Staff</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone size={14} />
                            <span>{ambulance.user.phone}</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium
                             hover:from-red-600 hover:to-rose-700 transition-all duration-300 
                             flex items-center justify-center gap-2 group"
                        >
                          View Details
                          <ArrowLeft size={16} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </div>
                    </motion.div>
                ))}
              </motion.div>
          )}
        </div>

        {/* Emergency Call CTA */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="fixed bottom-8 right-8 z-50"
        >
          <motion.button
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              onClick={() => window.location.href = 'tel:+8801234567890'}
              className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
          >
            <Phone className="animate-pulse" size={24} />
            <span className="pr-2 font-medium">Emergency Call</span>
          </motion.button>
        </motion.div>
      </div>
  );
}