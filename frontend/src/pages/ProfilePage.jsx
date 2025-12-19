import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Globe, Save, Image as ImageIcon } from 'lucide-react'
import { userApi } from '../utils/api'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
      website: user?.website || '',
      location: user?.location || '',
      university: user?.university || '',
      department: user?.department || '',
      position: user?.position || ''
    }
  })

  useEffect(() => {
    // Update form when user data changes
    reset({
      fullName: user?.fullName || '',
      email: user?.email || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
      website: user?.website || '',
      location: user?.location || '',
      university: user?.university || '',
      department: user?.department || '',
      position: user?.position || ''
    })
    setAvatarPreview(user?.avatar || null)
    setAvatarFile(null)
    setAvatarRemoved(false)
  }, [user, reset])

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      event.target.value = ''
      return
    }

    setAvatarFile(file)
    setAvatarRemoved(false)

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)

    event.target.value = ''
  }

  const handleAvatarRemove = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarRemoved(true)
  }

  const uploadAvatar = async (file) => {
    if (!user?.id) {
      toast.error('User ID not found')
      return null
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', user.id)

    try {
      const response = await userApi.post('/api/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data?.success) {
        const mediaData = response.data.data
        return mediaData?.thumbnailUrl || mediaData?.url
      }

      toast.error('Failed to upload profile photo')
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload profile photo')
    }

    return null
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      if (!user || !user.id) {
        toast.error('User ID not found')
        setIsLoading(false)
        return
      }

      // Split fullName into firstName and lastName
      const nameParts = data.fullName.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || ''

      let avatarUrl = user?.avatar || null

      if (avatarRemoved) {
        avatarUrl = null
      } else if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile)
        if (!avatarUrl) {
          return
        }
      }

      const updateData = {
        firstName,
        lastName,
        bio: data.bio,
        phone: data.phone,
        website: data.website,
        location: data.location,
        university: data.university,
        department: data.department,
        position: data.position,
        email: user.email,
        username: user.username,
        avatar: avatarUrl
      }

      console.log('Updating user:', user.id, updateData)
      const response = await userApi.put(`/api/users/${user.id}`, updateData)
      
      if (response.data && response.data.success) {
        // Update auth store with new user data
        updateUser({
          ...user,
          fullName: data.fullName,
          bio: data.bio,
          phone: data.phone,
          website: data.website,
          location: data.location,
          university: data.university,
          department: data.department,
          position: data.position,
          avatar: avatarUrl
        })
        
        toast.success('Profile updated successfully!')
      } else {
        toast.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="dashboard-batik">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gh-text">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gh-text-secondary mt-2">
            Manage your profile information and preferences
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Basic Information
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 mb-6">
            <div>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile preview"
                  className="h-20 w-20 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                  <User className="h-10 w-10" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="avatar-upload"
                  className="btn btn-secondary flex items-center space-x-2 cursor-pointer"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>Upload Photo</span>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    className="btn btn-ghost text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Gunakan gambar JPG, PNG, atau GIF maksimal 10MB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                {...register('fullName', { required: 'Full name is required' })}
                type="text"
                className="input"
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className="input"
                disabled
                placeholder="Email address"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                {...register('bio')}
                rows={4}
                className="input"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Contact Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="input"
                placeholder="Phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                {...register('website')}
                type="url"
                className="input"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                {...register('location')}
                type="text"
                className="input"
                placeholder="City, Country"
              />
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Academic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                University
              </label>
              <input
                {...register('university')}
                type="text"
                className="input"
                placeholder="University name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <input
                {...register('department')}
                type="text"
                className="input"
                placeholder="Department name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <input
                {...register('position')}
                type="text"
                className="input"
                placeholder="e.g., Professor, Lecturer"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
        </form>
      </div>
    </div>
  )
}
