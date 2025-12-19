import { Link } from 'react-router-dom'
import BrainSketchLogo from './BrainSketchLogo'

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gh-bg-secondary text-white dark:text-gh-text border-t border-gray-800 dark:border-gh-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Link to="/" className="flex items-center space-x-2">
                <BrainSketchLogo size={26} />
              </Link>
              <span className="font-bold text-xl">taskThink</span>
            </div>
            <p className="text-gray-400 dark:text-gh-text-secondary mb-4">
              Platform untuk mengelola dan menampilkan portofolio dosen secara online. 
              Membangun sistem Terdistribusi. Scalable, dan Profesional.
            </p>
            <p className="text-sm text-gray-500 dark:text-gh-text-tertiary">
              © 2025 taskThink. Project Sistem Terdistribusi.
            </p>
          </div>

          {/* Tech Stack */}
          <div>
            <h3 className="font-semibold mb-4 text-white dark:text-gh-text">Tech Stack</h3>
            <ul className="space-y-2 text-gray-400 dark:text-gh-text-secondary text-sm">
              <li>React + Vite</li>
              <li>Node.js + Express</li>
              <li>PostgreSQL</li>
              <li>RabbitMQ</li>
              <li>MinIO</li>
              <li>Meilisearch</li>
              <li>Docker</li>
              <li>Nginx</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
