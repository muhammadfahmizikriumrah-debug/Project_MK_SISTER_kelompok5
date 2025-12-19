import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Save, X, Image as ImageIcon } from 'lucide-react'
import { portfolioApi } from '../utils/api'
import { useAuthStore } from '../stores/authStore'

export default function CreatePortfolioPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [isLoading, setIsLoading] = useState(false)
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  
  const { register, handleSubmit, formState: { errors } } = useForm()

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleThumbnailSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setThumbnailFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnailPreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      toast.error('Please select a valid image file')
    }
  }

  const removeThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview(null)
  }

  const uploadThumbnail = async (file) => {
    if (!file) return null
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', user?.id || user?.userId)
    
    try {
      const response = await portfolioApi.post('/api/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      if (response.data && response.data.success) {
        return response.data.data.url
      }
    } catch (error) {
      console.error('Image upload error:', error)
      toast.error('Failed to upload image')
    }
    return null
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      let thumbnailUrl = null
      
      // Upload thumbnail if selected
      if (thumbnailFile) {
        thumbnailUrl = await uploadThumbnail(thumbnailFile)
        if (!thumbnailUrl) {
          toast.error('Failed to upload thumbnail')
          setIsLoading(false)
          return
        }
      }

      const portfolioData = {
        title: data.title?.trim(),
        description: data.description?.trim() || '',
        repositoryUrl: data.repositoryUrl?.trim() || null,
        demoUrl: data.demoUrl?.trim() || null,
        tags: Array.isArray(tags) ? tags : [],
        isPublic: Boolean(data.isPublic),
        status: data.status || 'published',
        category: data.category || 'Other',
        thumbnail: thumbnailUrl
      }
      
      console.log('Submitting portfolio data:', portfolioData)
      const response = await portfolioApi.post('/api/portfolios', portfolioData)
      console.log('Portfolio creation response:', response.data)
      
      if (response.data && response.data.success) {
        toast.success('Portfolio created successfully!')
        window.location.href = '/portfolios'
      } else {
        throw new Error(response.data?.message || 'Failed to create portfolio')
      }
    } catch (error) {
      console.error('Portfolio creation error:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create portfolio'
      toast.error(errorMessage)
      
      if (error.response?.data?.errors) {
        const firstError = error.response.data.errors[0]
        if (firstError) {
          toast.error(`${firstError.field}: ${firstError.message}`)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="dashboard-batik">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gh-text">Create Portfolio</h1>
          <p className="text-gray-600 dark:text-gh-text-secondary mt-2">
            Add a new project to your portfolio
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Basic Information
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                {...register('title')}
                type="text"
                className="input"
                placeholder="Enter project title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="input"
                placeholder="Describe your project..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  {...register('category')}
                  className="input"
                >
                  <option value="">Select category</option>
                  <option value="Research">Research</option>
                  <option value="Teaching">Teaching</option>
                  <option value="Publication">Publication</option>
                  <option value="Project">Project</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="input"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Tags
          </h2>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="input flex-1"
                placeholder="Add tags (press Enter)"
              />
              <button
                type="button"
                onClick={addTag}
                className="btn btn-outline"
              >
                Add
              </button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full flex items-center space-x-2"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-primary-500 hover:text-primary-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Links */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Links & Resources
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Demo URL
              </label>
              <input
                {...register('demoUrl')}
                type="url"
                className="input"
                placeholder="https://demo.example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repository URL
              </label>
              <input
                {...register('repositoryUrl')}
                type="url"
                className="input"
                placeholder="https://github.com/username/repo"
              />
            </div>
          </div>
        </div>

        {/* Thumbnail Upload */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Portfolio Thumbnail
          </h2>
          
          {!thumbnailPreview ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('thumbnail-input').click()}
            >
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Click to select thumbnail image
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, GIF up to 10MB
              </p>
              <input
                id="thumbnail-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleThumbnailSelect(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <img 
                src={thumbnailPreview} 
                alt="Thumbnail preview" 
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeThumbnail}
                className="btn btn-outline w-full"
              >
                Change Thumbnail
              </button>
            </div>
          )}
        </div>


        {/* Visibility */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Visibility
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                {...register('isPublic')}
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Make this portfolio public
              </span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/portfolios')}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center space-x-2 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Creating...' : 'Create Portfolio'}</span>
          </button>
        </div>
        </form>
      </div>
    </div>
  )
}
