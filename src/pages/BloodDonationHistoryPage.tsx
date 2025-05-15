import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Activity,
  Heart,
  Edit,
  CalendarDays,
  Award,
  TrendingUp,
  Droplet,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

interface DonationRecord {
  recipient: string;
  date: string;
  location: string;
  bloodGroup: string;
  units: number;
  certificate?: string;
}

interface DonationRecordFromAPI {
  patientName: string;
  quantity: number;
  hospitalName: string;
  lastDonation: string;
}

interface DonorProfile {
  bloodType: string;
  age: number;
  weight: number;
  interested: 'YES' | 'NO';
  canDonate: boolean;
  lastDonation?: string;
}

interface DonationHistoryResponse {
  donationCount: number;
  unitCount: number;
  bloodType: string | null;
  bloodDonationHistoryResponses: DonationRecordFromAPI[] | null;
}

export function BloodDonationHistoryPage() {
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [history, setHistory] = useState<DonationHistoryResponse | null>(null);
  const [donationRecords, setDonationRecords] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [donationEditModal, setDonationEditModal] = useState(false);
  const [donationInfo, setDonationInfo] = useState({
    patientName: '',
    hospitalName: '',
    quantity: 1,
    lastDonation: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfileAndHistory();
  }, []);

  const fetchProfileAndHistory = async () => {
    try {
      setLoading(true);
      const [profileRes, historyRes] = await Promise.all([
        api.get('/api/v1/donor/profile'),
        api.get('/api/v1/donor/donation-history'),
      ]);

      if (profileRes.data.code === 'XS0001') {
        const d = profileRes.data.data;
        setProfile({
          bloodType: d.bloodType,
          age: d.age,
          weight: d.weight,
          interested: d.interested,
          canDonate: d.canDonate,
          lastDonation: d.lastDonation
        });
      }

      if (historyRes.data.code === 'XS0001') {
        const historyData = historyRes.data.data;
        setHistory(historyData);

        // Transform the API response to match frontend interface
        if (historyData.bloodDonationHistoryResponses) {
          const transformedRecords = historyData.bloodDonationHistoryResponses.map((record: DonationRecordFromAPI) => ({
            recipient: record.patientName,
            date: record.lastDonation,
            location: record.hospitalName,
            bloodGroup: historyData.bloodType || 'UNKNOWN',
            units: record.quantity,
            certificate: undefined
          }));
          setDonationRecords(transformedRecords);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load donation history');
    } finally {
      setLoading(false);
    }
  };

  const handleDonationInfoUpdate = async () => {
    if (!donationInfo.patientName || !donationInfo.hospitalName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const res = await api.post('/api/v1/donor/blood-given', {
        patientName: donationInfo.patientName,
        hospitalName: donationInfo.hospitalName,
        quantity: donationInfo.quantity,
        lastDonation: donationInfo.lastDonation || new Date().toISOString().split('T')[0]
      });

      if (res.data.code === 'XS0001') {
        toast.success('Donation info updated successfully');
        fetchProfileAndHistory();
        setDonationEditModal(false);
        setDonationInfo({
          patientName: '',
          hospitalName: '',
          quantity: 1,
          lastDonation: ''
        });
      } else {
        throw new Error(res.data.message || 'Unknown error');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update donation info');
    } finally {
      setSaving(false);
    }
  };

  const formatBloodType = (type: string) => {
    return type?.replace('_POS', '+').replace('_NEG', '-') || 'Unknown';
  };

  const getDaysUntilNextDonation = () => {
    if (!profile?.lastDonation) return null;
    const lastDate = new Date(profile.lastDonation);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 56); // 8 weeks minimum gap
    const today = new Date();
    const daysLeft = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  const statsCards = [
    {
      title: 'Total Donations',
      value: history?.donationCount ?? 0,
      icon: <Activity />,
      color: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Total Units',
      value: history?.unitCount ?? 0,
      icon: <Heart />,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Lives Impacted',
      value: (history?.unitCount ?? 0) * 3, // Approximate lives saved
      icon: <Award />,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Next Eligible',
      value: getDaysUntilNextDonation() ? `${getDaysUntilNextDonation()} days` : 'Now',
      icon: <CalendarDays />,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-100'
    }
  ];

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading your donation journey...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8"
          >
            <Link to="/blood-donation" className="inline-flex items-center text-gray-600 hover:text-red-600 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Blood Donation
            </Link>
          </motion.div>

          <div className="max-w-6xl mx-auto space-y-8">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-600 to-rose-600 p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">Your Donation Journey</h1>
                <p className="text-red-100">Every drop counts in saving lives</p>
              </div>

              {profile && (
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center text-white">
                          <Droplet size={36} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">
                            Blood Type: {formatBloodType(profile.bloodType)}
                          </h2>
                          <p className="text-gray-600">
                            {profile.canDonate ? 'Eligible to donate' : 'Not eligible to donate'}
                          </p>
                        </div>
                      </div>
                      <button
                          onClick={() => setDonationEditModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                      >
                        <Edit size={16} />
                        Add Donation
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {statsCards.map((stat, index) => (
                          <motion.div
                              key={index}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.05, y: -5 }}
                              className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer"
                          >
                            <div className={`${stat.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-3`}>
                              <div className={`bg-gradient-to-br ${stat.color} w-full h-full rounded-xl flex items-center justify-center text-white`}>
                                {stat.icon}
                              </div>
                            </div>
                            <p className="text-sm text-gray-500">{stat.title}</p>
                            <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                              {stat.value}
                            </p>
                          </motion.div>
                      ))}
                    </div>
                  </div>
              )}
            </motion.div>

            {/* Donation History */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <TrendingUp className="mr-2 text-red-500" />
                Donation History
              </h2>

              {donationRecords && donationRecords.length > 0 ? (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {donationRecords.map((record, idx) => (
                          <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: idx * 0.1 }}
                              className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div className="flex items-start gap-4">
                                <div className="bg-white p-3 rounded-xl shadow-sm">
                                  <CalendarDays className="text-red-500" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <User size={16} />
                                    {record.recipient}
                                  </h3>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600 mt-1">
                                    <span className="flex items-center gap-1">
                                      <Calendar size={14} />
                                      {new Date(record.date).toLocaleDateString()}
                                    </span>
                                    <span className="hidden sm:block">•</span>
                                    <span className="flex items-center gap-1">
                                      <MapPin size={14} />
                                      {record.location}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                    {formatBloodType(record.bloodGroup)}
                                  </span>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {record.units} unit{record.units > 1 ? 's' : ''}
                                  </p>
                                </div>
                                {record.certificate && (
                                    <a
                                        href={record.certificate}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-blue-100 text-blue-600 p-2 rounded-xl hover:bg-blue-200 transition-colors"
                                        title="View Certificate"
                                    >
                                      <Award size={20} />
                                    </a>
                                )}
                              </div>
                            </div>
                          </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
              ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-12 h-12 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No donation history yet</h3>
                    <p className="text-gray-600 mb-6">Start your life-saving journey today!</p>
                    <Link
                        to="/blood-donation/donor"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                    >
                      <Droplet size={20} />
                      Become a Donor
                    </Link>
                  </div>
              )}
            </motion.div>

            {/* Edit Modal */}
            <AnimatePresence>
              {donationEditModal && (
                  <Dialog
                      as={motion.div}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      open={donationEditModal}
                      onClose={() => setDonationEditModal(false)}
                      className="relative z-50"
                  >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                      <Dialog.Panel
                          as={motion.div}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
                      >
                        <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 text-white">
                          <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                            <Droplet />
                            Add Donation Record
                          </Dialog.Title>
                        </div>

                        <div className="p-6 space-y-4">
                          <div>
                            <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                              Patient Name *
                            </label>
                            <input
                                id="patientName"
                                type="text"
                                placeholder="Enter patient name"
                                value={donationInfo.patientName}
                                onChange={(e) => setDonationInfo({ ...donationInfo, patientName: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                            />
                          </div>

                          <div>
                            <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-700 mb-1">
                              Hospital Name *
                            </label>
                            <input
                                id="hospitalName"
                                type="text"
                                placeholder="Enter hospital name"
                                value={donationInfo.hospitalName}
                                onChange={(e) => setDonationInfo({ ...donationInfo, hospitalName: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                            />
                          </div>

                          <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                              Units Donated *
                            </label>
                            <input
                                id="quantity"
                                type="number"
                                min="1"
                                max="10"
                                placeholder="Enter units donated"
                                value={donationInfo.quantity}
                                onChange={(e) => setDonationInfo({ ...donationInfo, quantity: parseInt(e.target.value) || 1 })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                            />
                          </div>

                          <div>
                            <label htmlFor="lastDonation" className="block text-sm font-medium text-gray-700 mb-1">
                              Donation Date *
                            </label>
                            <input
                                id="lastDonation"
                                type="date"
                                value={donationInfo.lastDonation}
                                onChange={(e) => setDonationInfo({ ...donationInfo, lastDonation: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                            />
                          </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                          <button
                              onClick={() => setDonationEditModal(false)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                              onClick={handleDonationInfoUpdate}
                              disabled={saving || !donationInfo.patientName || !donationInfo.hospitalName}
                              className="px-6 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {saving ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Saving...
                                </>
                            ) : (
                                <>
                                  <CheckCircle size={16} />
                                  Save Record
                                </>
                            )}
                          </button>
                        </div>
                      </Dialog.Panel>
                    </div>
                  </Dialog>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
  );
}