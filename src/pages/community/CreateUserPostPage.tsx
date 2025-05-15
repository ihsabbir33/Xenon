import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/api';

enum PostCategory {
  MEDICAL_TIPS = 'MEDICAL_TIPS',
  BLOOD_REQUEST = 'BLOOD_REQUEST',
  QUESTION = 'QUESTION',
  NEWS = 'NEWS',
  NEED_HELP = 'NEED_HELP',
  DOCTOR_ARTICLE = 'DOCTOR_ARTICLE'
}

export function CreateUserPostPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory | ''>('');
  const [media, setMedia] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkUserProfile();
  }, []);

  const checkUserProfile = async () => {
    try {
      const { data } = await api.get('/api/v1/user');
      // Check if profile is complete - verify required fields are present
      const isComplete = data?.data &&
          data.data.fname &&
          data.data.lname &&
          data.data.upazila;

      setProfileComplete(!!isComplete);

      if (!isComplete) {
        setError('Please complete your profile to create posts');
        toast.error('Please complete your profile to create posts');
      }
    } catch (err) {
      console.error('Failed to fetch user profile', err);
      setError('Unable to verify your profile. Please try again later.');
      setProfileComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should be less than 5MB');
        return;
      }

      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setMedia(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaFile(null);
  };

  const uploadMedia = async (): Promise<string | null> => {
    if (!mediaFile) return null;

    // Convert file to base64 string
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(mediaFile);
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileComplete) {
      toast.error('Please complete your profile to create posts');
      return;
    }

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    if (!category) {
      toast.error('Please select a category');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload media if present
      let mediaUrl = null;
      if (mediaFile) {
        mediaUrl = await uploadMedia();
      }

      const postData = {
        title: title.trim(),
        content: content.trim(),
        category,
        media: mediaUrl
      };

      const response = await api.post('/api/v1/blog/create', postData);

      if (response.data?.code === 'XS0001') {
        toast.success('Post created successfully!');
        navigate('/community/users');
      } else {
        toast.error(response.data?.message || 'Failed to create post');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.response?.data?.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (category: PostCategory): string => {
    const labels: Record<PostCategory, string> = {
      [PostCategory.MEDICAL_TIPS]: 'Medical Tips',
      [PostCategory.BLOOD_REQUEST]: 'Blood Request',
      [PostCategory.QUESTION]: 'Question',
      [PostCategory.NEWS]: 'News',
      [PostCategory.NEED_HELP]: 'Need Help',
      [PostCategory.DOCTOR_ARTICLE]: 'Doctor Article'
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <Loader2 size={36} className="animate-spin text-blue-500" />
        </div>
    );
  }

  if (!profileComplete && error) {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <Link to="/community/users" className="flex items-center text-blue-500 mb-6">
              <ArrowLeft size={20} className="mr-2" />
              Back to Community
            </Link>

            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8 text-center">
              <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Incomplete</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex justify-center gap-4">
                <Link
                    to="/settings"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Complete Profile
                </Link>
                <Link
                    to="/community/users"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Return to Community
                </Link>
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <Link to="/community/users" className="flex items-center text-blue-500 mb-6">
            <ArrowLeft size={20} className="mr-2" />
            Back to Community
          </Link>

          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Create a New Post</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                      type="text"
                      placeholder="Enter post title"
                      className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                      className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as PostCategory)}
                      required
                  >
                    <option value="">Select a category</option>
                    {Object.values(PostCategory).map(cat => (
                        <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                      placeholder="Write your post content here..."
                      className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                      rows={8}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Media (Optional)
                  </label>

                  {media ? (
                      <div className="relative">
                        <img
                            src={media}
                            alt="Preview"
                            className="w-full max-h-64 object-cover rounded-lg"
                        />
                        <button
                            type="button"
                            onClick={removeMedia}
                            className="absolute top-2 right-2 w-8 h-8 bg-gray-800 bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                  ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload size={36} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500 mb-2">Upload an image</p>
                        <label className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-block cursor-pointer">
                          <span>Choose File</span>
                          <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                          />
                        </label>
                        <p className="text-gray-400 text-sm mt-2">Maximum file size: 5MB</p>
                      </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end gap-4">
                <Link
                    to="/community/users"
                    className="px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </Link>
                <button
                    type="submit"
                    disabled={isSubmitting || !profileComplete}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Submitting...
                      </>
                  ) : (
                      'Create Post'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
}
