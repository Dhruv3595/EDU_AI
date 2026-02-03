import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'

// Pages
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import Dashboard from '@/pages/Dashboard'
import Assessments from '@/pages/Assessments'
import StudyPlans from '@/pages/StudyPlans'
import CareerGuidance from '@/pages/CareerGuidance'
import AITutor from '@/pages/AITutor'
import Profile from '@/pages/Profile'
import AdminDashboard from '@/pages/AdminDashboard'

// Layouts
import StudentLayout from '@/layouts/StudentLayout'
import AdminLayout from '@/layouts/AdminLayout'

// Hooks
import { useAuth } from '@/hooks/useAuth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1
    }
  }
})

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { isAuthenticated, isAdmin } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="eduai-theme">
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Student Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <StudentLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="assessments" element={<Assessments />} />
              <Route path="study-plans" element={<StudyPlans />} />
              <Route path="career-guidance" element={<CareerGuidance />} />
              <Route path="ai-tutor" element={<AITutor />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
            </Route>
          </Routes>
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
