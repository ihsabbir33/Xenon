import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Clock,
  Pill,
  Star,
  ExternalLink,
  MapIcon,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check,
  PhoneCall,
  MessageSquare,
  Share2
} from 'lucide-react';
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

export function PharmacyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('about');

  useEffect(() => {
    if (id) {
      fetchPharmacyDetails(Number(id));
    }
  }, [id]);

  const fetchPharmacyDetails = async (pharmacyId: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/v1/pharmacy/${pharmacyId}`);
      if (response.data.code === 'XS0001') {
        setPharmacy(response.data.data);
      } else {
        setError('Failed to load pharmacy details');
      }
    } catch (err) {
      console.error('Error fetching pharmacy details:', err);
      setError('Failed to load pharmacy details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  if (loading) {
    return (
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
        </div>
    );
  }

  if (error || !pharmacy) {
    return (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pharmacy Not Found</h2>
            <p className="text-gray-600 mb-6">{error || "We couldn't find the pharmacy you're looking for."}</p>
            <button
                onClick={() => navigate('/medicine/pharmacies')}
                className="inline-flex items-center px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg"
            >
              <ArrowLeft className="mr-2 h-5 w-5" /> Back to Pharmacies
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Link to="/medicine/pharmacies" className="inline-flex items-center text-gray-600 hover:text-sky-600 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Pharmacies
            </Link>
          </div>

          {/* Pharmacy Header Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-100">
            <div className="h-48 bg-gradient-to-r from-red-500 to-sky-500 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-20"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Pill className="h-24 w-24 text-white" />
              </div>
              <div className="absolute bottom-4 right-4 bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium inline-flex items-center">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                Open Now
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-800">{pharmacy.pharmacyName}</h1>
                  <div className="space-y-3 text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{pharmacy.area}, {pharmacy.upazilaName}, {pharmacy.districtName}, {pharmacy.divisionName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={18} className="text-sky-500 flex-shrink-0" />
                      <span>{pharmacy.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={18} className="text-sky-500 flex-shrink-0" />
                      <span>{pharmacy.email || "Not available"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-sky-500 flex-shrink-0" />
                      <span>9:00 AM - 10:00 PM</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1 ml-1 mb-1">
                    <Star className="text-yellow-400 w-5 h-5" fill="currentColor" />
                    <Star className="text-yellow-400 w-5 h-5" fill="currentColor" />
                    <Star className="text-yellow-400 w-5 h-5" fill="currentColor" />
                    <Star className="text-yellow-400 w-5 h-5" fill="currentColor" />
                    <Star className="text-yellow-400 w-5 h-5 opacity-40" fill="currentColor" />
                    <span className="text-gray-600 ml-1 text-sm">4.0</span>
                  </div>
                  <div className="w-full md:w-auto p-2 bg-blue-50 rounded-md text-blue-800 text-sm text-center">
                    <span className="font-medium">License Verified ✓</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a
                    href={`tel:${pharmacy.phone}`}
                    className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <PhoneCall size={18} />
                  <span className="font-medium">Call</span>
                </a>
                <button className="flex items-center justify-center gap-2 py-3 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors">
                  <MessageSquare size={18} />
                  <span className="font-medium">Message</span>
                </button>
                <a
                    href={`https://www.google.com/maps/search/?api=1&query=${pharmacy.pharmacyName}+${pharmacy.area}+${pharmacy.upazilaName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <MapIcon size={18} />
                  <span className="font-medium">Directions</span>
                </a>
                <button className="flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <Share2 size={18} />
                  <span className="font-medium">Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Accordion Sections */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-100">
            {/* About Section - Header */}
            <div
                className="p-4 border-b border-gray-200 cursor-pointer flex justify-between items-center"
                onClick={() => toggleSection('about')}
            >
              <h2 className="text-xl font-semibold text-gray-800">About {pharmacy.pharmacyName}</h2>
              {expandedSection === 'about' ? (
                  <ChevronUp className="text-gray-500" size={20} />
              ) : (
                  <ChevronDown className="text-gray-500" size={20} />
              )}
            </div>

            {/* About Section - Content */}
            {expandedSection === 'about' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* About Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-1 h-5 bg-red-500 rounded mr-2"></span>
                        About {pharmacy.pharmacyName}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {pharmacy.pharmacyName} is a trusted pharmacy located in {pharmacy.upazilaName}, {pharmacy.districtName}.
                        We provide a wide range of medicines and healthcare products with professional service, ensuring customer satisfaction.
                        Our pharmacy is committed to providing quality healthcare products at affordable prices.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm">
                          <div className="w-32 text-gray-500">Established</div>
                          <div className="font-medium">2020</div>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-32 text-gray-500">Trade License</div>
                          <div className="font-medium">{pharmacy.tradeLicenseNumber ? "Verified" : "Contact pharmacy"}</div>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-32 text-gray-500">Area Covered</div>
                          <div className="font-medium">{pharmacy.upazilaName}, {pharmacy.districtName}</div>
                        </div>
                      </div>
                    </div>

                    {/* Opening Hours */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="w-1 h-5 bg-sky-500 rounded mr-2"></span>
                        Opening Hours
                      </h3>
                      <div className="space-y-2">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                            <div key={day} className="flex items-center justify-between py-2 border-b border-gray-100">
                              <span className="text-gray-600">{day}</span>
                              <span className={`font-medium ${day === "Friday" ? "text-red-500" : "text-gray-800"}`}>
                          {day === "Friday" ? "9:00 AM - 6:00 PM" : "9:00 AM - 10:00 PM"}
                        </span>
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
            )}

            {/* Services Section - Header */}
            <div
                className="p-4 border-b border-gray-200 cursor-pointer flex justify-between items-center"
                onClick={() => toggleSection('services')}
            >
              <h2 className="text-xl font-semibold text-gray-800">Services Offered</h2>
              {expandedSection === 'services' ? (
                  <ChevronUp className="text-gray-500" size={20} />
              ) : (
                  <ChevronDown className="text-gray-500" size={20} />
              )}
            </div>

            {/* Services Section - Content */}
            {expandedSection === 'services' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      "Home Delivery",
                      "Prescription Filling",
                      "Medicine Counseling",
                      "Health Checkups",
                      "Vaccination",
                      "Medical Supplies"
                    ].map((service) => (
                        <div key={service} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-sky-500 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-gray-700 font-medium">{service}</span>
                        </div>
                    ))}
                  </div>
                </div>
            )}

            {/* Location Section - Header */}
            <div
                className="p-4 border-b border-gray-200 cursor-pointer flex justify-between items-center"
                onClick={() => toggleSection('location')}
            >
              <h2 className="text-xl font-semibold text-gray-800">Location</h2>
              {expandedSection === 'location' ? (
                  <ChevronUp className="text-gray-500" size={20} />
              ) : (
                  <ChevronDown className="text-gray-500" size={20} />
              )}
            </div>

            {/* Location Section - Content */}
            {expandedSection === 'location' && (
                <div className="p-6">
                  <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 mb-3">Map is available on Google Maps</p>
                      <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${pharmacy.pharmacyName}, ${pharmacy.area}, ${pharmacy.upazilaName}, ${pharmacy.districtName}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-sky-500 text-white rounded-lg hover:from-red-600 hover:to-sky-600 transition-colors"
                      >
                        <ExternalLink size={14} className="mr-2" /> Open in Google Maps
                      </a>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">Address</h3>
                    <p className="text-gray-600">
                      {pharmacy.area}, {pharmacy.upazilaName}, {pharmacy.districtName}, {pharmacy.divisionName}
                    </p>
                    {pharmacy.latitude && pharmacy.longitude && (
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Latitude: {pharmacy.latitude}</p>
                          <p>Longitude: {pharmacy.longitude}</p>
                        </div>
                    )}
                  </div>
                </div>
            )}
          </div>

          {/* Contact Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-100">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact {pharmacy.pharmacyName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-red-500 to-sky-500 p-5 rounded-lg text-white">
                  <h3 className="text-lg font-medium mb-3">Need assistance?</h3>
                  <p className="mb-4 text-white/90">Contact our pharmacy for any inquiries or to order medications for delivery.</p>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Phone className="mr-2" size={18} />
                      <span>{pharmacy.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="mr-2" size={18} />
                      <span>{pharmacy.email || "Not available"}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Operating Hours</h3>
                  <p className="text-gray-600 mb-4">We're available to serve you during these hours:</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Weekdays</span>
                      <span>9:00 AM - 10:00 PM</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Friday</span>
                      <span>9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Weekends</span>
                      <span>9:00 AM - 10:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}