import { useEffect, useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface UserProfile {
  id: number;
  fname: string;
  lname: string;
  role: string;
}

export function CreateDoctorArticlePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'MENTAL_HEALTH',
    media: ''
  });

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Updated categories based on DoctorArticleCategory enum
  const categories = [
    { value: 'MENTAL_HEALTH', label: 'Mental Health' },
    { value: 'PHYSICAL_HEALTH', label: 'Physical Health' },
    { value: 'PREVENTIVE_CARE', label: 'Preventive Care' },
    { value: 'NUTRITION', label: 'Nutrition' },
    { value: 'ALTERNATIVE_MEDICINE', label: 'Alternative Medicine' },
    { value: 'MEDICAL_RESEARCH', label: 'Medical Research' },
    { value: 'FITNESS', label: 'Fitness' }
  ];

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      const { data } = await api.get('/api/v1/user');

      if (data?.code === 'XS0001') {
        const userData = data.data;
        setUser({
          id: userData.id,
          fname: userData.fname,
          lname: userData.lname,
          role: userData.role
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to fetch user data');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const generateAvatarUrl = (firstName: string, lastName: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=random`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Please login first');
        navigate('/login');
        return;
      }

      // Create payload with doctorCategory instead of category
      const payload = {
        title: formData.title,
        content: formData.content,
        doctorCategory: formData.category, // Changed field name to match API requirements
        media: formData.media || null // Allow null for media
      };

      console.log('Submitting article:', payload);

      // Make sure authorization header is properly set
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Use the correct API endpoint for doctor articles
      const { data } = await api.post('/api/v1/doctor/articles/create', payload);

      if (data?.code === 'XS0001') {
        toast.success('Article published successfully!');
        navigate('/community/doctors');
      } else {
        toast.error(data?.message || 'Failed to create article');
      }
    } catch (error: any) {
      console.error('Error creating article:', error);
      console.error('Response data:', error.response?.data);
      toast.error(error?.response?.data?.message || 'Failed to publish article');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Top Bar */}
            <div className="flex items-center mb-8">
              <Link to="/community/doctors" className="flex items-center text-gray-600 hover:text-gray-800">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Articles
              </Link>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h1 className="text-2xl font-bold mb-6">Write a New Article</h1>

              {/* Doctor Info */}
              {user && (
                  <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-lg">
                    <img
                        src={generateAvatarUrl(user.fname, user.lname)}
                        alt="Doctor Avatar"
                        className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold">{user.fname} {user.lname}</h3>
                      <div className="flex items-center">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Doctor</span>
                      </div>
                    </div>
                  </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Article Title <span className="text-red-500">*</span>
                  </label>
                  <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter a descriptive title"
                      className="w-full p-3 bg-gray-50 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-gray-50 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                    ))}
                  </select>
                </div>

                {/* Media URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Image URL (optional)
                  </label>
                  <input
                      type="text"
                      name="media"
                      value={formData.media}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full p-3 bg-gray-50 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <Info size={12} className="mr-1" />
                    Enter the URL of an image to use as the article cover
                  </p>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      required
                      rows={12}
                      placeholder="Write your article content here... (Use double line breaks for paragraphs)"
                      className="w-full p-4 bg-gray-50 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <Info size={12} className="mr-1" />
                    Format tips: Use double line breaks for paragraphs. Use '• ' for bullet points, '1. ' for numbered lists.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <Link
                      to="/community/doctors"
                      className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-center"
                  >
                    Cancel
                  </Link>
                  <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                        <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Publishing...
                    </span>
                    ) : (
                        'Publish Article'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
  );
}
