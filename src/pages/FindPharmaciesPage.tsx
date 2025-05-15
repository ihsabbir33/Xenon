import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Pill,
  ChevronRight,
  X,
  AlertCircle,
  Phone,
  Download,
  Filter
} from 'lucide-react';
import { useLocationStore } from '../stores/areaLocationStore';
import { api } from '../lib/api';

interface Pharmacy {
  id: number;
  pharmacyName: string;
  phone: string;
  email: string;
  area: string;
  upazilaName: string;
  districtName: string;
  divisionName: string;
}

export function FindPharmaciesPage() {
  const navigate = useNavigate();
  const { divisions, districts, upazilas, getDistrictsByDivision, getUpazilasByDistrict } = useLocationStore();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedUpazilaId, setSelectedUpazilaId] = useState<number | null>(null);

  // UI control states
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Data states
  const [popularPharmacies, setPopularPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPopularPharmacies();
  }, []);

  const fetchPopularPharmacies = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/v1/pharmacy?page=0&size=5&sortBy=id&sortDir=DESC');
      if (data?.data?.content) {
        setPopularPharmacies(data.data.content);
      } else {
        setPopularPharmacies([]);
      }
    } catch (error) {
      console.error('Error fetching popular pharmacies:', error);
      setError('Failed to load pharmacies. Please try again later.');
      setPopularPharmacies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm) {
      navigate(`/medicine/pharmacies?search=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate('/medicine/pharmacies');
    }
  };

  const handleAreaSearch = () => {
    let queryParams = '';

    if (selectedUpazilaId) {
      queryParams = `?upazilaId=${selectedUpazilaId}`;
    } else if (selectedDistrictId) {
      queryParams = `?districtId=${selectedDistrictId}`;
    } else if (selectedDivisionId) {
      queryParams = `?divisionId=${selectedDivisionId}`;
    }

    navigate(`/medicine/pharmacies${queryParams}`);
  };

  const popularLocations = [
    { id: 1, name: 'Dhaka Sadar', district: 'Dhaka' },
    { id: 2, name: 'Chattogram Sadar', district: 'Chattogram' },
    { id: 3, name: 'Khulna Sadar', district: 'Khulna' },
    { id: 4, name: 'Rajshahi Sadar', district: 'Rajshahi' },
    { id: 5, name: 'Sylhet Sadar', district: 'Sylhet' },
    { id: 6, name: 'Barisal Sadar', district: 'Barisal' }
  ];

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const viewAllPharmacies = () => {
    navigate('/medicine/pharmacies');
  };

  return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <header className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-red-500 to-sky-500 bg-clip-text text-transparent">
              Find Pharmacies
            </span>
              <span className="text-blue-600"> Near You</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover pharmacies in your area and get the medications you need delivered to your doorstep.
            </p>
          </header>

          {/* Search and Filter Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Quick Search Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="h-16 bg-gradient-to-r from-red-500 to-sky-500 flex items-center px-6">
                <h2 className="text-white text-xl font-semibold">Quick Search</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Search for pharmacies by name, location, or available medicines.
                </p>

                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                      type="text"
                      placeholder="Search for pharmacies..."
                      className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                  />
                  {searchTerm && (
                      <button
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setSearchTerm('')}
                      >
                        <X size={18} />
                      </button>
                  )}
                </div>

                <button
                    onClick={handleSearch}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-sky-500 hover:from-red-600 hover:to-sky-600 text-white font-medium rounded-lg transition-all"
                >
                  Search Pharmacies
                </button>
              </div>
            </div>

            {/* Search by Area Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="h-16 bg-gradient-to-r from-sky-500 to-red-500 flex items-center justify-between px-6">
                <h2 className="text-white text-xl font-semibold">Search by Area</h2>
                <button
                    className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-md"
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                >
                  {filtersExpanded ? <X size={18} /> : <Filter size={18} />}
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="division" className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                    <select
                        id="division"
                        value={selectedDivisionId || ''}
                        onChange={(e) => {
                          const value = e.target.value ? Number(e.target.value) : null;
                          setSelectedDivisionId(value);
                          setSelectedDistrictId(null);
                          setSelectedUpazilaId(null);
                        }}
                        className="block w-full pl-3 pr-10 py-3 text-base border border-gray-200 focus:outline-none focus:ring-sky-500 focus:border-sky-500 rounded-lg"
                    >
                      <option value="">Select Division</option>
                      {divisions.map((division) => (
                          <option key={division.id} value={division.id}>
                            {division.name}
                          </option>
                      ))}
                    </select>
                  </div>

                  {filtersExpanded && (
                      <>
                        <div>
                          <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">District</label>
                          <select
                              id="district"
                              value={selectedDistrictId || ''}
                              onChange={(e) => {
                                const value = e.target.value ? Number(e.target.value) : null;
                                setSelectedDistrictId(value);
                                setSelectedUpazilaId(null);
                              }}
                              disabled={!selectedDivisionId}
                              className="block w-full pl-3 pr-10 py-3 text-base border border-gray-200 focus:outline-none focus:ring-sky-500 focus:border-sky-500 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
                          >
                            <option value="">Select District</option>
                            {selectedDivisionId && getDistrictsByDivision(selectedDivisionId).map((district) => (
                                <option key={district.id} value={district.id}>
                                  {district.name}
                                </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="upazila" className="block text-sm font-medium text-gray-700 mb-1">Upazila</label>
                          <select
                              id="upazila"
                              value={selectedUpazilaId || ''}
                              onChange={(e) => {
                                const value = e.target.value ? Number(e.target.value) : null;
                                setSelectedUpazilaId(value);
                              }}
                              disabled={!selectedDistrictId}
                              className="block w-full pl-3 pr-10 py-3 text-base border border-gray-200 focus:outline-none focus:ring-sky-500 focus:border-sky-500 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
                          >
                            <option value="">Select Upazila</option>
                            {selectedDistrictId && getUpazilasByDistrict(selectedDistrictId).map((upazila) => (
                                <option key={upazila.id} value={upazila.id}>
                                  {upazila.name}
                                </option>
                            ))}
                          </select>
                        </div>
                      </>
                  )}
                </div>

                <button
                    onClick={handleAreaSearch}
                    className="w-full py-3 bg-gradient-to-r from-sky-500 to-red-500 hover:from-sky-600 hover:to-red-600 text-white font-medium rounded-lg mt-6"
                >
                  Find Pharmacies in this Area
                </button>
              </div>
            </div>
          </div>

          {/* Available Pharmacies Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Available Pharmacies</h2>
              <button
                  onClick={viewAllPharmacies}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                View All <ChevronRight size={16} className="ml-1" />
              </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" size={20} />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
            ) : popularPharmacies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popularPharmacies.map((pharmacy) => (
                      <div
                          key={pharmacy.id}
                          className="bg-white rounded-lg shadow-md p-5 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => navigate(`/medicine/pharmacies/${pharmacy.id}`)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg text-gray-800">{pharmacy.pharmacyName}</h3>
                          <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">Open</div>
                        </div>
                        <div className="space-y-2 text-gray-600 text-sm">
                          <div className="flex items-start">
                            <MapPin size={16} className="mr-2 mt-0.5 text-red-500 flex-shrink-0" />
                            <span>{pharmacy.area}, {pharmacy.upazilaName}, {pharmacy.districtName}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone size={16} className="mr-2 text-sky-500 flex-shrink-0" />
                            <span>{pharmacy.phone}</span>
                          </div>
                        </div>
                        <button
                            className="mt-4 w-full py-2 text-sky-600 border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/medicine/pharmacies/${pharmacy.id}`);
                            }}
                        >
                          View Details <ChevronRight size={16} className="ml-1" />
                        </button>
                      </div>
                  ))}
                </div>
            ) : (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No pharmacies found</h3>
                  <p className="text-gray-500">Try searching for pharmacies or browse by location.</p>
                </div>
            )}
          </div>

          {/* Popular Locations Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Popular Locations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {popularLocations.map((location) => (
                  <div
                      key={location.id}
                      className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                      onClick={() => navigate('/medicine/pharmacies')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin size={18} className="text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{location.name}</h3>
                        <p className="text-sm text-gray-500">{location.district}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
              ))}
            </div>
          </div>

          {/* Why Choose Us Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-12 border border-gray-100">
            <div className="h-16 bg-gradient-to-r from-red-500 to-sky-500 flex items-center px-6">
              <h2 className="text-white text-xl font-semibold">Why Choose Our Pharmacy Network</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Pill size={24} className="text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Verified Pharmacies</h3>
                  <p className="text-gray-600">
                    All pharmacies in our network are verified and licensed to ensure quality service.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin size={24} className="text-sky-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Wide Coverage</h3>
                  <p className="text-gray-600">
                    Find pharmacies in your local area with our extensive network across the country.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={24} className="text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Easy to Search</h3>
                  <p className="text-gray-600">
                    Quickly find pharmacies and medications with our intuitive search function.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Download App Banner */}
          <div className="bg-gradient-to-r from-red-500 to-sky-500 rounded-xl overflow-hidden">
            <div className="p-8 md:p-12 text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Download Our Mobile App</h2>
                  <p className="mb-6 text-white/90">
                    Get quick access to pharmacies, order medicines, and have them delivered to your doorstep with our mobile app.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button className="bg-white text-gray-800 px-6 py-3 rounded-lg font-medium flex items-center justify-center hover:bg-gray-100">
                      <Download className="w-6 h-6 mr-2" />
                      Download App
                    </button>
                    <button className="border border-white text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center hover:bg-white/10">
                      Learn More
                    </button>
                  </div>
                </div>
                <div className="hidden md:flex justify-center">
                  <div className="w-64 h-64 bg-white/20 rounded-full flex items-center justify-center">
                    <Pill className="w-32 h-32 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}