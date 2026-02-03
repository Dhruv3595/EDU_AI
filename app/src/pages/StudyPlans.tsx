import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Target,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import type { StudyPlan, StudyTask, Subject } from '@/types'
import { toast } from 'sonner'

export default function StudyPlans() {
  const [, setStudyPlans] = useState<StudyPlan[]>([])
  const [currentPlan, setCurrentPlan] = useState<(StudyPlan & { tasks: StudyTask[] }) | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [todayTasks, setTodayTasks] = useState<StudyTask[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [plansRes, currentRes, subjectsRes, todayRes] = await Promise.all([
        api.get('/study-plans'),
        api.get('/study-plans/current'),
        api.get('/assessments/subjects'),
        api.get('/study-plans/tasks/today')
      ])
      setStudyPlans(plansRes.data.plans || [])
      setCurrentPlan(currentRes.data.plan || null)
      setSubjects(subjectsRes.data)
      setTodayTasks(todayRes.data.tasks || [])
    } catch (error) {
      toast.error('Failed to load study plans')
    } finally {
      setLoading(false)
    }
  }

  const createStudyPlan = async (formData: any) => {
    try {
      await api.post('/study-plans/generate', formData)
      toast.success('Study plan created successfully!')
      setCreateDialogOpen(false)
      fetchData()
    } catch (error) {
      toast.error('Failed to create study plan')
    }
  }

  const updateTaskStatus = async (taskId: number, status: string) => {
    try {
      await api.put(`/study-plans/tasks/${taskId}`, { status })
      fetchData()
      toast.success('Task updated!')
    } catch (error) {
      toast.error('Failed to update task')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Study Plans</h1>
          <p className="text-slate-400 mt-1">
            AI-generated personalized study schedules
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-500 hover:bg-indigo-600">
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Study Plan</DialogTitle>
              <DialogDescription>
                Enter details to generate AI-powered study plan.
              </DialogDescription>
            </DialogHeader>
            <CreatePlanForm subjects={subjects} onSubmit={createStudyPlan} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Plan */}
      {currentPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-400" />
                  Active Study Plan
                </CardTitle>
                <p className="text-slate-400 text-sm mt-1">{currentPlan.title}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {Math.round((currentPlan.completed_tasks / currentPlan.total_tasks) * 100)}%
                </div>
                <p className="text-slate-400 text-sm">Complete</p>
              </div>
            </CardHeader>
            <CardContent>
              <Progress
                value={(currentPlan.completed_tasks / currentPlan.total_tasks) * 100}
                className="h-2 mb-6"
              />

              <div className="space-y-4">
                {currentPlan.tasks?.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl bg-slate-950/50 border border-slate-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => updateTaskStatus(
                            task.id,
                            task.status === 'completed' ? 'pending' : 'completed'
                          )}
                          className="mt-1 flex-shrink-0"
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                          ) : (
                            <Circle className="h-6 w-6 text-slate-600 hover:text-indigo-400 transition-colors" />
                          )}
                        </button>
                        <div>
                          <p className={`font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-white'
                            }`}>
                            {task.topic}
                          </p>
                          <p className="text-slate-400 text-sm mt-1 whitespace-pre-wrap">{task.description}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="text-slate-500 text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                              {task.subtopic}
                            </span>
                            {task.resources?.length > 0 && task.resources.map((res: string, i: number) => (
                              <span key={i} className="text-indigo-400 text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                🔍 {res}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-slate-400 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {task.duration_minutes} min
                        </div>
                        <span className={`px-2 py-1 rounded ${task.priority === 3 ? 'bg-rose-500/10 text-rose-400' :
                          task.priority === 2 ? 'bg-amber-500/10 text-amber-400' :
                            'bg-emerald-500/10 text-emerald-400'
                          }`}>
                          P{task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {currentPlan.tasks && currentPlan.tasks.length > 5 && (
                <Button variant="ghost" className="w-full mt-4 text-indigo-400">
                  View All Tasks
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Today's Tasks */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-400" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayTasks.length > 0 ? (
                todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-4 p-3 rounded-lg bg-slate-950/50 border border-slate-800/50"
                  >
                    <div className={`mt-1.5 w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                    <div className="flex-1">
                      <p className={`text-white text-sm font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : ''}`}>{task.topic}</p>
                      <p className="text-slate-400 text-xs mt-1 line-clamp-2">{task.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-slate-500 text-[10px]">{task.duration_minutes}m</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-amber-500/10 text-amber-400'
                        }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-4">No tasks scheduled for today</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              Dynamic Study Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentPlan?.plan_data?.metadata?.learning_tactics ? (
                currentPlan.plan_data.metadata.learning_tactics.map((tactic: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/30">
                    <p className="text-slate-300 text-sm flex items-start gap-3">
                      <span className="text-indigo-400 font-bold mt-0.5">#{idx + 1}</span>
                      {tactic}
                    </p>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-3 rounded-lg bg-slate-950/50">
                    <p className="text-slate-300 text-sm">🧠 Use spaced repetition for better retention</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/50">
                    <p className="text-slate-300 text-sm">⏱️ Take 5-minute breaks every 25 minutes</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/50">
                    <p className="text-slate-300 text-sm">📝 Practice active recall instead of re-reading</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CreatePlanForm({ subjects, onSubmit }: { subjects: Subject[]; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    subject_id: '',
    topics: '',
    start_date: '',
    end_date: '',
    daily_hours: 2
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      subject_id: parseInt(formData.subject_id),
      topics: formData.topics.split(',').map(t => t.trim()),
      daily_hours: parseFloat(formData.daily_hours as any)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Subject</Label>
        <select
          value={formData.subject_id}
          onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
          className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
          required
        >
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Topics (comma separated)</Label>
        <Input
          value={formData.topics}
          onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
          placeholder="Algebra, Geometry, Calculus"
          className="bg-slate-950 border-slate-700 text-white"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="bg-slate-950 border-slate-700 text-white"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="bg-slate-950 border-slate-700 text-white"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Daily Study Hours</Label>
        <Input
          type="number"
          min="0.5"
          max="12"
          step="0.5"
          value={formData.daily_hours}
          onChange={(e) => setFormData({ ...formData, daily_hours: parseFloat(e.target.value) })}
          className="bg-slate-950 border-slate-700 text-white"
        />
      </div>

      <Button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600">
        <Sparkles className="mr-2 h-4 w-4" />
        Generate AI Plan
      </Button>
    </form>
  )
}
