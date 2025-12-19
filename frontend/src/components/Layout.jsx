import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const html = document.documentElement
    if (isDark) {
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  return (
    <div className="min-h-screen bg-white dark:bg-gh-bg flex flex-col transition-colors duration-200">
      <Navbar isDark={isDark} setIsDark={setIsDark} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
