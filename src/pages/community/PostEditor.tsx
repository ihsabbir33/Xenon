// PostEditor.tsx
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Loader2, AlertCircle, Image, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/api';

interface FormData {
    title: string;
    content: string;
    category: string;
    media: string | null;
}

interface Category {
    value: string;
    label: string;
}

export function PostEditor(): JSX.Element {  // Add explicit return type here
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [formData, setFormData] = useState<FormData>({
        title: '',
        content: '',
        category: '',
        media: null
    });

    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [initialLoading, setInitialLoading] = useState(isEditing);
    const [error, setError] = useState<string | null>(null);
    const [profileComplete, setProfileComplete] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Post categories
    const categories: Category[] = [
        { value: 'MEDICAL_TIPS', label: 'Medical Tips' },
        { value: 'BLOOD_REQUEST', label: 'Blood Request' },
        { value: 'QUESTION', label: 'Question' },
        { value: 'NEWS', label: 'News' },
        { value: 'NEED_HELP', label: 'Need Help' },
    ];

    // Check user profile and fetch post data if editing
    useEffect(() => {
        checkUserProfile();

        if (isEditing) {
            fetchPostData();
        }
    }, [id]);

    // Check if user profile is complete
    const checkUserProfile = async () => {
        try {
            const { data } = await api.get('/api/v1/user');
            console.log("User profile data:", data);

            // Profile is complete if email exists
            if (data?.code === 'XS0001') {
                const isComplete = data?.data && data.data.email;
                setProfileComplete(!!isComplete);

                if (!isComplete) {
                    setError('Please complete your profile to create posts');
                    toast.error('Please complete your profile to create posts');
                }
            } else {
                throw new Error(data?.message || 'Failed to fetch user profile');
            }
        } catch (err) {
            console.error('Failed to fetch user profile', err);
            setError('Unable to verify your profile. Please try again later.');
            setProfileComplete(false);
        }
    };

    // Update this function in PostEditor.tsx
    const fetchPostData = async () => {
        try {
            setInitialLoading(true);
            const response = await api.get(`/api/v1/blog/${id}`);
            console.log("Fetched post data:", response.data);

            if (response.data?.code === 'XS0001') {
                const post = response.data.data;

                // Check if current user is the owner of the post
                const { data: userData } = await api.get('/api/v1/user');

                if (userData?.code === 'XS0001' && userData?.data?.id !== post.userId) {
                    toast.error('You do not have permission to edit this post');
                    navigate('/community/users');
                    return;
                }

                setFormData({
                    title: post.title,
                    content: post.content,
                    category: post.category,
                    media: post.media
                });

                if (post.media) {
                    setMediaPreview(post.media);
                }
            } else {
                toast.error(response.data?.message || 'Failed to fetch post data');
                navigate('/community/users');
            }
        } catch (error) {
            console.error('Error fetching post:', error);
            toast.error('Failed to fetch post data');
            navigate('/community/users');
        } finally {
            setInitialLoading(false);
        }
    };

    // Handle input changes
    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    // Handle file upload
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('File size should be less than 5MB');
            return;
        }

        setMediaFile(file);

        // Preview the selected image
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setMediaPreview(e.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    // Remove media
    const removeMedia = () => {
        setMediaPreview(null);
        setMediaFile(null);
        setFormData(prevState => ({ ...prevState, media: null }));
    };

    // Upload media
    const uploadMedia = async (): Promise<string | null> => {
        if (!mediaFile && !mediaPreview) return null;

        // If we're editing and the media hasn't changed, just return the existing URL
        if (isEditing && !mediaFile && mediaPreview === formData.media) {
            return formData.media;
        }

        if (mediaFile) {
            try {
                // Convert file to base64 string for API
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(mediaFile);
                    reader.onload = () => {
                        if (reader.result) {
                            resolve(reader.result as string);
                        } else {
                            reject(new Error("Failed to read file"));
                        }
                    };
                    reader.onerror = (error) => {
                        reject(error);
                    };
                });
            } catch (error) {
                console.error("Error converting media file:", error);
                throw error;
            }
        }

        return null;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Form submission started");

        if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
            console.log("Form validation failed:", formData);
            toast.error('Please fill in all required fields');
            return;
        }

        if (!profileComplete) {
            console.log("Profile not complete, cannot submit");
            toast.error('Please complete your profile to create posts');
            return;
        }

        try {
            setIsSubmitting(true);
            console.log("Preparing to upload media");

            // Get media base64 if available
            const mediaBase64 = await uploadMedia();
            console.log("Media upload completed:", mediaBase64 ? "Has media" : "No media");

            const postData = {
                title: formData.title,
                content: formData.content,
                category: formData.category,
                media: mediaBase64
            };

            console.log("Submitting post data:", { ...postData, media: mediaBase64 ? "data present" : null });

            let response;

            if (isEditing) {
                // Update existing post
                console.log(`Updating post with ID: ${id}`);
                response = await api.put(`/api/v1/blog/${id}`, postData);
            } else {
                // Create new post
                console.log("Creating new post");
                response = await api.post('/api/v1/blog/create', postData);
            }

            console.log("API response:", response.data);

            if (response.data?.code === 'XS0001') {
                console.log("Post submission successful");
                toast.success(isEditing ? 'Post updated successfully!' : 'Post created successfully!');
                navigate('/community/users');
            } else {
                console.error("API returned error:", response.data);
                throw new Error(response.data?.message || 'Failed to submit post');
            }
        } catch (error: any) {
            console.error('Error submitting post:', error);
            if (error.response) {
                console.error('Response details:', error.response.data);
            }
            toast.error(error.response?.data?.message || 'Failed to submit post');
            setError('Failed to submit post. Please try again later.');
        } finally {
            setIsSubmitting(false);
            console.log("Form submission process completed");
        }
    };
    // Return JSX
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <Link to="/community/users" className="flex items-center text-blue-500 mb-6">
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Community
                </Link>

                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-6">
                            {isEditing ? 'Edit Post' : 'Create New Post'}
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
                                            Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="title"
                                            name="title"
                                            placeholder="Enter post title"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            disabled={!profileComplete}
                                            required
                                        />
                                    </div>

                                    {/* Category select */}
                                    <div>
                                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                            Category <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="category"
                                            name="category"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            disabled={!profileComplete}
                                            required
                                        >
                                            <option value="">Select a category</option>
                                            {categories.map(category => (
                                                <option key={category.value} value={category.value}>
                                                    {category.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Content textarea */}
                                    <div>
                                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                                            Content <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="content"
                                            name="content"
                                            placeholder="Write your post content..."
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                            rows={8}
                                            value={formData.content}
                                            onChange={handleInputChange}
                                            disabled={!profileComplete}
                                            required
                                        />
                                    </div>

                                    {/* Media upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Media (Optional)
                                        </label>

                                        {mediaPreview ? (
                                            <div className="relative rounded-lg overflow-hidden mb-2">
                                                <img
                                                    src={mediaPreview}
                                                    alt="Media preview"
                                                    className="w-full h-64 object-cover"
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
                                        ) : (
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                                <div className="flex flex-col items-center">
                                                    <Image size={36} className="text-gray-400 mb-2" />
                                                    <p className="text-gray-600 mb-4">Upload an image (max 5MB)</p>
                                                    <label
                                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                                            !profileComplete
                                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                                                        }`}
                                                    >
                                                        <Upload size={18} />
                                                        Browse File
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleFileChange}
                                                            disabled={!profileComplete}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Form actions */}
                                    <div className="flex justify-end gap-4">
                                        <Link
                                            to="/community/users"
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
                                                <>{isEditing ? 'Update Post' : 'Publish Post'}</>
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