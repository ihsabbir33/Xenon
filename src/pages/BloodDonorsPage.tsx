import { useEffect, useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { api } from '../lib/api'; // ✅ Your Axios instance

interface Donor {
  id: number;
  bloodType: string;
  age: number;
  weight: number;
  phoneNumber: string;
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
}

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const bloodGroupMap: { [key: string]: string } = {
  'A+': 'A_POS', 'A-': 'A_NEG',
  'B+': 'B_POS', 'B-': 'B_NEG',
  'AB+': 'AB_POS', 'AB-': 'AB_NEG',
  'O+': 'O_POS', 'O-': 'O_NEG'
};

export function BloodDonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      const { data: baseResponse } = await api.get('/api/v1/donor/available', {
        params: {
          bloodType: selectedBloodGroup ? bloodGroupMap[selectedBloodGroup] : undefined,
          page: 0,
          size: 100,
          sortBy: 'id',
          direction: 'asc'
        }
      });
      if (baseResponse.code === 'XS0001') {
        setDonors(baseResponse.data.content);
      }
    } catch (error) {
      console.error('Error fetching donors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDivisionChange = (division: string) => {
    setSelectedDivision(division);
    setSelectedDistrict('');
    setSelectedCity('');
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setSelectedCity('');
  };

  // Dynamically extract divisions, districts, cities
  const uniqueDivisions = Array.from(new Set(donors.map(d => d.upazila.district.division.name)));
  const uniqueDistricts = selectedDivision
    ? Array.from(new Set(donors.filter(d => d.upazila.district.division.name === selectedDivision).map(d => d.upazila.district.name)))
    : [];
  const uniqueCities = selectedDistrict
    ? Array.from(new Set(donors.filter(d => d.upazila.district.name === selectedDistrict).map(d => d.upazila.name)))
    : [];

  const filteredDonors = donors.filter(donor => {
    const matchesBloodGroup = !selectedBloodGroup || donor.bloodType === bloodGroupMap[selectedBloodGroup];
    const matchesDivision = !selectedDivision || donor.upazila.district.division.name === selectedDivision;
    const matchesDistrict = !selectedDistrict || donor.upazila.district.name === selectedDistrict;
    const matchesCity = !selectedCity || donor.upazila.name === selectedCity;
    const matchesSearch = donor.phoneNumber.includes(searchTerm);

    return matchesBloodGroup && matchesDivision && matchesDistrict && matchesCity && matchesSearch;
  });

  const randomAvatar = "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=300&h=300";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blood Donors Directory</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find blood donors near you. Connect with verified donors and help save lives.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search donors by phone..."
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-50 border-none focus:ring-2 focus:ring-red-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="p-3 rounded-lg bg-gray-50 border-none focus:ring-2 focus:ring-red-200"
              value={selectedBloodGroup}
              onChange={(e) => setSelectedBloodGroup(e.target.value)}
            >
              <option value="">All Blood Groups</option>
              {bloodGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              className="p-3 rounded-lg bg-gray-50 border-none focus:ring-2 focus:ring-red-200"
              value={selectedDivision}
              onChange={(e) => handleDivisionChange(e.target.value)}
            >
              <option value="">Select Division</option>
              {uniqueDivisions.map(division => (
                <option key={division} value={division}>{division}</option>
              ))}
            </select>

            <select
              className="p-3 rounded-lg bg-gray-50 border-none focus:ring-2 focus:ring-red-200"
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={!selectedDivision}
            >
              <option value="">Select District</option>
              {uniqueDistricts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>

            <select
              className="p-3 rounded-lg bg-gray-50 border-none focus:ring-2 focus:ring-red-200"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedDistrict}
            >
              <option value="">Select City</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Donors List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading donors...</div>
          ) : filteredDonors.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12">No donors found.</div>
          ) : (
            filteredDonors.map((donor) => (
              <div key={donor.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all">
                <img
                  src={randomAvatar}
                  alt="Donor"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{donor.bloodType.replace('_POS', '+').replace('_NEG', '-')}</h3>
                    <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                      {donor.bloodType.replace('_POS', '+').replace('_NEG', '-')}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{donor.upazila.name}, {donor.upazila.district.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <a
                      href={`tel:${donor.phoneNumber}`}
                      className="text-blue-500 hover:text-blue-600 font-medium"
                    >
                      Contact
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
