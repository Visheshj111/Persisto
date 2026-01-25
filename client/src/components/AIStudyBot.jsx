import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bot, 
  X, 
  Send, 
  Loader2, 
  Sparkles, 
  AlertCircle,
  Settings,
  MessageSquare,
  Trash2,
  ChevronDown
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const CHAT_HISTORY_KEY = 'flow-goals-ai-chat-history'

export default function AIStudyBot({ task }) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Load chat history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY)
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        setMessages(parsed)
      } catch (e) {
        console.error('Failed to parse chat history:', e)
      }
    }
  }, [])

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages))
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setHasNewMessage(false)
    }
  }, [isOpen])

  // Add initial greeting when opened with no messages
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = task 
        ? `Hi! 👋 I'm here to help you learn about **${task.title}**. 

${task.description ? `Today's focus: ${task.description}\n\n` : ''}What would you like to know? You can ask me to:
- Explain concepts in simple terms
- Give examples and analogies  
- Quiz you on what you've learned
- Suggest practice exercises

Just ask anything! 😊`
        : `Hi! 👋 I'm your AI Study Assistant. 

I can help you with:
- Explaining concepts in simple terms
- Giving examples and analogies  
- Quizzing you on topics
- Suggesting practice exercises

What would you like to learn about today? 😊`

      setMessages([{ role: 'assistant', content: greeting }])
    }
  }, [isOpen, task?.title])

  const clearHistory = () => {
    localStorage.removeItem(CHAT_HISTORY_KEY)
    const greeting = task 
      ? `Hi! 👋 I'm here to help you learn about **${task.title}**. What would you like to know?`
      : `Hi! 👋 I'm your AI Study Assistant. What would you like to learn about today? 😊`
    setMessages([{ role: 'assistant', content: greeting }])
    setError(null)
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setError(null)
    
    // Add user message to chat
    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const response = await api.post('/ai/study-chat', {
        message: userMessage,
        taskContext: task ? {
          title: task.title,
          description: task.description,
          whatToLearn: task.whatToLearn,
          skillProgression: task.skillProgression
        } : null,
        conversationHistory: newMessages.slice(-10).map(m => ({
          role: m.role,
          content: m.content
        }))
      })

      const updatedMessages = [...newMessages, { 
        role: 'assistant', 
        content: response.data.message 
      }]
      setMessages(updatedMessages)
      
      if (!isOpen) {
        setHasNewMessage(true)
      }
    } catch (err) {
      console.error('AI Chat error:', err)
      const errorCode = err.response?.data?.code
      const errorMessage = err.response?.data?.error

      if (errorCode === 'NO_API_KEY') {
        setError({
          type: 'no_key',
          message: 'Please add your OpenAI API key in Settings to use the AI Study Bot.'
        })
      } else if (errorCode === 'INVALID_API_KEY') {
        setError({
          type: 'invalid_key',
          message: 'Your API key is invalid. Please check it in Settings.'
        })
      } else if (errorCode === 'QUOTA_EXCEEDED') {
        setError({
          type: 'quota',
          message: 'Your OpenAI quota is exceeded. Please check your billing.'
        })
      } else {
        setError({
          type: 'general',
          message: errorMessage || 'Something went wrong. Please try again.'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center theme-bg text-white hover:opacity-90 transition-opacity"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <Bot className="w-6 h-6" />
        {hasNewMessage && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 md:bg-transparent md:pointer-events-none"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-24 right-6 z-50 w-[calc(100vw-48px)] max-w-md h-[70vh] max-h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 theme-bg text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm">AI Study Bot</h2>
                    <p className="text-xs opacity-80">
                      {task?.title ? `Learning: ${task.title}` : 'Ask me anything'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={clearHistory}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Clear chat history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'theme-bg text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content.split('\n').map((line, i) => (
                          <span key={i}>
                            {line.split(/(\*\*.*?\*\*)/).map((part, j) => 
                              part.startsWith('**') && part.endsWith('**') ? (
                                <strong key={j}>{part.slice(2, -2)}</strong>
                              ) : (
                                part
                              )
                            )}
                            {i < message.content.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                        <span className="text-sm text-gray-500">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-red-700 dark:text-red-300">{error.message}</p>
                        {(error.type === 'no_key' || error.type === 'invalid_key') && (
                          <button
                            onClick={() => {
                              setIsOpen(false)
                              navigate('/settings')
                            }}
                            className="mt-1 text-xs text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1"
                          >
                            <Settings className="w-3 h-3" /> Go to Settings
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={task ? "Ask about today's topic..." : "Ask me anything..."}
                      className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] text-gray-800 dark:text-gray-200 placeholder-gray-400 text-sm border border-gray-200 dark:border-gray-700"
                      rows={1}
                      style={{ minHeight: '42px', maxHeight: '100px' }}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="p-2.5 theme-bg text-white rounded-xl hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" /> Powered by GPT-4o-mini
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
