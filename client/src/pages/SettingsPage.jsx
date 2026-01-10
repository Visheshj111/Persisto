import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { 
  Bell, 
  Users, 
  Globe, 
  Save, 
  Loader2,
  CheckCircle,
  Shield,
  Eye,
  EyeOff,
  Info,
  X
} from 'lucide-react'
import api from '../utils/api'

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [settings, setSettings] = useState({
    showInActivityFeed: user?.showInActivityFeed ?? true,
    reminderEnabled: user?.reminderEnabled ?? true,
    timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPrivacyNote, setShowPrivacyNote] = useState(false)

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await api.patch('/users/settings', settings)
      updateUser(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Customize your experience</p>
      </div>

      {/* Profile Card */}
      <div className="calm-card">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Profile
        </h2>
        
        <div className="flex items-center gap-4">
          {user?.picture && (
            <img 
              src={user.picture} 
              alt={user.name} 
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100">{user?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="calm-card">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Privacy
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3">
              {settings.showInActivityFeed ? (
                <Eye className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-700 dark:text-gray-200">Show in Activity Feed</p>
                  <button
                    onClick={() => setShowPrivacyNote(!showPrivacyNote)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="More info"
                  >
                    <Info className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your task name and completion % will be shared with the community. You can opt out anytime.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('showInActivityFeed')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.showInActivityFeed ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <div 
                className={`absolute top-1 w-4 h-4 rounded-full shadow transition-transform ${
                  settings.showInActivityFeed 
                    ? 'translate-x-7 bg-white dark:bg-black' 
                    : 'translate-x-1 bg-white dark:bg-gray-500'
                }`}
              />
            </button>
          </div>

          <AnimatePresence>
            {showPrivacyNote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl relative"
              >
                <button
                  onClick={() => setShowPrivacyNote(false)}
                  className="absolute top-2 right-2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-300 pr-6">
                  <strong>Privacy Note:</strong> We never share your personal information or email. 
                  Only your name, current task title, and progress percentage are visible to friends and community members.
                  You can disable this at any time.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="calm-card">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Reminders
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-200">Daily Reminder at 9 PM</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  A gentle nudge to check in on your daily task
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('reminderEnabled')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.reminderEnabled ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <div 
                className={`absolute top-1 w-4 h-4 rounded-full shadow transition-transform ${
                  settings.reminderEnabled 
                    ? 'translate-x-7 bg-white dark:bg-black' 
                    : 'translate-x-1 bg-white dark:bg-gray-500'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Timezone */}
      <div className="calm-card">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Timezone
        </h2>
        
        <select
          value={settings.timezone}
          onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
          className="calm-input"
        >
          {Intl.supportedValuesOf('timeZone').map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="calm-button-primary flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* About Section */}
      <div className="calm-card bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-0">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">About Persisto</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Persisto is designed to help you build skills consistently without anxiety or pressure. 
          We believe in calm consistency over rushed urgency.
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <p>No streaks or streak-breaking anxiety</p>
          <p>No guilt when you skip a day</p>
          <p>No pressure language or shaming</p>
          <p>Just gentle, consistent progress</p>
        </div>
      </div>
    </motion.div>
  )
}
