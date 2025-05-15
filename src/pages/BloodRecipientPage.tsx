import { useState } from 'react';
import { ArrowLeft, Heart, MapPin, Phone, Calendar, User, AlertCircle, Clock, Droplet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useLocationStore } from '../stores/areaLocationStore';

export function BloodRecipientPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const locationStore = useLocationStore();

  // Location Selection States
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedUpazila, setSelectedUpazila] = useState('');

  const [formData, setFormData] = useState({
    patientName: '',
    bloodGroup: '',
    units: '',
    hospital: '',
    requiredDate: '',
    contactPerson: '',
    phone: '',
    reason: '',
    urgencyLevel: 'normal'
  });

  const bloodGroups = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  const bloodGroupMap: { [key: string]: string } = {
    'A+': 'A_POS',
    'A-': 'A_NEG',
    'B+': 'B_POS',
    'B-': 'B_NEG',
    'AB+': 'AB_POS',
    'AB-': 'AB_NEG',
    'O+': 'O_POS',
    'O-': 'O_NEG',
  };

  const urgencyLevels = [
    { value: 'normal', label: 'Normal', color: 'bg-green-500' },
    { value: 'urgent', label: 'Urgent', color: 'bg-orange-500' },
    { value: 'emergency', label: 'Emergency', color: 'bg-red-500' }
  ];

  // Get location data
  const divisions = locationStore.divisions;
  const districts = selectedDivision ? locationStore.getDistrictsByDivision(parseInt(selectedDivision)) : [];
  const upazilas = selectedDistrict ? locationStore.getUpazilasByDistrict(parseInt(selectedDistrict)) : [];

  const handleDivisionChange = (divisionId: string) => {
    setSelectedDivision(divisionId);
    setSelectedDistrict('');
    setSelectedUpazila('');
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedUpazila('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bloodGroup) {
      toast.error('Please select a blood group!');
      return;
    }

    if (!selectedUpazila) {
      toast.error('Please select your location!');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        patientName: formData.patientName,
        bloodType: bloodGroupMap[formData.bloodGroup],
        quantity: parseInt(formData.units),
        hospitalName: formData.hospital,
        contactNumber: formData.phone,
        description: formData.reason,
        date: formData.requiredDate,
        urgencyLevel: formData.urgencyLevel.toUpperCase(),
        upazilaId: parseInt(selectedUpazila),
      };

      const { data: baseResponse } = await api.post('/api/v1/blood/create-request', payload);

      if (baseResponse.code === 'XS0001') {
        toast.success('Blood request created successfully! 🎉', { duration: 2500 });
        setTimeout(() => navigate('/blood-donation/recipient/confirmation', { state: { formData } }), 2500);
      } else {
        toast.error(baseResponse.message || 'Failed to create request.');
      }
    } catch (error: any) {
      console.error('Request creation error:', error);
      toast.error(error.response?.data?.message || 'Something went wrong!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-40 right-10 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-40 left-1/2 w-32 h-32 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative container mx-auto px-4 py-8">
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

          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-rose-600 rounded-2xl mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-2">
                Request Blood
              </h1>
              <p className="text-gray-600">Fill in the details below to request blood donation</p>
            </motion.div>

            {/* Form */}
            <motion.form
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                {/* Emergency Level Selector */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {urgencyLevels.map((level) => (
                        <motion.button
                            key={level.value}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setFormData({ ...formData, urgencyLevel: level.value })}
                            className={`relative p-3 rounded-xl border-2 transition-all duration-300 ${
                                formData.urgencyLevel === level.value
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${level.color}`}></div>
                            <span className={`font-medium ${
                                formData.urgencyLevel === level.value ? 'text-red-600' : 'text-gray-700'
                            }`}>
                          {level.label}
                        </span>
                          </div>
                        </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Patient Name */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        required
                        placeholder="Enter patient's full name"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        value={formData.patientName}
                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    />
                  </div>
                </motion.div>

                {/* Blood Group and Units */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Group <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Droplet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <select
                          required
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none transition-all"
                          value={formData.bloodGroup}
                          onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      >
                        <option value="">Select blood group</option>
                        {bloodGroups.map(group => (
                            <option key={group.value} value={group.value}>{group.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Units Required <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        required
                        min="1"
                        max="10"
                        placeholder="Number of units"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        value={formData.units}
                        onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                    />
                  </div>
                </motion.div>

                {/* Location Selection */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <MapPin className="text-red-500" size={20} />
                    Location Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Division <span className="text-red-500">*</span>
                      </label>
                      <select
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                          value={selectedDivision}
                          onChange={(e) => handleDivisionChange(e.target.value)}
                      >
                        <option value="">Select Division</option>
                        {divisions.map(division => (
                            <option key={division.id} value={division.id}>{division.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        District <span className="text-red-500">*</span>
                      </label>
                      <select
                          required
                          disabled={!selectedDivision}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all disabled:opacity-50"
                          value={selectedDistrict}
                          onChange={(e) => handleDistrictChange(e.target.value)}
                      >
                        <option value="">Select District</option>
                        {districts.map(district => (
                            <option key={district.id} value={district.id}>{district.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upazila <span className="text-red-500">*</span>
                      </label>
                      <select
                          required
                          disabled={!selectedDistrict}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all disabled:opacity-50"
                          value={selectedUpazila}
                          onChange={(e) => setSelectedUpazila(e.target.value)}
                      >
                        <option value="">Select Upazila</option>
                        {upazilas.map(upazila => (
                            <option key={upazila.id} value={upazila.id}>{upazila.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>

                {/* Hospital Name */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        required
                        placeholder="Enter hospital name"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        value={formData.hospital}
                        onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                    />
                  </div>
                </motion.div>

                {/* Required Date */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        value={formData.requiredDate}
                        onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                    />
                  </div>
                </motion.div>

                {/* Phone Number */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="tel"
                        required
                        placeholder="Enter contact number"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </motion.div>

                {/* Reason */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Blood Requirement <span className="text-red-500">*</span>
                  </label>
                  <textarea
                      required
                      rows={3}
                      placeholder="Provide details about why blood is needed"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </motion.div>
              </div>

              {/* Submit Button */}
              <motion.div
                  variants={itemVariants}
                  className="bg-gradient-to-r from-red-50 to-rose-50 p-6 border-t border-red-100"
              >
                <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting Request...
                      </>
                  ) : (
                      <>
                        <Heart className="w-5 h-5" />
                        Submit Blood Request
                      </>
                  )}
                </motion.button>
                <p className="text-center text-sm text-gray-600 mt-4">
                  <AlertCircle className="inline-block w-4 h-4 mr-1" />
                  Your request will be shared with nearby donors immediately
                </p>
              </motion.div>
            </motion.form>
          </div>
        </div>
      </div>
  );
}