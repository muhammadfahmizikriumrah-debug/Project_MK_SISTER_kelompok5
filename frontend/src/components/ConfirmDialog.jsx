import { AlertCircle } from 'lucide-react'

export default function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Delete', 
  cancelText = 'Cancel',
  isDangerous = false,
  onConfirm, 
  onCancel 
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-start space-x-4 mb-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            isDangerous ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <AlertCircle className={`h-6 w-6 ${isDangerous ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
        </div>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex space-x-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
              isDangerous 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
