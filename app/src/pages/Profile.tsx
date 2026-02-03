import { useState, useEffect } from 'react'
import { 
  User, 
  Mail, 
  BookOpen, 
  Clock, 
  Target,
  Save,
  Award,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const grades = [
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'Undergraduate', 'Graduate'
]

const languages = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'bn', label: 'Bengali' },
  { value: 'mr', label: 'Marathi' },
  { value: 'gu', label: 'Gujarati' },
]

const learningStyles = [
  { value: 'visual', label: 'Visual - Learn by seeing' },
  { value: 'auditory', label: 'Auditory - Learn by hearing' },
  { value: 'kinesthetic', label: 'Kinesthetic - Learn by doing' },
  { value: 'reading', label: 'Reading/Writing - Learn by reading' },
]

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({
    full_name: '',
    grade: '',
    preferred_language: 'en',
    learning_style: '',
    study_hours_per_day: 2,
    academic_goals: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me')
      setProfile(response.data)
      setFormData({
        full_name: response.data.full_name,
        grade: response.data.profile?.grade || '',
        preferred_language: response.data.profile?.preferred_language || 'en',
        learning_style: response.data.profile?.learning_style || '',
        study_hours_per_day: response.data.profile?.study_hours_per_day || 2,
        academic_goals: response.data.profile?.academic_goals || '',
      })
    } catch (error) {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/auth/profile', formData)
      toast.success('Profile updated successfully')
      fetchProfile()
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
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
      <div>
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="text-slate-400 mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Avatar Card */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-white">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white">{profile?.full_name}</h3>
                <p className="text-slate-400">{profile?.email}</p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm">
                  <Award className="h-4 w-4" />
                  {profile?.role}
                </div>
              </CardContent>
            </Card>

            {/* Edit Form */}
            <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Edit Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        value={formData.full_name || ''}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="pl-10 bg-slate-950 border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        value={profile?.email || ''}
                        disabled
                        className="pl-10 bg-slate-950 border-slate-700 text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Grade</Label>
                    <Select 
                      value={formData.grade} 
                      onValueChange={(value) => setFormData({ ...formData, grade: value })}
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                        <BookOpen className="h-4 w-4 mr-2 text-slate-500" />
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        {grades.map((grade) => (
                          <SelectItem key={grade} value={grade} className="text-white">
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Preferred Language</Label>
                    <Select 
                      value={formData.preferred_language} 
                      onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value} className="text-white">
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Learning Style</Label>
                    <Select 
                      value={formData.learning_style} 
                      onValueChange={(value) => setFormData({ ...formData, learning_style: value })}
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                        <Target className="h-4 w-4 mr-2 text-slate-500" />
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        {learningStyles.map((style) => (
                          <SelectItem key={style.value} value={style.value} className="text-white">
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Study Hours per Day</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        type="number"
                        min="0.5"
                        max="12"
                        step="0.5"
                        value={formData.study_hours_per_day}
                        onChange={(e) => setFormData({ ...formData, study_hours_per_day: parseFloat(e.target.value) })}
                        className="pl-10 bg-slate-950 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Academic Goals</Label>
                  <textarea
                    value={formData.academic_goals || ''}
                    onChange={(e) => setFormData({ ...formData, academic_goals: e.target.value })}
                    placeholder="What are your academic goals?"
                    rows={4}
                    className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 resize-none"
                  />
                </div>

                <Button 
                  onClick={handleSave} 
                  className="bg-indigo-500 hover:bg-indigo-600"
                  disabled={saving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Member Since</p>
                    <p className="text-white font-semibold">
                      {new Date(profile?.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Learning Streak</p>
                    <p className="text-white font-semibold">5 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Badges Earned</p>
                    <p className="text-white font-semibold">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <Award className="h-10 w-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Achievements Coming Soon</h3>
              <p className="text-slate-400">
                Complete assessments and study plans to earn badges and certificates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
