import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Loader2, AlertCircle, Image } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/api';

interface FormData {
    title: string;
    content: string;
    doctorCategory: string;
    media: string | null;
}

export function DoctorArticleEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [formData, setFormData] = useState<FormData>({
        title: '',
        content: '',
        doctorCategory: 'MENTAL_HEALTH',
        media: null
    });

    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [initialLoading, setInitialLoading] = useState(isEditing);
    const [error, setError] = useState<string | null>(null);
    const [profileComplete, setProfileComplete] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDoctor, setIsDoctor] = useState(false);

    // Article categories
    const categories = [
        { value: 'MENTAL_HEALTH', label: 'Mental Health' },
        { value: 'PHYSICAL_HEALTH', label: 'Physical Health' },
        { value: 'PREVENTIVE_CARE', label: 'Preventive Care' },
        { value: 'NUTRITION', label: 'Nutrition' },
        { value: 'ALTERNATIVE_MEDICINE', label: 'Alternative Medicine' },
        { value: 'MEDICAL_RESEARCH', label: 'Medical Research' },
        { value: 'FITNESS', label: 'Fitness' }
    ];

    // Check user profile and fetch article data if editing
    useEffect(() => {
        checkUserProfile();

        if (isEditing) {
            fetchArticleData();
        }
    }, [id]);

    // Check if user profile is complete and is a doctor
    const checkUserProfile = async () => {
        try {
            const { data } = await api.get('/api/v1/user');
            console.log("User profile data:", data);

            if (data?.code === 'XS0001') {
                const userData = data.data;
                setIsDoctor(userData.role === 'DOCTOR');

                // If not a doctor, redirect to the articles page
                if (userData.role !== 'DOCTOR') {
                    toast.error('Only doctors can create or edit articles');
                    navigate('/community/doctors');
                    return;
                }

                // Profile is complete if email exists
                const isComplete = userData && userData.email;
                setProfileComplete(!!isComplete);

                if (!isComplete) {
                    setError('Please complete your profile to create articles');
                    toast.error('Please complete your profile to create articles');
                }
            } else {
                throw new Error(data?.message || 'Failed to fetch user profile');
            }
        } catch (err) {
            console.error('Failed to fetch user profile', err);
            setError('Unable to verify your profile. Please try again later.');
            setProfileComplete(false);

            // Redirect non-authenticated users
            navigate('/login');
        }
    };

    // Fetch article data if editing
    const fetchArticleData = async () => {
        try {
            setInitialLoading(true);
            const response = await api.get(`/api/v1/doctor/articles/${id}`);
            console.log("Fetched article data:", response.data);

            if (response.data?.code === 'XS0001') {
                const article = response.data.data;

                // Check if current user is the owner of the article
                const { data: userData } = await api.get('/api/v1/user');

                if (userData?.code === 'XS0001' && userData?.data?.id !== article.userId) {
                    toast.error('You do not have permission to edit this article');
                    navigate('/community/doctors');
                    return;
                }

                setFormData({
                    title: article.title || '',
                    content: article.content || '',
                    doctorCategory: article.doctorCategory || 'MENTAL_HEALTH',
                    media: article.media
                });

                if (article.media) {
                    setMediaPreview(article.media);
                }
            } else {
                toast.error(response.data?.message || 'Failed to fetch article data');
                navigate('/community/doctors');
            }
        } catch (error) {
            console.error('Error fetching article:', error);
            toast.error('Failed to fetch article data');
            navigate('/community/doctors');
        } finally {
            setInitialLoading(false);
        }
    };

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    // Handle media URL change
    const handleMediaUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setFormData(prevState => ({ ...prevState, media: url }));

        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            setMediaPreview(url);
        } else {
            setMediaPreview(null);
        }
    };

    // Remove media
    const removeMedia = () => {
        setMediaPreview(null);
        setFormData(prevState => ({ ...prevState, media: null }));
    };

    // Submit form
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Form submission started");

        if (!formData.title.trim() || !formData.content.trim() || !formData.doctorCategory) {
            console.log("Form validation failed:", formData);
            toast.error('Please fill in all required fields');
            return;
        }

        if (!profileComplete) {
            console.log("Profile not complete, cannot submit");
            toast.error('Please complete your profile to create articles');
            return;
        }

        try {
            setIsSubmitting(true);

            const articleData = {
                title: formData.title,
                content: formData.content,
                doctorCategory: formData.doctorCategory,
                media: formData.media || null
            };

            console.log("Submitting article data:", articleData);

            let response;

            if (isEditing) {
                // Update existing article
                console.log(`Updating article with ID: ${id}`);
                response = await api.put(`/api/v1/doctor/articles/${id}`, articleData);
            } else {
                // Create new article
                console.log("Creating new article");
                response = await api.post('/api/v1/doctor/articles/create', articleData);
            }

            console.log("API response:", response.data);

            if (response.data?.code === 'XS0001') {
                console.log("Article submission successful");
                toast.success(isEditing ? 'Article updated successfully!' : 'Article published successfully!');
                navigate('/community/doctors');
            } else {
                console.error("API returned error:", response.data);
                throw new Error(response.data?.message || 'Failed to submit article');
            }
        } catch (error: any) {
            console.error('Error submitting article:', error);
            if (error.response) {
                console.error('Response details:', error.response.data);
            }
            toast.error(error.response?.data?.message || 'Failed to submit article');
            setError('Failed to submit article. Please try again later.');
        } finally {
            setIsSubmitting(false);
            console.log("Form submission process completed");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <Link to="/community/doctors" className="flex items-center text-blue-500 mb-6">
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Articles
                </Link>

                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-6">
                            {isEditing ? 'Edit Article' : 'Write New Article'}
                        </h1>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="text-red-700">{error}</div>
                            </div>
                        )}

                        {initialLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 size={36} className="animate-spin text-blue-500" />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-6">
                                    {/* Title input */}
                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                            Article Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="title"
                                            name="title"
                                            placeholder="Enter article title"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            disabled={!profileComplete}
                                            required
                                        />
                                    </div>

                                    {/* Category select */}
                                    <div>
                                        <label htmlFor="doctorCategory" className="block text-sm font-medium text-gray-700 mb-1">
                                            Category <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="doctorCategory"
                                            name="doctorCategory"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.doctorCategory}
                                            onChange={handleInputChange}
                                            disabled={!profileComplete}
                                            required
                                        >
                                            {categories.map(category => (
                                                <option key={category.value} value={category.value}>
                                                    {category.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Media URL input */}
                                    <div>
                                        <label htmlFor="media" className="block text-sm font-medium text-gray-700 mb-1">
                                            Cover Image URL (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            id="media"
                                            name="media"
                                            placeholder="https://example.com/image.jpg"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.media || ''}
                                            onChange={handleMediaUrlChange}
                                            disabled={!profileComplete}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Enter a URL for an image to use as the article cover
                                        </p>
                                    </div>

                                    {/* Media Preview */}
                                    {mediaPreview && (
                                        <div className="relative rounded-lg overflow-hidden mb-2">
                                            <img
                                                src={mediaPreview}
                                                alt="Media preview"
                                                className="w-full h-64 object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.onerror = null;
                                                    target.src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL';
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={removeMedia}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                disabled={!profileComplete}
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Content textarea */}
                                    <div>
                                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                                            Content <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="content"
                                            name="content"
                                            placeholder="Write your article content..."
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                            rows={12}
                                            value={formData.content}
                                            onChange={handleInputChange}
                                            disabled={!profileComplete}
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Format tips: Use double line breaks for paragraphs. Use bullet points (•) for lists.
                                        </p>
                                    </div>

                                    {/* Form actions */}
                                    <div className="flex justify-end gap-4">
                                        <Link
                                            to="/community/doctors"
                                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </Link>
                                        <button
                                            type="submit"
                                            className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                                !profileComplete || isSubmitting
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                            }`}
                                            disabled={!profileComplete || isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    {isEditing ? 'Updating...' : 'Publishing...'}
                                                </>
                                            ) : (
                                                <>{isEditing ? 'Update Article' : 'Publish Article'}</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}