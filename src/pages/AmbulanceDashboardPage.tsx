import { useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Truck, Edit, Plus, AlertCircle, CheckCircle, Wrench } from 'lucide-react';
import { api } from '../lib/api';
import { useLocationStore } from '../stores/areaLocationStore';
import type { Division, District, Upazila } from '../stores/areaLocationStore';

const fieldLabels: Record<string, string> = {
  ambulanceType: 'Ambulance Type',
  ambulanceNumber: 'Ambulance Number',
  ambulanceStatus: 'Ambulance Status',
  about: 'About the Ambulance',
  service_offers: 'Service Offers (comma-separated)',
  hospital_affiliation: 'Hospital Affiliation',
  coverage_areas: 'Coverage Areas (comma-separated)',
  response_time: 'Response Time (in minutes)',
  doctors: 'Number of Doctors',
  nurses: 'Number of Nurses',
  paramedics: 'Number of Paramedics',
  team_qualification: 'Team Qualification',
  starting_fee: 'Starting Fee (in BDT)',
};

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

export function AmbulanceDashboardPage() {
  const [showEdit, setShowEdit] = useState(false);
  const [showCreateAmbulance, setShowCreateAmbulance] = useState(false);
  const [ambulance, setAmbulance] = useState<any>(null);
  const [ambulanceStatus, setAmbulanceStatus] = useState('');
  const [ambulanceId, setAmbulanceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [userId, setUserId] = useState<number | null>(null);

  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', area: '',
  });

  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', area: ''
  });

  const [ambulanceForm, setAmbulanceForm] = useState({
    ambulanceType: '', ambulanceNumber: '', ambulanceStatus: 'AVAILABLE',
    about: '', service_offers: '', hospital_affiliation: '', coverage_areas: '',
    response_time: 0, doctors: 0, nurses: 0, paramedics: 0,
    team_qualification: '', starting_fee: 0
  });

  const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedUpazilaId, setSelectedUpazilaId] = useState<number | null>(null);

  const { divisions, districts, upazilas, getDistrictsByDivision, getUpazilasByDistrict } = useLocationStore();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/v1/user');
      const p = data?.data;
      setUserId(p?.id);
      const name = `${p?.firstName || p?.fname || ''} ${p?.lastName || p?.lname || ''}`.trim();

      setProfile({ name, email: p?.email || '', phone: p?.phone || '', area: p?.area || '' });
      setEditForm({ name, email: p?.email || '', phone: p?.phone || '', area: p?.area || '' });

      if (p?.upazila) {
        const upazila = upazilas.find(u => u.id === p.upazila.id);
        const district = upazila && districts.find(d => d.id === upazila.district_id);
        const division = district && divisions.find(v => v.id === district.division_id);
        if (division) setSelectedDivisionId(division.id);
        if (district) setSelectedDistrictId(district.id);
        if (upazila) setSelectedUpazilaId(upazila.id);
      }

      const ambulanceRes = await api.get(`/api/v1/ambulance/${p?.id}`);
      const amb = ambulanceRes.data?.data;

      if (amb?.id) {
        setAmbulance(amb);
        setAmbulanceId(amb.id);
        setAmbulanceStatus(amb.ambulanceStatus);
      } else {
        setAmbulance(null);
        setAmbulanceId(null);
        setAmbulanceStatus('');
      }
    } catch (err) {
      console.warn('Ambulance not found or failed to fetch:', err);
      setAmbulance(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameParts = editForm.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    // FIX: Use 'ambulance' as default last name if not provided
    const lastName = nameParts.slice(1).join(' ') || 'ambulance';

    if (!selectedUpazilaId) return toast.error('Please select your upazila.');

    try {
      await api.put('/api/v1/user/user-profile-update', {
        firstName,
        lastName,
        email: editForm.email,
        area: editForm.area,
        upazilaId: selectedUpazilaId,
        gender: 'OTHER',
      });
      toast.success('Profile updated!');
      setShowEdit(false);
      fetchProfile();
    } catch (err: any) {
      console.error('[Update Error]', err?.response?.data || err);
      toast.error('Failed to update profile');
    }
  };

  const handleCreateAmbulance = async () => {
    try {
      const res = await api.post('/api/v1/ambulance/create', ambulanceForm);
      toast.success('Ambulance created successfully!');
      setShowCreateAmbulance(false);
      fetchProfile();
    } catch (err: any) {
      console.error('[Create Ambulance Error]', err?.response?.data || err);
      toast.error(err?.response?.data?.message || 'Creation failed');
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatusUpdating(true);
    try {
      await api.put(`/api/v1/ambulance/${ambulanceId}/status?status=${newStatus}`);
      toast.success('Ambulance status updated!');
      setAmbulanceStatus(newStatus);
    } catch (err: any) {
      console.error('[Status Update Error]', err?.response?.data || err);
      toast.error('Failed to update ambulance status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'ON_TRIP':
        return <Truck className="text-blue-500" size={20} />;
      case 'MAINTENANCE':
        return <Wrench className="text-orange-500" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-50 border-green-200';
      case 'ON_TRIP':
        return 'bg-blue-50 border-blue-200';
      case 'MAINTENANCE':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-12 bg-gray-200 rounded w-1/3"></div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center animate-fade-in">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Ambulance Management
            </h1>
            <button
                onClick={() => setShowEdit(true)}
                className="bg-blue-600 text-white px-6 py-2 text-sm rounded-full hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <Edit size={16} />
              Edit Info
            </button>
          </div>

          {/* Profile Info */}
          <div className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">User Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <User className="text-blue-600" size={20} />
                <span className="text-gray-700">{profile.name}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Phone className="text-blue-600" size={20} />
                <span className="text-gray-700">{profile.phone}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <Mail className="text-blue-600" size={20} />
                <span className="text-gray-700">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <MapPin className="text-blue-600" size={20} />
                <span className="text-gray-700">{getFullLocationName(selectedUpazilaId, upazilas, districts, divisions)}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <MapPin className="text-blue-600" size={20} />
                <span className="text-gray-700">{profile.area}</span>
              </div>
            </div>
          </div>

          {/* Ambulance Info */}
          {ambulance ? (
              <div className={`bg-white p-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-200 ${getStatusBgColor(ambulanceStatus)} border`}>
                <div className="flex items-center gap-3 mb-4">
                  <Truck className="text-blue-600" size={24} />
                  <h2 className="text-xl font-semibold text-gray-800">Ambulance Details</h2>
                  {getStatusIcon(ambulanceStatus)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <p className="text-gray-700"><span className="font-medium">Type:</span> {ambulance.ambulanceType}</p>
                    <p className="text-gray-700"><span className="font-medium">Number:</span> {ambulance.ambulanceNumber}</p>
                    <p className="text-gray-700"><span className="font-medium">Hospital:</span> {ambulance.hospital_affiliation}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-700"><span className="font-medium">Response Time:</span> {ambulance.response_time} minutes</p>
                    <p className="text-gray-700"><span className="font-medium">Starting Fee:</span> ৳{ambulance.starting_fee}</p>
                    <p className="text-gray-700"><span className="font-medium">Coverage:</span> {ambulance.coverageAreas?.join(', ')}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 font-medium mb-2">About:</p>
                  <p className="text-gray-600 bg-white bg-opacity-50 p-3 rounded">{ambulance.about}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white bg-opacity-50 p-3 rounded text-center">
                    <p className="text-2xl font-bold text-blue-600">{ambulance.doctors}</p>
                    <p className="text-sm text-gray-600">Doctors</p>
                  </div>
                  <div className="bg-white bg-opacity-50 p-3 rounded text-center">
                    <p className="text-2xl font-bold text-blue-600">{ambulance.nurses}</p>
                    <p className="text-sm text-gray-600">Nurses</p>
                  </div>
                  <div className="bg-white bg-opacity-50 p-3 rounded text-center">
                    <p className="text-2xl font-bold text-blue-600">{ambulance.paramedics}</p>
                    <p className="text-sm text-gray-600">Paramedics</p>
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Status:</label>
                  <select
                      value={ambulanceStatus}
                      onChange={handleStatusChange}
                      disabled={statusUpdating}
                      className="w-full border px-4 py-2 rounded-lg hover:border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50"
                  >
                    <option value="AVAILABLE">✅ AVAILABLE</option>
                    <option value="ON_TRIP">🚑 ON_TRIP</option>
                    <option value="MAINTENANCE">🔧 MAINTENANCE</option>
                  </select>
                  {statusUpdating && (
                      <p className="text-sm text-blue-600 mt-2 animate-pulse">Updating status...</p>
                  )}
                </div>
              </div>
          ) : (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg text-center">
                <Truck size={48} className="mx-auto text-blue-600 mb-4" />
                <h2 className="text-xl font-semibold mb-3">You haven't created an ambulance yet</h2>
                <p className="text-gray-600 mb-6">Create your ambulance profile to start receiving service requests</p>
                <button
                    onClick={() => setShowCreateAmbulance(true)}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
                >
                  <Plus size={20} />
                  Create Ambulance
                </button>
              </div>
          )}

          {/* Edit Profile Modal */}
          <Transition appear show={showEdit} as="div">
            <Dialog as="div" className="relative z-50" onClose={() => setShowEdit(false)}>
              <Transition.Child
                  enter="ease-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-30" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <Transition.Child
                      enter="ease-out duration-300"
                      enterFrom="opacity-0 scale-95"
                      enterTo="opacity-100 scale-100"
                      leave="ease-in duration-200"
                      leaveFrom="opacity-100 scale-100"
                      leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                      <Dialog.Title className="text-lg font-bold mb-4">Edit Profile Information</Dialog.Title>
                      <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input
                              value={editForm.name}
                              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                              placeholder="Full Name"
                              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                              value={editForm.email}
                              onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                              placeholder="Email"
                              type="email"
                              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                              value={editForm.phone}
                              onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                              placeholder="Phone"
                              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                          <input
                              value={editForm.area}
                              onChange={e => setEditForm({ ...editForm, area: e.target.value })}
                              placeholder="Area"
                              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                          <select
                              value={selectedDivisionId || ''}
                              onChange={e => {
                                const val = +e.target.value;
                                setSelectedDivisionId(val);
                                setSelectedDistrictId(null);
                                setSelectedUpazilaId(null);
                              }}
                              className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
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
                                    const val = +e.target.value;
                                    setSelectedDistrictId(val);
                                    setSelectedUpazilaId(null);
                                  }}
                                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                              >
                                <option value="">Select District</option>
                                {getDistrictsByDivision(selectedDivisionId).map(dist => <option key={dist.id} value={dist.id}>{dist.name}</option>)}
                              </select>
                            </div>
                        )}

                        {selectedDistrictId && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Upazila</label>
                              <select
                                  value={selectedUpazilaId || ''}
                                  onChange={e => setSelectedUpazilaId(+e.target.value)}
                                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
                              >
                                <option value="">Select Upazila</option>
                                {getUpazilasByDistrict(selectedDistrictId).map(upz => <option key={upz.id} value={upz.id}>{upz.name}</option>)}
                              </select>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transform hover:scale-[1.02] transition-all duration-200"
                        >
                          Update Profile
                        </button>
                      </form>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>

          {/* Create Ambulance Modal */}
          <Transition appear show={showCreateAmbulance} as="div">
            <Dialog as="div" className="relative z-50" onClose={() => setShowCreateAmbulance(false)}>
              <Transition.Child
                  enter="ease-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-30" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                  <Transition.Child
                      enter="ease-out duration-300"
                      enterFrom="opacity-0 scale-95"
                      enterTo="opacity-100 scale-100"
                      leave="ease-in duration-200"
                      leaveFrom="opacity-100 scale-100"
                      leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                      <Dialog.Title className="text-xl font-bold mb-6">Create Your Ambulance</Dialog.Title>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2">
                        {Object.entries(ambulanceForm).map(([key, val]) => (
                            <div key={key} className="space-y-1">
                              <label className="text-sm font-medium text-gray-700 block">{fieldLabels[key]}</label>
                              <input
                                  type={typeof val === 'number' ? 'number' : 'text'}
                                  value={val}
                                  onChange={e => setAmbulanceForm({
                                    ...ambulanceForm,
                                    [key]: key.includes('time') || key.includes('fee') || ['doctors', 'nurses', 'paramedics'].includes(key)
                                        ? +e.target.value
                                        : e.target.value
                                  })}
                                  placeholder={fieldLabels[key]}
                                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 transition-all"
                              />
                            </div>
                        ))}
                      </div>
                      <button
                          onClick={handleCreateAmbulance}
                          className="w-full bg-green-600 text-white py-3 rounded-lg mt-6 hover:bg-green-700 transform hover:scale-[1.02] transition-all duration-200"
                      >
                        Create Ambulance
                      </button>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </div>
      </div>
  );
}