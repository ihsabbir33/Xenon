import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Search,
    MapPin,
    Phone,
    ChevronLeft,
    ChevronRight,
    Pill,
    Filter,
    X,
    AlertCircle,
    Clock
} from 'lucide-react';
import { useLocationStore } from '../../stores/areaLocationStore';
import { api } from '../../lib/api';

interface Pharmacy {
    id: number;
    pharmacyName: string;
    phone: string;
    email: string;
    area: string;
    upazilaName: string;
    districtName: string;
    divisionName: string;
    latitude?: number;
    longitude?: number;
    tradeLicenseNumber?: string;
}

interface PharmacyResponse {
    totalItems: number;
    size: number;
    totalPages: number;
    currentPage: number;
    content: Pharmacy[];
}

export function PharmacyListPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize] = useState(10);
    const [sortBy] = useState('id');
    const [sortDir, setSortDir] = useState('DESC');
    const [showFilters, setShowFilters] = useState(false);

    const { divisions, districts, upazilas, getDistrictsByDivision, getUpazilasByDistrict } = useLocationStore();
    const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(null);
    const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
    const [selectedUpazilaId, setSelectedUpazilaId] = useState<number | null>(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const searchQuery = queryParams.get('search');
        const upazilaId = queryParams.get('upazilaId');

        if (searchQuery) {
            setSearchTerm(searchQuery);
            searchPharmacies(searchQuery);
        } else if (upazilaId) {
            setSelectedUpazilaId(Number(upazilaId));
            fetchPharmaciesByUpazila(Number(upazilaId));
        } else {
            fetchPharmacies();
        }
    }, [location.search]);

    useEffect(() => {
        if (!location.search) {
            fetchPharmacies();
        }
    }, [page, pageSize, sortDir]);

    const fetchPharmacies = async () => {
        setLoading(true);
        setError('');
        try {
            const url = `/api/v1/pharmacy?page=${page}&size=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`;
            const response = await api.get(url);
            const data = response.data.data as PharmacyResponse;

            setPharmacies(data.content);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (err) {
            console.error('Error fetching pharmacies:', err);
            setError('Failed to load pharmacies. Please try again later.');
            setPharmacies([]);
            setTotalPages(0);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    };

    const fetchPharmaciesByUpazila = async (upazilaId: number) => {
        setLoading(true);
        setError('');
        try {
            const url = `/api/v1/pharmacy/by-upazila/${upazilaId}?page=${page}&size=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`;
            const response = await api.get(url);
            const data = response.data.data as PharmacyResponse;

            setPharmacies(data.content);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (err) {
            console.error('Error fetching pharmacies by upazila:', err);
            setError('Failed to load pharmacies. Please try again later.');
            setPharmacies([]);
            setTotalPages(0);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    };

    const searchPharmacies = async (query = searchTerm) => {
        if (!query.trim()) {
            return fetchPharmacies();
        }

        setLoading(true);
        setError('');
        try {
            const response = await api.get(`/api/v1/pharmacy/search?name=${query}&page=${page}&size=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`);
            const data = response.data.data as PharmacyResponse;

            setPharmacies(data.content);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (err) {
            console.error('Error searching pharmacies:', err);
            setError('Failed to search pharmacies. Please try again later.');
            setPharmacies([]);
            setTotalPages(0);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
        }
    };

    const clearFilters = () => {
        setSelectedDivisionId(null);
        setSelectedDistrictId(null);
        setSelectedUpazilaId(null);
        setSearchTerm('');
        navigate('/medicine/pharmacies');
    };

    const handleSearch = () => {
        if (searchTerm) {
            navigate(`/medicine/pharmacies?search=${encodeURIComponent(searchTerm)}`);
        } else {
            navigate('/medicine/pharmacies');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleAreaSearch = () => {
        if (selectedUpazilaId) {
            navigate(`/medicine/pharmacies?upazilaId=${selectedUpazilaId}`);
        } else {
            navigate('/medicine/pharmacies');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-red-500 to-sky-500 bg-clip-text text-transparent">
              Find Nearby Pharmacies
            </span>
                    </h1>
                    <p className="text-gray-600">Discover pharmacies in your area for all your medical needs</p>
                </header>

                {/* Search and Filter Section */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-100">
                    <div className="p-5 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            {/* Search Bar */}
                            <div className="relative flex-grow max-w-2xl">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search for pharmacies by name..."
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 border"
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

                            <div className="flex gap-2">
                                <button
                                    onClick={handleSearch}
                                    className="px-4 py-3 bg-gradient-to-r from-red-500 to-sky-500 hover:from-red-600 hover:to-sky-600 text-white font-medium rounded-lg"
                                >
                                    Search
                                </button>

                                {/* Filter Button */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="inline-flex items-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <Filter size={18} className="mr-2" />
                                    {showFilters ? 'Hide Filters' : 'Filter by Location'}
                                </button>
                            </div>
                        </div>

                        {/* Filter Panel */}
                        {showFilters && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-medium text-gray-800">Filter by Location</h3>
                                    <button onClick={clearFilters} className="text-red-500 text-sm flex items-center hover:text-red-700">
                                        <X size={16} className="mr-1" /> Clear Filters
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
                                        >
                                            <option value="">Select Division</option>
                                            {divisions.map((division) => (
                                                <option key={division.id} value={division.id}>
                                                    {division.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

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
                                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:text-gray-500"
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
                                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md disabled:bg-gray-100 disabled:text-gray-500"
                                        >
                                            <option value="">Select Upazila</option>
                                            {selectedDistrictId && getUpazilasByDistrict(selectedDistrictId).map((upazila) => (
                                                <option key={upazila.id} value={upazila.id}>
                                                    {upazila.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={handleAreaSearch}
                                    className="mt-4 w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-sky-500 to-red-500 text-white rounded-md hover:from-sky-600 hover:to-red-600"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Info */}
                <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">
                        {loading
                            ? 'Loading pharmacies...'
                            : `Showing ${pharmacies.length} of ${totalItems} pharmacies`}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-6">
                        <div className="flex items-center">
                            <AlertCircle className="text-red-500 mr-2" size={20} />
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Loading Indicator */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                    </div>
                )}

                {/* Pharmacy List */}
                {!loading && pharmacies.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl shadow-md text-center">
                        <Pill className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No pharmacies found</h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm
                                ? `No pharmacies match "${searchTerm}"`
                                : selectedUpazilaId
                                    ? "No pharmacies found in the selected area"
                                    : "No pharmacies are currently available"}
                        </p>
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {!loading && pharmacies.map((pharmacy) => (
                            <Link
                                key={pharmacy.id}
                                to={`/medicine/pharmacies/${pharmacy.id}`}
                                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 flex flex-col h-full group"
                            >
                                <div className="h-24 bg-gradient-to-r from-red-500 to-sky-500 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                    <Pill className="h-12 w-12 text-white" />
                                </div>
                                <div className="p-5 flex-grow">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-red-500 transition-colors">{pharmacy.pharmacyName}</h3>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-start">
                                            <MapPin size={16} className="mr-2 mt-0.5 text-red-500 flex-shrink-0" />
                                            <span>{pharmacy.area}, {pharmacy.upazilaName}, {pharmacy.districtName}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Phone size={16} className="mr-2 text-sky-500 flex-shrink-0" />
                                            <span>{pharmacy.phone}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Clock size={16} className="mr-2 text-sky-500 flex-shrink-0" />
                                            <span>9:00 AM - 10:00 PM</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-5 py-3 bg-gray-50 text-sm flex justify-between items-center border-t border-gray-100">
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Open Now</span>
                                    <span className="text-sky-600 font-medium group-hover:text-red-500 transition-colors flex items-center">
                    View Details <ChevronRight size={16} className="ml-1" />
                  </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-2 mt-8">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 0}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} className="mr-1" /> Previous
                        </button>

                        <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Calculate which page numbers to show
                                let pageNum = page;
                                if (totalPages <= 5) {
                                    pageNum = i;
                                } else if (page < 2) {
                                    pageNum = i;
                                } else if (page > totalPages - 3) {
                                    pageNum = totalPages - 5 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-sm ${
                                            page === pageNum
                                                ? 'bg-gradient-to-r from-red-500 to-sky-500 text-white font-semibold'
                                                : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNum + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages - 1}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next <ChevronRight size={16} className="ml-1" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}