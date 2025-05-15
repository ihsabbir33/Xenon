import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, FileCheck, Check, Clock, Settings,
  PackageCheck, X, AlertCircle, ChevronRight // Added ChevronRight import
} from 'lucide-react';
import { api } from "../../lib/api";
import { useLocationStore } from "../../stores/areaLocationStore";
import { toast } from "react-hot-toast";
import type { Division, District, Upazila } from "../../stores/areaLocationStore";

function getFullLocationName(
    upazilaId: number | null,
    upazilas: Upazila[],
    districts: District[],
    divisions: Division[]
): string {
  if (!upazilaId) return 'Location not set';
  const upazila = upazilas.find(u => u.id === upazilaId);
  const district = upazila && districts.find(d => d.id === upazila.district_id);
  const division = district && divisions.find(v => v.id === district.division_id);
  return upazila && district && division
      ? `${upazila.name}, ${district.name}, ${division.name}`
      : 'Location not set';
}

export function PharmacyDashboardPage() {
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);
  const [showCreatePharmacy, setShowCreatePharmacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPharmacyCreating, setIsPharmacyCreating] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [tradeLicenseNumber, setTradeLicenseNumber] = useState('');
  const [pharmacyId, setPharmacyId] = useState<number | null>(null);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    area: '',
    pharmacyName: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    area: '',
    pharmacyName: '',
  });

  const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedUpazilaId, setSelectedUpazilaId] = useState<number | null>(null);

  const { divisions, districts, upazilas, getDistrictsByDivision, getUpazilasByDistrict } = useLocationStore();

  // Load data on initial render
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);

      // Get user profile data
      const { data: response } = await api.get('/api/v1/user');
      const p = response?.data;
      const name = `${p?.firstName || p?.fname || ''} ${p?.lastName || p?.lname || ''}`.trim();

      // Set profile data
      setProfile({
        name,
        email: p?.email || '',
        phone: p?.phone || '',
        area: p?.area || '',
        pharmacyName: p?.pharmacyName || `${name}`,
      });

      setEditForm({
        name,
        email: p?.email || '',
        phone: p?.phone || '',
        area: p?.area || '',
        pharmacyName: p?.pharmacyName || `${name}'s Pharmacy`,
      });

      // Set location data if available
      if (p?.upazila) {
        const upazila = upazilas.find(u => u.id === p.upazila.id);
        const district = upazila && districts.find(d => d.id === upazila.district_id);
        const division = district && divisions.find(v => v.id === district.division_id);

        if (division) setSelectedDivisionId(division.id);
        if (district) setSelectedDistrictId(district.id);
        if (upazila) setSelectedUpazilaId(upazila.id);
      }

      // Profile is updated if upazila and area are set
      if (p?.upazila && p?.area) {
        setProfileUpdated(true);
      } else {
        setProfileUpdated(false);
      }

      // Check pharmacy status
      if (p?.pharmacyId) {
        setPharmacyId(p.pharmacyId);
        try {
          // Use the specific endpoint for fetching a pharmacy by ID
          const pharmacyRes = await api.get(`/api/v1/pharmacy/${p.pharmacyId}`);
          if (pharmacyRes.data && pharmacyRes.data.code === 'XS0001') {
            setSetupComplete(true);
            setTradeLicenseNumber(pharmacyRes.data.data?.tradeLicenseNumber || '');
            console.log('Pharmacy data loaded successfully');
          }
        } catch (err) {
          console.error('Pharmacy not found or not created yet:', err);
          setSetupComplete(false);
        }
      } else {
        setSetupComplete(false);
      }
    } catch (err) {
      console.error('Failed to load profile from API:', err);
      toast.error('Failed to load profile data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Updated handleProfileUpdate function with fixed API payload
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!selectedUpazilaId) {
      toast.error('Please select your upazila.');
      return;
    }

    if (!editForm.name.trim()) {
      toast.error('Please enter your name.');
      return;
    }

    if (!editForm.area.trim()) {
      toast.error('Please enter your detailed address.');
      return;
    }

    // Format the name
    const nameParts = editForm.name.trim().split(' ');
    // Ensure firstName is never empty
    const firstName = nameParts[0] || ' ';
    // Ensure lastName is never empty
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : "Pharmacy";

    setIsLoading(true);

    try {
      // Create a payload that exactly matches the API's expected structure
      const payload = {
        firstName,
        lastName,
        email: editForm.email,
        upazilaId: selectedUpazilaId,
        gender: "MALE", // Required fixed value per the API spec
        area: editForm.area
      };

      console.log('Profile update payload:', payload);

      // Make the API call with explicit headers
      const response = await api.put('/api/v1/user/user-profile-update', payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Profile update response:', response.data);

      if (response.data && response.data.code === 'XS0001') {
        toast.success('Profile updated successfully!');

        // Update local state
        setProfile({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          area: editForm.area,
          pharmacyName: editForm.pharmacyName || `${editForm.name}'s Pharmacy`,
        });

        setProfileUpdated(true);
        setShowEdit(false);

        // If profile is updated but pharmacy is not created, show pharmacy creation
        if (!setupComplete) {
          setTimeout(() => setShowCreatePharmacy(true), 500);
        }

        // Refresh profile data
        setTimeout(() => {
          fetchProfile();
        }, 1000);
      } else {
        // Handle specific API error messages
        const errorMsg = response.data?.message || 'Failed to update profile';
        console.error('API Error:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Profile Update Error Details:', err.response?.data || err.message);

      // Provide more specific error feedback
      let errorMessage = 'Failed to update profile. Please try again.';

      if (err.response?.status === 400) {
        errorMessage = 'Invalid data format. Please check your inputs and try again.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication expired. Please login again.';
      } else if (err.response?.status === 404) {
        errorMessage = 'User profile not found.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Updated handleCreatePharmacy function with fixed payload
  const handleCreatePharmacy = async (e) => {
    e.preventDefault();

    if (!tradeLicenseNumber.trim()) {
      toast.error('Please enter a trade license number');
      return;
    }

    setIsPharmacyCreating(true);

    try {
      // Ensure the payload exactly matches what the API expects
      const payload = {
        tradeLicenseNumber: tradeLicenseNumber.trim()
      };

      console.log('Creating pharmacy with payload:', payload);

      // Use explicit content type header
      const response = await api.post('/api/v1/pharmacy', payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Pharmacy creation response:', response.data);

      if (response.data && response.data.code === 'XS0001') {
        // Save the pharmacy ID if returned in the response
        if (response.data.data?.id) {
          setPharmacyId(response.data.data.id);
        }

        toast.success('Pharmacy created successfully!');
        setSetupComplete(true);
        setShowCreatePharmacy(false);

        // Refresh to get the latest data
        setTimeout(() => {
          fetchProfile();
        }, 1000);
      } else {
        const errorMsg = response.data?.message || 'Failed to create pharmacy';
        console.error('API Error:', errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Pharmacy Creation Error Details:', err.response?.data || err.message);

      // Provide more specific error feedback
      let errorMessage = 'Failed to create pharmacy. Please try again.';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsPharmacyCreating(false);
    }
  };

  return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with title and Edit Profile button */}
          <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">
                <span className="text-red-500">Pharmacy</span> <span className="text-sky-600">Dashboard</span>
              </h1>
              <p className="text-gray-600 mt-1">Manage your pharmacy profile and services</p>
            </div>
            <button
                onClick={() => setShowEdit(true)}
                className="mt-4 md:mt-0 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg flex items-center gap-2"
            >
              <User size={16} /> Edit Profile
            </button>
          </div>

          {/* Setup Alert */}
          {!profileUpdated ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6">
                <div className="flex items-start">
                  <AlertCircle className="text-yellow-500 mt-0.5 mr-3" size={24} />
                  <div>
                    <p className="font-medium text-yellow-800">Profile setup required!</p>
                    <p className="text-yellow-700">Please update your profile information to continue setting up your pharmacy.</p>
                    <button
                        onClick={() => setShowEdit(true)}
                        className="mt-2 px-4 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                    >
                      Update Profile
                    </button>
                  </div>
                </div>
              </div>
          ) : !setupComplete ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6">
                <div className="flex items-start">
                  <AlertCircle className="text-yellow-500 mt-0.5 mr-3" size={24} />
                  <div>
                    <p className="font-medium text-yellow-800">Pharmacy setup required!</p>
                    <p className="text-yellow-700">Your profile is complete. Now create your pharmacy to start managing your inventory.</p>
                    <button
                        onClick={() => setShowCreatePharmacy(true)}
                        className="mt-2 px-4 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                    >
                      Create Pharmacy
                    </button>
                  </div>
                </div>
              </div>
          ) : (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md mb-6">
                <div className="flex items-start">
                  <Check className="text-green-500 mt-0.5 mr-3" size={24} />
                  <div>
                    <p className="font-medium text-green-800">Pharmacy setup complete!</p>
                    <p className="text-green-700">Your pharmacy is now registered and visible to users.</p>
                  </div>
                </div>
              </div>
          )}

          {/* Pharmacy Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2 text-gray-800">
              <User size={20} className="text-sky-500" />
              Pharmacy Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center text-red-500">
                      <PackageCheck size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pharmacy Name</p>
                      <p className="font-medium">{profile.pharmacyName || `${profile.name}'s Pharmacy`}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center text-red-500">
                      <Mail size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium">{profile.email || "Not set"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center text-red-500">
                      <Phone size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-medium">{profile.phone || "Not set"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center text-sky-500">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{getFullLocationName(selectedUpazilaId, upazilas, districts, divisions)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center text-sky-500">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Detailed Address</p>
                      <p className="font-medium">{profile.area || "Not set"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center text-sky-500">
                      <FileCheck size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Trade License</p>
                      <p className="font-medium">{tradeLicenseNumber || "Not submitted"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access Cards */}
          {setupComplete && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <PackageCheck size={24} className="text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Inventory Management</h3>
                  <p className="text-gray-600 mb-4">Manage your medicine inventory, add new products, and update stock.</p>
                  <button
                      onClick={() => navigate('/pharmacy/inventory')}
                      className="text-red-500 font-medium flex items-center hover:text-red-600"
                  >
                    Manage Inventory <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mb-4">
                    <Clock size={24} className="text-sky-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Orders</h3>
                  <p className="text-gray-600 mb-4">View and manage customer orders, track deliveries and process payments.</p>
                  <button
                      onClick={() => navigate('/pharmacy/orders')}
                      className="text-sky-500 font-medium flex items-center hover:text-sky-600"
                  >
                    View Orders <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Settings size={24} className="text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Settings</h3>
                  <p className="text-gray-600 mb-4">Update your pharmacy details, operating hours, and delivery options.</p>
                  <button
                      onClick={() => setShowEdit(true)}
                      className="text-green-500 font-medium flex items-center hover:text-green-600"
                  >
                    Update Settings <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
          )}

          {/* Edit Profile Modal */}
          {showEdit && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Edit Pharmacy Profile</h2>
                    <button
                        onClick={() => setShowEdit(false)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy Name</label>
                      <input
                          name="pharmacyName"
                          value={editForm.pharmacyName}
                          onChange={e => setEditForm({ ...editForm, pharmacyName: e.target.value })}
                          placeholder="Your Pharmacy Name"
                          className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                      <input
                          name="name"
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="Full Name"
                          className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                          name="email"
                          type="email"
                          value={editForm.email}
                          onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                          placeholder="Email"
                          className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                          name="phone"
                          value={editForm.phone}
                          onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                          placeholder="Phone"
                          className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                      <select
                          value={selectedDivisionId || ''}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setSelectedDivisionId(val);
                            setSelectedDistrictId(null);
                            setSelectedUpazilaId(null);
                          }}
                          className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="">Select Division</option>
                        {divisions.map(div => <option key={div.id} value={div.id}>{div.name}</option>)}
                      </select>
                    </div>

                    {selectedDivisionId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                          <select
                              value={selectedDistrictId || ''}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setSelectedDistrictId(val);
                                setSelectedUpazilaId(null);
                              }}
                              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          >
                            <option value="">Select District</option>
                            {getDistrictsByDivision(selectedDivisionId).map(dist =>
                                <option key={dist.id} value={dist.id}>{dist.name}</option>
                            )}
                          </select>
                        </div>
                    )}

                    {selectedDistrictId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Upazila</label>
                          <select
                              value={selectedUpazilaId || ''}
                              onChange={e => setSelectedUpazilaId(Number(e.target.value))}
                              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          >
                            <option value="">Select Upazila</option>
                            {getUpazilasByDistrict(selectedDistrictId).map(upz =>
                                <option key={upz.id} value={upz.id}>{upz.name}</option>
                            )}
                          </select>
                        </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Address</label>
                      <input
                          name="area"
                          value={editForm.area}
                          onChange={e => setEditForm({ ...editForm, area: e.target.value })}
                          placeholder="Detailed Address"
                          className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                          type="button"
                          onClick={() => setShowEdit(false)}
                          className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                          type="submit"
                          className="flex-1 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-lg"
                          disabled={isLoading}
                      >
                        {isLoading ? 'Updating...' : 'Update Profile'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
          )}

          {/* Create Pharmacy Modal */}
          {showCreatePharmacy && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Create Pharmacy</h2>
                    {profileUpdated && (
                        <button
                            onClick={() => setShowCreatePharmacy(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={20} />
                        </button>
                    )}
                  </div>

                  {!profileUpdated ? (
                      <div className="text-center py-4">
                        <AlertCircle className="mx-auto text-yellow-500 mb-4" size={40} />
                        <p className="text-gray-700 mb-4">You need to complete your profile before creating a pharmacy.</p>
                        <button
                            onClick={() => {
                              setShowCreatePharmacy(false);
                              setShowEdit(true);
                            }}
                            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg"
                        >
                          Update Profile First
                        </button>
                      </div>
                  ) : (
                      <form onSubmit={handleCreatePharmacy} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Trade License Number</label>
                          <input
                              name="tradeLicenseNumber"
                              value={tradeLicenseNumber}
                              onChange={e => setTradeLicenseNumber(e.target.value)}
                              placeholder="Enter trade license number"
                              required
                              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          />
                        </div>


                        <div className="flex gap-3 pt-2">
                          <button
                              type="button"
                              onClick={() => setShowCreatePharmacy(false)}
                              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                              type="submit"
                              className="flex-1 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-lg"
                              disabled={isPharmacyCreating}
                          >
                            {isPharmacyCreating ? 'Creating...' : 'Create Pharmacy'}
                          </button>
                        </div>
                      </form>
                  )}
                </div>
              </div>
          )}
        </div>
      </div>
  );
}