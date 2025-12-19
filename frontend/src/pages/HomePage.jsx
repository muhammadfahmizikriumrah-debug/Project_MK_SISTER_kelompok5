import { Link } from 'react-router-dom'
import { Search, Users, Award, Zap } from 'lucide-react'
import { useQuery } from 'react-query'
import { portfolioApi } from '../utils/api'

export default function HomePage() {
  // Fetch featured portfolios
  const { data: featuredPortfolios } = useQuery(
    'featuredPortfolios',
    async () => {
      const response = await portfolioApi.get('/api/portfolios?featured=true&limit=6')
      return response.data.data.portfolios
    },
    { staleTime: 5 * 60 * 1000 } // 5 minutes
  )

  const techLogos = [
    {
      name: 'React',
      icon: (
        <svg viewBox="0 0 64 64" aria-hidden="true" className="w-10 h-10">
          <circle cx="32" cy="32" r="6" fill="#61DAFB" />
          <ellipse cx="32" cy="32" rx="20" ry="8.5" stroke="#61DAFB" strokeWidth="4" fill="none" />
          <ellipse cx="32" cy="32" rx="20" ry="8.5" stroke="#61DAFB" strokeWidth="4" fill="none" transform="rotate(60 32 32)" />
          <ellipse cx="32" cy="32" rx="20" ry="8.5" stroke="#61DAFB" strokeWidth="4" fill="none" transform="rotate(-60 32 32)" />
        </svg>
      ),
      bg: 'from-[#153145] to-[#102A3B] border-cyan-400/30'
    },
    {
      name: 'Node.js',
      icon: (
        <svg viewBox="0 0 64 64" aria-hidden="true" className="w-10 h-10">
          <polygon points="32,6 54,18 54,46 32,58 10,46 10,18" fill="#3C873A" />
          <path d="M34 20l-6 3.5v7l-4 2.3v4.6l10-5.8v-7l4-2.3V17z" fill="#F2FBEA" opacity="0.85" />
        </svg>
      ),
      bg: 'from-[#1E3A2A] to-[#173020] border-emerald-400/30'
    },
    {
      name: 'PostgreSQL',
      icon: (
        <svg viewBox="0 0 64 64" aria-hidden="true" className="w-10 h-10">
          <ellipse cx="32" cy="20" rx="18" ry="10" fill="#336791" />
          <path d="M14 22c0 6 8 11 18 11s18-5 18-11v20c0 6-8 11-18 11s-18-5-18-11V22z" fill="#2c568f" />
          <ellipse cx="32" cy="22" rx="18" ry="10" fill="#3D74A6" />
        </svg>
      ),
      bg: 'from-[#15253A] to-[#111D30] border-blue-400/30'
    },
    {
      name: 'Docker',
      icon: (
        <svg viewBox="0 0 64 64" aria-hidden="true" className="w-10 h-10">
          <rect x="14" y="28" width="10" height="10" fill="#0DB7ED" />
          <rect x="26" y="28" width="10" height="10" fill="#0DB7ED" />
          <rect x="38" y="28" width="10" height="10" fill="#0DB7ED" />
          <path d="M12 40h40c0 8-7 14-18 14S12 48 12 40z" fill="#0A8ACB" />
          <path d="M46 24c4 0 6 3 6 6-3.5-1.2-6 0-6 0V24z" fill="#0DB7ED" />
        </svg>
      ),
      bg: 'from-[#0B3045] to-[#082638] border-sky-400/30'
    },
    {
      name: 'RabbitMQ',
      icon: (
        <svg viewBox="0 0 64 64" aria-hidden="true" className="w-10 h-10">
          <rect x="10" y="18" width="18" height="28" fill="#FF6600" />
          <rect x="36" y="28" width="18" height="18" fill="#FF6600" />
          <circle cx="45" cy="38" r="4" fill="#FFF2E6" />
        </svg>
      ),
      bg: 'from-[#4A240C] to-[#3A1C08] border-orange-400/30'
    },
    {
      name: 'MinIO',
      icon: (
        <svg viewBox="0 0 64 64" aria-hidden="true" className="w-10 h-10">
          <path d="M12 46L32 18l20 28H12z" fill="#C72D6B" />
          <path d="M22 46l10-14 10 14H22z" fill="#F6D0E0" opacity="0.8" />
        </svg>
      ),
      bg: 'from-[#3C152A] to-[#301122] border-rose-400/30'
    },
    {
      name: 'Meilisearch',
      icon: (
        <svg viewBox="0 0 64 64" aria-hidden="true" className="w-10 h-10">
          <circle cx="28" cy="28" r="16" fill="#FFBD2B" />
          <path d="M38 38l12 12" stroke="#D98A00" strokeWidth="6" strokeLinecap="round" />
          <circle cx="28" cy="28" r="6" fill="#D98A00" />
        </svg>
      ),
      bg: 'from-[#3B2A12] to-[#2F210D] border-amber-400/30'
    },
    {
      name: 'Nginx',
      icon: (
        <svg viewBox="0 0 64 64" aria-hidden="true" className="w-10 h-10">
          <polygon points="32,8 56,20 56,44 32,56 8,44 8,20" fill="#009639" />
          <path d="M24 42V22l16 20V22" stroke="#D6F8E8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      bg: 'from-[#123221] to-[#0C2618] border-emerald-400/30'
    }
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-batik border-b border-blue-900/20 dark:border-gh-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-28">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-sm uppercase tracking-[0.3em] text-blue-100">
              Platform Portofolio Dosen
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              taskThink
            </h1>
            <div className="flex w-full max-w-xs flex-col gap-4">
              <Link
                to="/register"
                className="bg-white text-primary-700 dark:text-gh-bg px-8 py-3 rounded-lg font-semibold shadow-lg shadow-blue-900/30 hover:bg-blue-50 dark:hover:bg-white/90 transition-colors"
              >
                Mulai Sekarang
              </Link>
              <Link
                to="/search"
                className="border-2 border-white/70 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Jelajahi
              </Link>
            </div>
            <p className="text-lg md:text-2xl text-blue-100/90 md:leading-relaxed">
              taskThink adalah platform untuk mengelola dan menampilkan portofolio akademik. Dibangun dengan arsitektur sistem Terdistribusi. Scalable, dan Profesional.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gh-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gh-text mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-xl text-gray-600 dark:text-gh-text-secondary max-w-2xl mx-auto">
              Sistem terdistribusi dengan teknologi modern untuk pengalaman terbaik
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-gh-info-light/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-200 dark:border-gh-info/50">
                <Users className="h-8 w-8 text-primary-600 dark:text-gh-info" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Manajemen Profil</h3>
              <p className="text-gray-600">
                Kelola profil akademik lengkap dengan informasi pendidikan dan pengalaman
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-gh-success-light/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-200 dark:border-gh-success/50">
                <Award className="h-8 w-8 text-primary-600 dark:text-gh-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Portfolio CRUD</h3>
              <p className="text-gray-600">
                Buat, edit, dan kelola portofolio proyek dengan mudah dan intuitif
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-gh-purple-light/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-200 dark:border-gh-purple/50">
                <Search className="h-8 w-8 text-primary-600 dark:text-gh-purple" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pencarian Cerdas</h3>
              <p className="text-gray-600">
                Temukan portofolio dengan pencarian full-text menggunakan Meilisearch
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-gh-pink-light/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-200 dark:border-gh-pink/50">
                <Zap className="h-8 w-8 text-primary-600 dark:text-gh-pink" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Performa Tinggi</h3>
              <p className="text-gray-600">
                Sistem terdistribusi dengan caching Redis dan async processing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Portfolios */}
      {featuredPortfolios && featuredPortfolios.length > 0 && (
        <section className="py-20 bg-gray-50 dark:bg-gh-bg-secondary border-b border-gray-200 dark:border-gh-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gh-text mb-4">
                Portofolio Unggulan
              </h2>
              <p className="text-xl text-gray-600 dark:text-gh-text-secondary">
                Temukan karya-karya terbaik dari para dosen
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPortfolios.map((portfolio) => (
                <div key={portfolio.id} className="card p-6 hover:shadow-lg dark:hover:shadow-lg dark:shadow-black/30 transition-shadow hover:border-primary-300 dark:hover:border-gh-accent">
                  {portfolio.thumbnail && (
                    <img
                      src={portfolio.thumbnail}
                      alt={portfolio.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gh-text">{portfolio.title}</h3>
                  <p className="text-gray-600 dark:text-gh-text-secondary mb-4 line-clamp-3">
                    {portfolio.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {portfolio.tags?.slice(0, 3).map((tag, idx) => {
                      const colors = [
                        'bg-primary-100 dark:bg-gh-info-light/20 text-primary-700 dark:text-gh-info border-primary-200 dark:border-gh-info/50',
                        'bg-green-100 dark:bg-gh-success-light/20 text-green-700 dark:text-gh-success border-green-200 dark:border-gh-success/50',
                        'bg-purple-100 dark:bg-gh-purple-light/20 text-purple-700 dark:text-gh-purple border-purple-200 dark:border-gh-purple/50',
                      ]
                      return (
                        <span
                          key={tag}
                          className={`px-2 py-1 text-sm rounded border ${colors[idx % colors.length]}`}
                        >
                          {tag}
                        </span>
                      )
                    })}
                  </div>
                  <Link
                    to={`/portfolio/${portfolio.id}`}
                    className="text-primary-600 dark:text-gh-accent hover:text-primary-700 dark:hover:text-gh-accent-hover font-medium transition-colors"
                  >
                    Lihat Detail →
                  </Link>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                to="/search"
                className="btn btn-primary"
              >
                Lihat Semua Portofolio
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Tech Stack Section */}
      <section className="py-20 bg-white dark:bg-gh-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gh-text mb-4">
              Teknologi
            </h2>
            <p className="text-xl text-gray-600 dark:text-gh-text-secondary">
              Dibangun dengan arsitektur microservices dan teknologi terdepan
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {techLogos.map((tech) => (
              <div key={tech.name} className="relative flex flex-col items-center gap-3">
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl border bg-gradient-to-br ${tech.bg} flex items-center justify-center shadow-lg shadow-black/10 dark:shadow-black/30 transition-transform hover:-translate-y-1`}
                >
                  {tech.icon}
                  <span className="sr-only">{tech.name}</span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gh-text-secondary tracking-wide uppercase">
                  {tech.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
