import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Home, Users, LogOut, Map, BookOpen, Moon, Sun, Monitor, Settings, ChevronDown, Palette, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const THEME_COLORS = [
  { id: 'default', name: 'Default', primary: '#171717', accent: '#525252' },
  { id: 'cyan', name: 'Cyan', primary: '#0891b2', accent: '#06b6d4' },
  { id: 'teal', name: 'Teal', primary: '#0d9488', accent: '#14b8a6' },
  { id: 'amber', name: 'Warm', primary: '#b45309', accent: '#d97706' },
  { id: 'rose', name: 'Rose', primary: '#be123c', accent: '#e11d48' },
  { id: 'violet', name: 'Violet', primary: '#7c3aed', accent: '#8b5cf6' },
]

const APPEARANCE_MODES = [
  { id: 'light', name: 'Light', icon: Sun },
  { id: 'dark', name: 'Dark', icon: Moon },
  { id: 'system', name: 'System', icon: Monitor },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showThemeSubmenu, setShowThemeSubmenu] = useState(false)
  const profileMenuRef = useRef(null)
  
  const [appearanceMode, setAppearanceMode] = useState(() => {
    return localStorage.getItem('appearanceMode') || 'system'
  })
  
  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('themeColor') || 'default'
  })

  // Handle appearance mode changes
  useEffect(() => {
    const applyDarkMode = (isDark) => {
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    if (appearanceMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      applyDarkMode(mediaQuery.matches)
      
      const handler = (e) => applyDarkMode(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      applyDarkMode(appearanceMode === 'dark')
    }
    
    localStorage.setItem('appearanceMode', appearanceMode)
  }, [appearanceMode])

  // Handle theme color changes
  useEffect(() => {
    const theme = THEME_COLORS.find(t => t.id === themeColor) || THEME_COLORS[0]
    document.documentElement.style.setProperty('--theme-primary', theme.primary)
    document.documentElement.style.setProperty('--theme-accent', theme.accent)
    localStorage.setItem('themeColor', themeColor)
  }, [themeColor])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
        setShowThemeSubmenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setShowProfileMenu(false)
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/activity', icon: Users, label: 'Community' },
    { to: '/', icon: Home, label: 'Today' },
    { to: '/skills', icon: BookOpen, label: 'My Skills' },
    { to: '/roadmap', icon: Map, label: 'Roadmap' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Persisto" className="w-8 h-8 rounded-lg object-cover" />
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white">Persisto</h1>
          </div>
          
          {/* Profile Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button 
              onClick={() => {
                setShowProfileMenu(!showProfileMenu)
                setShowThemeSubmenu(false)
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{user?.name?.charAt(0)}</span>
                </div>
              )}
              <span className="text-sm text-neutral-600 dark:text-neutral-300 hidden sm:inline">{user?.name}</span>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-700 overflow-hidden z-50"
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
                    <p className="font-medium text-neutral-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user?.email}</p>
                  </div>

                  {/* Settings */}
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      navigate('/settings')
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-neutral-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-left"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>

                  {/* Themes */}
                  <div className="relative">
                    <button
                      onClick={() => setShowThemeSubmenu(!showThemeSubmenu)}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-neutral-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Palette className="w-4 h-4" />
                        <span className="text-sm">Themes</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showThemeSubmenu ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showThemeSubmenu && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-gray-50 dark:bg-neutral-800/50 overflow-hidden"
                        >
                          {/* Color Themes */}
                          <div className="px-4 py-2">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Color</p>
                            <div className="flex flex-wrap gap-2">
                              {THEME_COLORS.map((theme) => (
                                <button
                                  key={theme.id}
                                  onClick={() => setThemeColor(theme.id)}
                                  title={theme.name}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                                    themeColor === theme.id ? 'ring-2 ring-offset-2 ring-neutral-400 dark:ring-neutral-500 dark:ring-offset-neutral-900' : ''
                                  }`}
                                  style={{ backgroundColor: theme.primary }}
                                >
                                  {themeColor === theme.id && <Check className="w-3 h-3 text-white" />}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Appearance Mode */}
                          <div className="px-4 py-2 border-t border-gray-100 dark:border-neutral-700">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Appearance</p>
                            <div className="space-y-1">
                              {APPEARANCE_MODES.map((mode) => (
                                <button
                                  key={mode.id}
                                  onClick={() => setAppearanceMode(mode.id)}
                                  className={`w-full px-3 py-1.5 flex items-center gap-2 rounded-lg text-sm transition-colors ${
                                    appearanceMode === mode.id
                                      ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700/50'
                                  }`}
                                >
                                  <mode.icon className="w-4 h-4" />
                                  {mode.name}
                                  {appearanceMode === mode.id && <Check className="w-3 h-3 ml-auto" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 dark:border-neutral-800" />

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Log out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 overflow-x-auto">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    isActive 
                      ? '' 
                      : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                  }`
                }
                style={({ isActive }) => isActive ? { color: 'var(--theme-primary)' } : {}}
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: 'var(--theme-primary)' }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-neutral-400 dark:text-neutral-600 text-sm">
        <p>Take it one day at a time. You're doing great.</p>
      </footer>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-w-sm w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Log out?</h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-6">Are you sure you want to log out?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                >
                  Log out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
