import { useEffect, useState } from 'react';
import {
  ArrowLeft, Search, MapPin, Phone, Clock, Heart, Share2, AlertCircle,
  Droplet, Filter, ChevronDown, Calendar, Activity, User, MessageCircle,
  Zap, TrendingUp, BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { useLocationStore } from '../stores/areaLocationStore';

interface BloodPost {
  id: number;
  patientName: string;
  bloodType: string;
  quantity: number;
  hospitalName: string;
  contactNumber: string;
  description: string;
  date: string;
  urgencyLevel?: string;
  upazila: {
    id: number;
    name: string;
    district: {
      id: number;
      name: string;
      division: {
        id: number;
        name: string;
      };
    };
  };
  bloodRequestPostCommentResponses: {
    userFirstName: string;
    userLastName: string;
    content: string;
  }[];
}

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const bloodGroupMap: { [key: string]: string } = {
  'A+': 'A_POS', 'A-': 'A_NEG',
  'B+': 'B_POS', 'B-': 'B_NEG',
  'AB+': 'AB_POS', 'AB-': 'AB_NEG',
  'O+': 'O_POS', 'O-': 'O_NEG'
};

const urgencyLevels = [
  { value: 'all', label: 'All Urgencies', color: 'bg-gray-500' },
  { value: 'NORMAL', label: 'Normal', color: 'bg-green-500' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-orange-500' },
  { value: 'EMERGENCY', label: 'Emergency', color: 'bg-red-500' }
];

export function BloodDonationPostsPage() {
  const [posts, setPosts] = useState<BloodPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  // Location states
  const locationStore = useLocationStore();
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');

  // Sorting and view options
  const [sortBy, setSortBy] = useState('date');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  // Get location data
  const divisions = locationStore.divisions;
  const districts = selectedDivision ? locationStore.getDistrictsByDivision(parseInt(selectedDivision)) : [];
  const upazilas = selectedDistrict ? locationStore.getUpazilasByDistrict(parseInt(selectedDistrict)) : [];

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data: baseResponse } = await api.get('/api/v1/blood/blood-request-post-page');
      if (baseResponse.code === 'XS0001') {
        setPosts(baseResponse.data.content);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDivisionChange = (divisionId: string) => {
    setSelectedDivision(divisionId);
    setSelectedDistrict('');
    setSelectedUpazila('');
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedUpazila('');
  };

  const filteredPosts = posts
      .filter(post => {
        const matchesSearch =
            post.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesBloodGroup = !selectedBloodGroup || post.bloodType === bloodGroupMap[selectedBloodGroup];
        const matchesUrgency = selectedUrgency === 'all' || post.urgencyLevel === selectedUrgency;
        const matchesDivision = !selectedDivision || post.upazila.district.division.id === parseInt(selectedDivision);
        const matchesDistrict = !selectedDistrict || post.upazila.district.id === parseInt(selectedDistrict);
        const matchesUpazila = !selectedUpazila || post.upazila.id === parseInt(selectedUpazila);

        return matchesSearch && matchesBloodGroup && matchesUrgency && matchesDivision && matchesDistrict && matchesUpazila;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          case 'urgency':
            const urgencyOrder = { 'EMERGENCY': 3, 'URGENT': 2, 'NORMAL': 1 };
            return (urgencyOrder[b.urgencyLevel || 'NORMAL'] || 1) - (urgencyOrder[a.urgencyLevel || 'NORMAL'] || 1);
          default:
            return 0;
        }
      });

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'EMERGENCY': return 'bg-red-500';
      case 'URGENT': return 'bg-orange-500';
      case 'NORMAL': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency) {
      case 'EMERGENCY': return { text: 'Emergency', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'URGENT': return { text: 'Urgent', color: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'NORMAL': return { text: 'Normal', color: 'bg-green-100 text-green-800 border-green-200' };
      default: return { text: 'Normal', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const formatBloodType = (type: string) => {
    return type?.replace('_POS', '+').replace('_NEG', '-') || 'Unknown';
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        {/* Hero Section */}
        <div className="relative h-[400px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 to-red-800/80">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20"></div>
          </div>
          <div className="relative container mx-auto px-4 h-full flex items-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl"
            >
              <Link to="/blood-donation" className="inline-flex items-center text-white/80 hover:text-white mb-6">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Blood Donation
              </Link>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Blood Donation Requests</h1>
              <p className="text-xl text-white/90 mb-8">Find and respond to urgent blood donation requests in your area</p>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-white">
                  <Activity className="w-5 h-5" />
                  <span className="font-semibold">{posts.length}</span> Active Requests
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold">
                  {posts.filter(p => p.urgencyLevel === 'EMERGENCY').length}
                </span> Emergency Cases
                </div>
                <div className="flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="font-semibold">
                  {posts.filter(p => new Date(p.date) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                </span> Posted Today
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Filters */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 mb-8 -mt-16 relative z-10"
          >
            {/* Search and Basic Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                      type="text"
                      placeholder="Search by patient name, hospital, or description..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Blood Group */}
              <div>
                <select
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all appearance-none"
                    value={selectedBloodGroup}
                    onChange={(e) => setSelectedBloodGroup(e.target.value)}
                >
                  <option value="">All Blood Groups</option>
                  {bloodGroups.map(group => (
                      <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <select
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all appearance-none"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Sort by Date</option>
                  <option value="urgency">Sort by Urgency</option>
                </select>
              </div>
            </div>

            {/* Urgency Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
              <div className="flex flex-wrap gap-2">
                {urgencyLevels.map((level) => (
                    <button
                        key={level.value}
                        onClick={() => setSelectedUrgency(level.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedUrgency === level.value
                                ? `${level.color} text-white shadow-lg`
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {level.label}
                    </button>
                ))}
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full px-4 py-2 text-red-600 hover:text-red-700 font-medium flex items-center justify-center gap-2"
            >
              <Filter size={16} />
              Advanced Location Filters
              <ChevronDown
                  size={16}
                  className={`transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showAdvancedFilters && (
                  <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                      {/* Division */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
                        <select
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                            value={selectedDivision}
                            onChange={(e) => handleDivisionChange(e.target.value)}
                        >
                          <option value="">All Divisions</option>
                          {divisions.map(division => (
                              <option key={division.id} value={division.id}>{division.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* District */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                        <select
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all disabled:opacity-50"
                            value={selectedDistrict}
                            onChange={(e) => handleDistrictChange(e.target.value)}
                            disabled={!selectedDivision}
                        >
                          <option value="">All Districts</option>
                          {districts.map(district => (
                              <option key={district.id} value={district.id}>{district.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Upazila */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upazila</label>
                        <select
                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all disabled:opacity-50"
                            value={selectedUpazila}
                            onChange={(e) => setSelectedUpazila(e.target.value)}
                            disabled={!selectedDistrict}
                        >
                          <option value="">All Upazilas</option>
                          {upazilas.map(upazila => (
                              <option key={upazila.id} value={upazila.id}>{upazila.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Results Summary and View Toggle */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">
              Found <span className="font-semibold text-gray-900">{filteredPosts.length}</span> blood requests
            </p>
            <div className="flex items-center gap-2">
              <button
                  onClick={() => setViewType('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                      viewType === 'grid' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <BarChart3 size={20} className="rotate-90" />
              </button>
              <button
                  onClick={() => setViewType('list')}
                  className={`p-2 rounded-lg transition-colors ${
                      viewType === 'list' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <BarChart3 size={20} />
              </button>
            </div>
          </div>

          {/* Posts List */}
          <div className={viewType === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {loading ? (
                // Loading Skeletons
                [...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                      <div className="h-48 bg-gray-200"></div>
                      <div className="p-6 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                ))
            ) : filteredPosts.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full text-center py-16 bg-white rounded-2xl shadow-lg"
                >
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No blood requests found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your filters to find more requests</p>
                  <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedBloodGroup('');
                        setSelectedUrgency('all');
                        setSelectedDivision('');
                        setSelectedDistrict('');
                        setSelectedUpazila('');
                      }}
                      className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Clear all filters
                  </button>
                </motion.div>
            ) : (
                <AnimatePresence>
                  {filteredPosts.map((post, index) => (
                      <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: viewType === 'grid' ? 1.02 : 1, y: viewType === 'grid' ? -5 : 0 }}
                          className={viewType === 'grid' ? '' : ''}
                      >
                        <Link to={`/blood-donation/post/${post.id}`}>
                          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                            {viewType === 'grid' ? (
                                <>
                                  {/* Image Header */}
                                  <div className="relative h-48">
                                    <img
                                        src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80"
                                        alt={post.patientName}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                                    {/* Urgency Badge */}
                                    <div className="absolute top-4 right-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getUrgencyBadge(post.urgencyLevel).color}`}>
                                {getUrgencyBadge(post.urgencyLevel).text}
                              </span>
                                    </div>

                                    {/* Blood Type */}
                                    <div className="absolute bottom-4 left-4">
                                      <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl">
                                <span className="text-2xl font-bold text-red-600">
                                  {formatBloodType(post.bloodType)}
                                </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Content */}
                                  <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                      <h3 className="font-semibold text-lg text-gray-800">{post.patientName}</h3>
                                      <span className="text-xs text-gray-500">{getTimeAgo(post.date)}</span>
                                    </div>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.description}</p>

                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <MapPin size={16} className="text-red-500" />
                                        <span>{post.hospitalName}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span className="text-xs">
                                  {post.upazila.name}, {post.upazila.district.name}
                                </span>
                                      </div>
                                      <div className="flex items-center justify-between pt-2 border-t">
                                        <div className="flex items-center gap-2 text-gray-600">
                                          <Droplet size={16} className="text-red-500" />
                                          <span>{post.quantity} unit{post.quantity > 1 ? 's' : ''}</span>
                                        </div>
                                        {post.bloodRequestPostCommentResponses.length > 0 && (
                                            <div className="flex items-center gap-1 text-gray-500">
                                              <MessageCircle size={14} />
                                              <span className="text-xs">{post.bloodRequestPostCommentResponses.length}</span>
                                            </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </>
                            ) : (
                                /* List View */
                                <div className="flex flex-col md:flex-row">
                                  <div className="md:w-48 h-48 md:h-auto">
                                    <img
                                        src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80"
                                        alt={post.patientName}
                                        className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 p-6">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                                      <div>
                                        <div className="flex items-center gap-3 mb-2">
                                          <h3 className="font-semibold text-xl text-gray-800">{post.patientName}</h3>
                                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getUrgencyBadge(post.urgencyLevel).color}`}>
                                    {getUrgencyBadge(post.urgencyLevel).text}
                                  </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Clock size={14} />
                                    {getTimeAgo(post.date)}
                                  </span>
                                          <span className="flex items-center gap-1">
                                    <Calendar size={14} />
                                            {new Date(post.date).toLocaleDateString()}
                                  </span>
                                        </div>
                                      </div>
                                      <div className="bg-red-100 px-4 py-2 rounded-xl">
                                <span className="text-2xl font-bold text-red-600">
                                  {formatBloodType(post.bloodType)}
                                </span>
                                      </div>
                                    </div>

                                    <p className="text-gray-600 mb-4">{post.description}</p>

                                    <div className="flex flex-wrap gap-4 text-sm">
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <MapPin size={16} className="text-red-500" />
                                        <span>{post.hospitalName}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span>{post.upazila.name}, {post.upazila.district.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <Droplet size={16} className="text-red-500" />
                                        <span>{post.quantity} unit{post.quantity > 1 ? 's' : ''} needed</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <Phone size={16} className="text-gray-400" />
                                        <span>{post.contactNumber}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                  ))}
                </AnimatePresence>
            )}
          </div>
        </div>
      </div>
  );
}