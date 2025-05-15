import { useEffect, useState } from 'react';
import { Search, MapPin, Phone, Filter, Droplet, User as UserIcon, ChevronDown, Heart, Activity, Loader } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocationStore } from '../stores/areaLocationStore';

interface Donor {
  id: number;
  fullName: string;
  phone: string;
  bloodType: string;
  upazila: string;
  area: string;
  isAvailable: boolean;
  lastDonation?: string;
}

interface UserProfile {
  id: number;
  phone: string;
  gender: string | null;
}

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const bloodGroupMap: { [key: string]: string } = {
  'A+': 'A_POS', 'A-': 'A_NEG',
  'B+': 'B_POS', 'B-': 'B_NEG',
  'AB+': 'AB_POS', 'AB-': 'AB_NEG',
  'O+': 'O_POS', 'O-': 'O_NEG'
};

const reverseBloodGroupMap: { [key: string]: string } = {
  'A_POS': 'A+', 'A_NEG': 'A-',
  'B_POS': 'B+', 'B_NEG': 'B-',
  'AB_POS': 'AB+', 'AB_NEG': 'AB-',
  'O_POS': 'O+', 'O_NEG': 'O-'
};

export function BloodDonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Location filtering states
  const locationStore = useLocationStore();
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');

  // Avatar URLs
  const maleAvatar = "https://avatar.iran.liara.run/public/boy";
  const femaleAvatar = "https://avatar.iran.liara.run/public/girl";
  const unknownAvatar = "https://avatar.iran.liara.run/public";

  // Get location data
  const divisions = locationStore.divisions;
  const districts = selectedDivision ? locationStore.getDistrictsByDivision(parseInt(selectedDivision)) : [];
  const upazilas = selectedDistrict ? locationStore.getUpazilasByDistrict(parseInt(selectedDistrict)) : [];

  useEffect(() => {
    fetchDonors();
  }, [selectedBloodGroup]);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: 0,
        size: 100,
        sortBy: 'id',
        direction: 'asc'
      };

      if (selectedBloodGroup) {
        params.bloodType = bloodGroupMap[selectedBloodGroup];
      }

      const { data } = await api.get('/api/v1/donor/available', { params });

      if (data?.code === 'XS0001') {
        const donorsData = data.data.content.map((donor: any) => ({
          ...donor,
          bloodType: reverseBloodGroupMap[donor.bloodType] || donor.bloodType
        }));
        setDonors(donorsData);
        fetchUserProfiles(donorsData.map((donor: Donor) => donor.phone));
      } else {
        toast.error(data?.message || 'Failed to fetch donors.');
      }
    } catch (error) {
      console.error('Error fetching donors:', error);
      toast.error('Error fetching donors.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfiles = async (phones: string[]) => {
    try {
      const results: UserProfile[] = [];

      await Promise.all(
          phones.map(async (phone) => {
            try {
              const res = await api.get('/api/v1/user', { params: { phone } });
              if (res.data?.code === 'XS0001') {
                results.push({
                  id: res.data.data.id,
                  phone: res.data.data.phone,
                  gender: res.data.data.gender,
                });
              }
            } catch (e) {
              console.warn(`User not found for phone: ${phone}`);
            }
          })
      );

      setUserProfiles(results);
    } catch (e) {
      console.error('Error fetching user profiles:', e);
    }
  };

  const getAvatar = (phone: string, index: number) => {
    const profile = userProfiles.find((p) => p.phone === phone);

    if (!profile || !profile.gender) return `${unknownAvatar}?username=${index}`;

    const gender = profile.gender.toLowerCase();
    if (gender === 'male') return `${maleAvatar}?username=${index}`;
    if (gender === 'female') return `${femaleAvatar}?username=${index}`;

    return `${unknownAvatar}?username=${index}`;
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

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBloodGroup = !selectedBloodGroup || donor.bloodType === selectedBloodGroup;
    const matchesUpazila = !selectedUpazila || donor.upazila.toLowerCase() === selectedUpazila.toLowerCase();
    // You might need to enhance the filtering logic based on your data structure

    return matchesSearch && matchesBloodGroup && matchesUpazila;
  });

  const getDaysAgo = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        {/* Hero Section */}
        <div className="relative h-[300px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 to-red-800/80">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-20"></div>
          </div>
          <div className="relative container mx-auto px-4 h-full flex items-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Find Blood Donors</h1>
              <p className="text-xl text-white/90">Connect with life-saving heroes in your area</p>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl p-6 mb-8 -mt-16 relative z-10"
            >
              {/* Basic Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                      type="text"
                      placeholder="Search donors by name..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Blood Group */}
                <div className="relative">
                  <Droplet className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <select
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all appearance-none"
                      value={selectedBloodGroup}
                      onChange={(e) => setSelectedBloodGroup(e.target.value)}
                  >
                    <option value="">All Blood Groups</option>
                    {bloodGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>

                {/* Advanced Filters Toggle */}
                <div>
                  <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Filter size={20} />
                    Advanced Filters
                    <ChevronDown
                        size={16}
                        className={`transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              </div>

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
                                <option key={upazila.id} value={upazila.name}>{upazila.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                )}
              </AnimatePresence>

              {/* Active Filters Display */}
              {(selectedDivision || selectedDistrict || selectedUpazila || selectedBloodGroup) && (
                  <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex flex-wrap gap-2"
                  >
                    {selectedBloodGroup && (
                        <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm flex items-center gap-1">
                    <Droplet size={14} />
                          {selectedBloodGroup}
                          <button
                              onClick={() => setSelectedBloodGroup('')}
                              className="ml-1 hover:text-red-800"
                          >
                      ×
                    </button>
                  </span>
                    )}
                    {selectedDivision && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm flex items-center gap-1">
                    <MapPin size={14} />
                          {divisions.find(d => d.id.toString() === selectedDivision)?.name}
                          <button
                              onClick={() => handleDivisionChange('')}
                              className="ml-1 hover:text-blue-800"
                          >
                      ×
                    </button>
                  </span>
                    )}
                    {selectedDistrict && (
                        <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm flex items-center gap-1">
                    <MapPin size={14} />
                          {districts.find(d => d.id.toString() === selectedDistrict)?.name}
                          <button
                              onClick={() => handleDistrictChange('')}
                              className="ml-1 hover:text-green-800"
                          >
                      ×
                    </button>
                  </span>
                    )}
                    {selectedUpazila && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm flex items-center gap-1">
                    <MapPin size={14} />
                          {selectedUpazila}
                          <button
                              onClick={() => setSelectedUpazila('')}
                              className="ml-1 hover:text-purple-800"
                          >
                      ×
                    </button>
                  </span>
                    )}
                  </motion.div>
              )}
            </motion.div>

            {/* Results Summary */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 flex items-center justify-between"
            >
              <p className="text-gray-600">
                Found <span className="font-semibold text-gray-900">{filteredDonors.length}</span> donors
                {selectedBloodGroup && ` with blood type ${selectedBloodGroup}`}
              </p>
              {loading && (
                  <div className="flex items-center gap-2 text-red-600">
                    <Loader className="animate-spin" size={16} />
                    <span>Loading donors...</span>
                  </div>
              )}
            </motion.div>

            {/* Donors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                  // Loading Skeletons
                  [...Array(8)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                        <div className="h-48 bg-gray-200"></div>
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                  ))
              ) : filteredDonors.length === 0 ? (
                  <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-full text-center py-16 bg-white rounded-2xl shadow-lg"
                  >
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No donors found</h3>
                    <p className="text-gray-600 mb-6">Try adjusting your filters to find more donors</p>
                    <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedBloodGroup('');
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
                    {filteredDonors.map((donor, index) => (
                        <motion.div
                            key={donor.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02, y: -5 }}
                            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                        >
                          {/* Donor Avatar */}
                          <div className="relative h-48 bg-gradient-to-br from-red-100 to-rose-100">
                            <img
                                src={getAvatar(donor.phone, index)}
                                alt={donor.fullName}
                                className="w-full h-full object-cover"
                            />
                            {donor.isAvailable && (
                                <div className="absolute top-4 right-4 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            )}
                            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                              <span className="font-bold text-red-600">{donor.bloodType}</span>
                            </div>
                          </div>

                          {/* Donor Info */}
                          <div className="p-4">
                            <h3 className="font-semibold text-lg text-gray-800 mb-2">{donor.fullName}</h3>

                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-gray-400" />
                                <span>{donor.upazila}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-gray-400" />
                                <span>{donor.area}</span>
                              </div>
                              {donor.lastDonation && (
                                  <div className="flex items-center gap-2">
                                    <Activity size={16} className="text-gray-400" />
                                    <span>Last donated {getDaysAgo(donor.lastDonation)} days ago</span>
                                  </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <a
                                  href={`tel:${donor.phone}`}
                                  className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white py-2 rounded-xl font-medium text-center hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                              >
                                <Phone size={16} />
                                Contact
                              </a>
                            </div>
                          </div>
                        </motion.div>
                    ))}
                  </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}