import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Bot, 
  User, 
  Mic, 
  MicOff,
  Sparkles,
  BookOpen,
  Calculator,
  Atom,
  Globe,
  Code,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  suggestions?: string[]
  timestamp: Date
}

const quickActions = [
  { icon: BookOpen, label: 'Explain a concept', color: 'text-indigo-400' },
  { icon: Calculator, label: 'Solve math problem', color: 'text-emerald-400' },
  { icon: Atom, label: 'Science question', color: 'text-amber-400' },
  { icon: Globe, label: 'Career advice', color: 'text-rose-400' },
  { icon: Code, label: 'Programming help', color: 'text-cyan-400' },
]

const suggestedQuestions = [
  'Explain Pythagoras theorem',
  'How do I prepare for JEE?',
  'What are the career options in AI?',
  'Solve: 2x + 5 = 15',
  'Explain Newton\'s laws of motion',
]

export default function AITutor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: "Hello! I'm your AI tutor. I can help you with:\n\n• Understanding concepts\n• Solving problems\n• Career guidance\n• Study tips\n\nWhat would you like to learn today?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await api.post('/ai-tutor/chat', {
        message: content,
        language: 'en'
      })

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.response,
        suggestions: response.data.suggestions,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      toast.error('Failed to get response')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      toast.info('Voice input coming soon!')
    }
  }

  const clearChat = async () => {
    try {
      await api.post('/ai-tutor/clear-history')
      setMessages([{
        id: 0,
        role: 'assistant',
        content: "Hello! I'm your AI tutor. How can I help you today?",
        timestamp: new Date()
      }])
      toast.success('Chat cleared')
    } catch (error) {
      toast.error('Failed to clear chat')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex-none flex items-center justify-between p-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Bot className="h-8 w-8 text-indigo-400" />
            AI Tutor
          </h1>
          <p className="text-slate-400 mt-1">
            Your 24/7 personal learning assistant
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={clearChat}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Chat
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="hidden lg:block w-80 flex-none p-4 space-y-4 overflow-y-auto">
          {/* Quick Actions */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.label)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
                >
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                  <span className="text-slate-300 text-sm">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Suggested Questions */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <h3 className="text-white font-semibold mb-3">Try Asking</h3>
            <div className="space-y-2">
              {suggestedQuestions.map((question, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(question)}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 text-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-900/50 border-l border-slate-800">
          {/* Messages - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-indigo-500/20' 
                      : 'bg-gradient-to-br from-indigo-500 to-violet-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-indigo-400" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className={`max-w-[80%] ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}>
                    <div className={`p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-indigo-500 text-white rounded-br-none'
                        : 'bg-slate-950 text-slate-200 rounded-bl-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(suggestion)}
                            className="px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-sm hover:bg-indigo-500/20 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <span className="text-xs text-slate-500 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 rounded-bl-none">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Invisible div for scroll target */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Fixed at bottom */}
          <div className="flex-none p-4 border-t border-slate-800 bg-slate-900/50">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition-colors ${
                  isRecording 
                    ? 'bg-rose-500/20 text-rose-400' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-slate-950 border-slate-700 text-white"
              />
              <Button 
                type="submit" 
                className="bg-indigo-500 hover:bg-indigo-600"
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}