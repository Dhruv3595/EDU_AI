import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Clock,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Trophy,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import type { Subject, Question } from '@/types'
import { toast } from 'sonner'

interface AssessmentState {
  assessmentId: number | null
  questions: Question[]
  currentQuestion: number
  answers: Record<number, { answer: string; timeTaken: number }>
  startTime: number
  isCompleted: boolean
  results: any | null
}

export default function Assessments() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [assessment, setAssessment] = useState<AssessmentState>({
    assessmentId: null,
    questions: [],
    currentQuestion: 0,
    answers: {},
    startTime: 0,
    isCompleted: false,
    results: null
  })
  const [, setSelectedSubject] = useState<number | null>(null)

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/assessments/subjects')
      setSubjects(response.data)
    } catch (error) {
      toast.error('Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  const startAssessment = async (subjectId: number) => {
    try {
      const response = await api.post('/assessments/start', null, {
        params: { subject_id: subjectId }
      })

      setAssessment({
        assessmentId: response.data.assessment_id,
        questions: response.data.questions,
        currentQuestion: 0,
        answers: {},
        startTime: Date.now(),
        isCompleted: false,
        results: null
      })
      setSelectedSubject(subjectId)
    } catch (error) {
      toast.error('Failed to start assessment')
    }
  }

  const submitAnswer = (answer: string) => {
    const currentQ = assessment.questions[assessment.currentQuestion]
    const timeTaken = Math.floor((Date.now() - assessment.startTime) / 1000)

    setAssessment(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQ.id]: { answer, timeTaken }
      },
      currentQuestion: prev.currentQuestion + 1,
      startTime: Date.now()
    }))

    // If last question, submit assessment
    if (assessment.currentQuestion === assessment.questions.length - 1) {
      submitAssessment({
        ...assessment.answers,
        [currentQ.id]: { answer, timeTaken }
      })
    }
  }

  const submitAssessment = async (answers: Record<number, { answer: string; timeTaken: number }>) => {
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, data]) => ({
        question_id: parseInt(questionId),
        answer: data.answer,
        time_taken_seconds: data.timeTaken
      }))

      const response = await api.post(`/assessments/${assessment.assessmentId}/submit`, {
        answers: formattedAnswers
      })

      setAssessment(prev => ({
        ...prev,
        isCompleted: true,
        results: response.data
      }))

      toast.success('Assessment completed!')
    } catch (error) {
      toast.error('Failed to submit assessment')
    }
  }

  const resetAssessment = () => {
    setAssessment({
      assessmentId: null,
      questions: [],
      currentQuestion: 0,
      answers: {},
      startTime: 0,
      isCompleted: false,
      results: null
    })
    setSelectedSubject(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    )
  }

  // Show results if assessment is completed
  if (assessment.isCompleted && assessment.results) {
    return (
      <AssessmentResults
        results={assessment.results}
        onReset={resetAssessment}
      />
    )
  }

  // Show active assessment
  if (assessment.questions.length > 0) {
    const currentQ = assessment.questions[assessment.currentQuestion]
    const progress = ((assessment.currentQuestion) / assessment.questions.length) * 100

    // Safety check - if currentQ is undefined, reset assessment
    if (!currentQ) {
      resetAssessment()
      return null
    }

    return (
      <div className="max-w-3xl mx-auto">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400">
              Question {assessment.currentQuestion + 1} of {assessment.questions.length}
            </span>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="h-4 w-4" />
              <span>00:00</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8"
        >
          <div className="mb-2">
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
              {currentQ.topic || 'General'}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-8">
            {currentQ.question_text}
          </h2>

          <div className="space-y-3">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => submitAnswer(option)}
                className="w-full text-left p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-indigo-500/20 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 font-medium transition-colors">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-slate-300 group-hover:text-white">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  // Show subject selection
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Assessments</h1>
        <p className="text-slate-400 mt-1">
          Take AI-powered assessments to identify your learning gaps
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject, index) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-900/50 border-slate-800 hover:border-indigo-500/30 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{subject.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{subject.description}</p>
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <span>{subject.topics?.length || 0} topics</span>
                  <span>•</span>
                  <span>~15 min</span>
                </div>
                <Button
                  className="w-full bg-indigo-500 hover:bg-indigo-600"
                  onClick={() => startAssessment(subject.id)}
                >
                  Start Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function AssessmentResults({ results, onReset }: { results: any; onReset: () => void }) {
  const { score, correct_answers, total_questions, gap_analysis, recommendations } = results

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Score Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 mb-4">
          <Trophy className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Assessment Complete!</h1>
        <p className="text-slate-400">Here's your detailed performance analysis</p>
      </motion.div>

      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className={`text-5xl font-bold mb-2 ${score >= 80 ? 'text-emerald-400' :
                    score >= 60 ? 'text-amber-400' :
                      'text-rose-400'
                  }`}>
                  {score}%
                </div>
                <p className="text-slate-400">Overall Score</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-white mb-2">
                  {correct_answers}/{total_questions}
                </div>
                <p className="text-slate-400">Correct Answers</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-indigo-400 mb-2 capitalize">
                  {gap_analysis?.overall_level}
                </div>
                <p className="text-slate-400">Proficiency Level</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Gap Analysis */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gap_analysis?.gaps?.length > 0 ? (
                  gap_analysis.gaps.map((gap: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                      <span className="text-slate-300">{gap.topic}</span>
                      <span className={`text-sm font-medium ${gap.severity === 'high' ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                        {gap.accuracy}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">Great job! No major gaps found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Your Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gap_analysis?.strengths?.length > 0 ? (
                  gap_analysis.strengths.map((strength: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <span className="text-slate-300">{strength.topic}</span>
                      <span className="text-sm font-medium text-emerald-400">
                        {strength.accuracy}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">Keep practicing to build strengths!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations?.map((rec: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-4"
      >
        <Button onClick={onReset} variant="outline" className="flex-1">
          Take Another Assessment
        </Button>
        <Button className="flex-1 bg-indigo-500 hover:bg-indigo-600">
          Generate Study Plan
        </Button>
      </motion.div>
    </div>
  )
}
