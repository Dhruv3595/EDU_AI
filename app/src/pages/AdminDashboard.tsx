import { useState, useEffect } from 'react'
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Activity,
  Plus,
  Search,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/admin/dashboard')
      setStats(response.data.statistics)
      setRecentUsers(response.data.recent_users)
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
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
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Overview of platform performance and user activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-white mt-1">{stats?.total_users || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-white mt-1">{stats?.total_students || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Assessments</p>
                <p className="text-3xl font-bold text-white mt-1">{stats?.total_assessments || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg Score</p>
                <p className="text-3xl font-bold text-white mt-1">{stats?.average_score || 0}%</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="users">Recent Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Recent Users</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10 w-64 bg-slate-950 border-slate-700 text-white"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">User</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Role</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Joined</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-800/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-white font-medium">{user.full_name}</p>
                            <p className="text-slate-500 text-sm">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs capitalize">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.is_active 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4 text-slate-400" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Platform Activity</CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <p className="text-slate-400">Analytics charts coming soon</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Subject Performance</CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <p className="text-slate-400">Performance charts coming soon</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Questions</h3>
                <p className="text-slate-400 text-sm mb-4">Manage assessment questions</p>
                <Button className="w-full bg-indigo-500 hover:bg-indigo-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Resources</h3>
                <p className="text-slate-400 text-sm mb-4">Manage learning resources</p>
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Resource
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Careers</h3>
                <p className="text-slate-400 text-sm mb-4">Manage career paths</p>
                <Button className="w-full bg-amber-500 hover:bg-amber-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Career
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
