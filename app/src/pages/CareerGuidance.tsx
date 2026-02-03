import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Briefcase,
  Globe,
  TrendingUp,
  DollarSign,
  BookOpen,
  ArrowRight,
  Sparkles,
  Target,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import type { CareerPath } from '@/types'
import { toast } from 'sonner'

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
]

export default function CareerGuidance() {
  const [careers, setCareers] = useState<CareerPath[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [loading, setLoading] = useState(true)
  const [, setSelectedCareer] = useState<CareerPath | null>(null)
  const [careerDetails, setCareerDetails] = useState<any>(null)
  const [industries, setIndustries] = useState<string[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')

  useEffect(() => {
    fetchCareers()
    fetchIndustries()
  }, [selectedLanguage])

  const fetchCareers = async () => {
    try {
      const response = await api.get('/careers/careers', {
        params: { language: selectedLanguage }
      })
      setCareers(response.data.careers)
    } catch (error) {
      toast.error('Failed to load careers')
    } finally {
      setLoading(false)
    }
  }

  const fetchIndustries = async () => {
    try {
      const response = await api.get('/careers/industries')
      setIndustries(response.data.industries)
    } catch (error) {
      console.error('Failed to load industries')
    }
  }

  const fetchCareerDetails = async (careerId: number) => {
    try {
      const response = await api.get(`/careers/careers/${careerId}`, {
        params: { language: selectedLanguage }
      })
      setCareerDetails(response.data)
      setSelectedCareer(careers.find(c => c.id === careerId) || null)
    } catch (error) {
      toast.error('Failed to load career details')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Career Guidance</h1>
          <p className="text-slate-400 mt-1">
            Explore career paths with AI-powered recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-slate-400" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Industry Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedIndustry === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedIndustry('')}
          className={selectedIndustry === '' ? 'bg-indigo-500' : ''}
        >
          All Industries
        </Button>
        {industries.map((industry) => (
          <Button
            key={industry}
            variant={selectedIndustry === industry ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedIndustry(industry)}
            className={selectedIndustry === industry ? 'bg-indigo-500' : ''}
          >
            {industry}
          </Button>
        ))}
      </div>

      {/* Career Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {careers
          .filter(c => !selectedIndustry || c.industry === selectedIndustry)
          .map((career, index) => (
            <motion.div
              key={career.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-slate-900/50 border-slate-800 hover:border-indigo-500/30 transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-indigo-400" />
                    </div>
                    {career.match_percentage && (
                      <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium">
                        {career.match_percentage}% Match
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2">{career.title}</h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{career.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="h-4 w-4" />
                      {career.industry}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <DollarSign className="h-4 w-4" />
                      {career.avg_salary_range?.currency} {career.avg_salary_range?.min?.toLocaleString()} - {career.avg_salary_range?.max?.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {career.required_skills?.slice(0, 3).map((skill, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => fetchCareerDetails(career.id)}
                      >
                        Explore Career
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                      {careerDetails && (
                        <CareerDetailsView career={careerDetails} />
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </motion.div>
          ))}
      </div>

      {/* Skills Matcher CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8"
      >
        <Card className="bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border-indigo-500/30">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Not sure which career is right for you?
                </h3>
                <p className="text-slate-300">
                  Let our AI analyze your skills and interests to recommend the best career paths.
                </p>
              </div>
              <Button className="bg-indigo-500 hover:bg-indigo-600 px-8">
                <Sparkles className="mr-2 h-5 w-5" />
                Find My Career Match
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function CareerDetailsView({ career }: { career: any }) {
  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-white">{career.title}</DialogTitle>
        <DialogDescription>
          Detailed overview of the {career.title} career path.
        </DialogDescription>
      </DialogHeader>

      <div>
        <p className="text-slate-300">{career.description}</p>
      </div>

      {/* Salary & Industry */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/50">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <DollarSign className="h-4 w-4" />
            Average Salary
          </div>
          <p className="text-white font-semibold">
            {career.avg_salary_range?.currency} {career.avg_salary_range?.min?.toLocaleString()} - {career.avg_salary_range?.max?.toLocaleString()}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-950/50">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Briefcase className="h-4 w-4" />
            Industry
          </div>
          <p className="text-white font-semibold">{career.industry}</p>
        </div>
      </div>

      {/* Required Skills */}
      <div>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-400" />
          Required Skills
        </h4>
        <div className="flex flex-wrap gap-2">
          {career.required_skills?.map((skill: string, i: number) => (
            <span key={i} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 text-sm">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Education Requirements */}
      <div>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-400" />
          Education Path
        </h4>
        <div className="space-y-2">
          {career.education_requirements?.map((edu: string, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/50">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
                {i + 1}
              </div>
              <span className="text-slate-300">{edu}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Career Roadmap */}
      {career.roadmap && career.roadmap.length > 0 && (
        <div>
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            Career Roadmap
          </h4>
          <div className="space-y-3">
            {career.roadmap.map((stage: any, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{stage.title}</span>
                  <span className="text-slate-500 text-sm">{stage.time_estimate}</span>
                </div>
                <p className="text-slate-400 text-sm mb-2">{stage.description}</p>
                <div className="flex flex-wrap gap-2">
                  {stage.milestones?.map((milestone: string, j: number) => (
                    <span key={j} className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs">
                      {milestone}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job Outlook */}
      {(career.job_outlook || career.growth_prospects) && (
        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
          <h4 className="text-white font-semibold mb-2">Job Outlook</h4>
          <p className="text-slate-300 text-sm">{career.job_outlook || career.growth_prospects}</p>
        </div>
      )}
    </div>
  )
}
