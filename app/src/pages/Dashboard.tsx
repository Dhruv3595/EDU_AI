import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Award, 
  Calendar,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'
import type { DashboardData } from '@/types'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/student/dashboard')
      setDashboardData(response.data)
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Failed to load dashboard</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const { user, stats, skills, recent_assessments, active_study_plan, recommendations } = dashboardData

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user.full_name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-slate-400 mt-1">
            Here's your learning progress for today
          </p>
        </div>
        <Link to="/assessments">
          <Button className="bg-indigo-500 hover:bg-indigo-600">
            <Sparkles className="mr-2 h-4 w-4" />
            Take Assessment
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Assessments</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.total_assessments}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Average Score</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.average_score}%</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Learning Streak</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.learning_streak} days</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Study Hours (Week)</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.study_hours_this_week}h</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Study Plan */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-400" />
                Active Study Plan
              </CardTitle>
              <Link to="/study-plans">
                <Button variant="ghost" size="sm" className="text-indigo-400">
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {active_study_plan ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{active_study_plan.title}</span>
                      <span className="text-slate-400 text-sm">
                        {active_study_plan.completed_tasks}/{active_study_plan.total_tasks} tasks
                      </span>
                    </div>
                    <Progress value={active_study_plan.progress} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    {active_study_plan.tasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            task.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} />
                          <span className="text-slate-300 text-sm">{task.topic}</span>
                        </div>
                        <span className="text-slate-500 text-xs">{task.duration_minutes} min</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-4">No active study plan</p>
                  <Link to="/study-plans">
                    <Button className="bg-indigo-500 hover:bg-indigo-600">
                      Create Study Plan
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Skills */}
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-400" />
                Your Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {skills.length > 0 ? (
                  skills.slice(0, 5).map((skill) => (
                    <div key={skill.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-300 text-sm">{skill.name}</span>
                        <span className="text-slate-400 text-xs">{skill.proficiency}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                          style={{ width: `${skill.proficiency}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">
                    Complete assessments to see your skills
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Assessments & Recommendations */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recent_assessments.length > 0 ? (
                  recent_assessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50"
                    >
                      <div>
                        <p className="text-white font-medium">{assessment.subject}</p>
                        <p className="text-slate-500 text-xs">
                          {new Date(assessment.completed_at || '').toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        assessment.score >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                        assessment.score >= 60 ? 'bg-amber-500/10 text-amber-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {assessment.score}%
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-4">
                    No assessments yet. Take your first one!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/50"
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-indigo-400 text-xs">{index + 1}</span>
                    </div>
                    <p className="text-slate-300 text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
