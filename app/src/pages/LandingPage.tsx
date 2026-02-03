import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Globe, 
  Target, 
  MessageSquare, 
  BarChart3, 
  Award,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Brain,
    title: 'AI Learning Gap Analysis',
    description: 'Our AI identifies your knowledge gaps and creates targeted improvement plans.',
    color: 'from-violet-500 to-purple-600'
  },
  {
    icon: Globe,
    title: 'Multi-Language Career Guidance',
    description: 'Get career advice in your preferred regional language with cultural context.',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    icon: Target,
    title: 'Personalized Study Plans',
    description: 'Adaptive learning paths tailored to your pace, strengths, and weaknesses.',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    icon: MessageSquare,
    title: '24/7 AI Tutor',
    description: 'Get instant answers to your questions anytime, anywhere.',
    color: 'from-amber-500 to-orange-600'
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description: 'Track your learning journey with detailed insights and visualizations.',
    color: 'from-rose-500 to-pink-600'
  },
  {
    icon: Award,
    title: 'Skill Certification',
    description: 'Earn certificates as you master new skills and complete assessments.',
    color: 'from-indigo-500 to-violet-600'
  }
]

const howItWorks = [
  {
    step: '01',
    title: 'Take Assessment',
    description: 'Complete AI-powered assessments to identify your learning gaps.'
  },
  {
    step: '02',
    title: 'Get Analysis',
    description: 'Receive detailed analysis of your strengths and weaknesses.'
  },
  {
    step: '03',
    title: 'Follow Study Plan',
    description: 'Follow your personalized study plan created by our AI.'
  },
  {
    step: '04',
    title: 'Track Progress',
    description: 'Monitor your improvement and achieve your learning goals.'
  }
]

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Class 12 Student',
    content: 'EduAI helped me identify my weak areas in Mathematics and created a study plan that improved my scores by 40%!',
    avatar: 'P'
  },
  {
    name: 'Rahul Kumar',
    role: 'JEE Aspirant',
    content: 'The AI tutor is amazing! I can ask doubts in Hindi and get instant explanations. Best learning platform ever.',
    avatar: 'R'
  },
  {
    name: 'Ananya Patel',
    role: 'Class 10 Student',
    content: 'Career guidance in Gujarati helped me understand my options better. Now I have a clear path for my future.',
    avatar: 'A'
  }
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-slate-950/80 backdrop-blur-lg border-b border-slate-800" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                EduAI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-400 hover:text-slate-100 transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-400 hover:text-slate-100 transition-colors">How It Works</a>
              <a href="#testimonials" className="text-slate-400 hover:text-slate-100 transition-colors">Testimonials</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-slate-300">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-indigo-500 hover:bg-indigo-600">Get Started</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-slate-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-slate-400 hover:text-slate-100">Features</a>
              <a href="#how-it-works" className="block text-slate-400 hover:text-slate-100">How It Works</a>
              <a href="#testimonials" className="block text-slate-400 hover:text-slate-100">Testimonials</a>
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <Link to="/login" className="block w-full">
                  <Button variant="ghost" className="w-full">Sign In</Button>
                </Link>
                <Link to="/register" className="block w-full">
                  <Button className="w-full bg-indigo-500 hover:bg-indigo-600">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span className="text-sm text-indigo-300">Powered by Advanced AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Master Your Learning with{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                AI-Powered
              </span>{' '}
              Education
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Identify your learning gaps, get career guidance in your language, and follow 
              personalized study plans designed by AI to help you succeed.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-indigo-500 hover:bg-indigo-600 text-lg px-8">
                  Start Learning Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  See How It Works
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-white">50K+</div>
                <div className="text-slate-500 text-sm mt-1">Active Students</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-white">1M+</div>
                <div className="text-slate-500 text-sm mt-1">Assessments Taken</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-white">95%</div>
                <div className="text-slate-500 text-sm mt-1">Success Rate</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Succeed
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Our AI-powered platform provides all the tools you need to identify gaps, 
              learn effectively, and achieve your goals.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/30 transition-all duration-300"
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4",
                  feature.color
                )}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              How{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                EduAI
              </span>{' '}
              Works
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Get started in minutes and let our AI guide your learning journey.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-6xl font-bold text-slate-800 mb-4">{step.step}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400">{step.description}</p>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-indigo-500/50 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Student{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Success Stories
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              See how students are transforming their learning with EduAI.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <span className="text-indigo-400 font-bold">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-slate-400">"{testimonial.content}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 sm:p-12 lg:p-16 overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-indigo-100 text-lg mb-8">
                Join thousands of students who are achieving their goals with AI-powered education.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 text-lg px-8">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-indigo-200 text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Free Forever
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  No Credit Card
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Cancel Anytime
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <span className="text-xl font-bold text-white">EduAI</span>
              </div>
              <p className="text-slate-400 text-sm">
                AI-powered education platform helping students identify gaps and achieve their goals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-slate-200">Features</a></li>
                <li><a href="#" className="hover:text-slate-200">Pricing</a></li>
                <li><a href="#" className="hover:text-slate-200">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-slate-200">Documentation</a></li>
                <li><a href="#" className="hover:text-slate-200">Blog</a></li>
                <li><a href="#" className="hover:text-slate-200">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-slate-200">About</a></li>
                <li><a href="#" className="hover:text-slate-200">Careers</a></li>
                <li><a href="#" className="hover:text-slate-200">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            © 2025 EduAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
