// User Types
export interface User {
  id: number
  email: string
  full_name: string
  role: 'student' | 'teacher' | 'admin'
  is_active: boolean
  created_at: string
}

export interface StudentProfile {
  grade?: string
  preferred_language: string
  learning_style?: string
  study_hours_per_day: number
  academic_goals?: string
  interests: string[]
  strengths: string[]
  weaknesses: string[]
}

export interface UserWithProfile extends User {
  profile: StudentProfile
}

// Auth Types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  grade?: string
  preferred_language?: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

// Assessment Types
export interface Subject {
  id: number
  name: string
  description?: string
  grade_levels: string[]
  topics: string[]
}

export interface Question {
  id: number
  question_text: string
  question_text_translations?: Record<string, string>
  options: string[]
  options_translations?: Record<string, string[]>
  difficulty: number
  topic: string
  time_limit_seconds: number
}

export interface Assessment {
  id: number
  subject: string
  score: number
  status: 'in_progress' | 'completed' | 'abandoned'
  completed_at?: string
}

export interface GapAnalysis {
  gaps: Array<{
    topic: string
    accuracy: number
    severity: 'high' | 'medium' | 'low'
  }>
  strengths: Array<{
    topic: string
    accuracy: number
  }>
  overall_level: 'beginner' | 'intermediate' | 'advanced'
}

// Study Plan Types
export interface StudyPlan {
  id: number
  title: string
  description?: string
  start_date: string
  end_date: string
  progress: number
  total_tasks: number
  completed_tasks: number
  status: 'active' | 'completed' | 'paused'
  plan_data?: any
}

export interface StudyTask {
  id: number
  topic: string
  subtopic?: string
  description?: string
  task_type: 'study' | 'practice' | 'review' | 'assessment'
  scheduled_date: string
  duration_minutes: number
  priority: number
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  resources: string[]
  completed_at?: string
}

// Career Types
export interface CareerPath {
  id: number
  title: string
  description: string
  industry: string
  category: string
  avg_salary_range: {
    min: number
    max: number
    currency: string
  }
  required_skills: string[]
  match_percentage?: number
}

export interface CareerRoadmap {
  stage: string
  title: string
  description?: string
  milestones: string[]
  time_estimate: string
}

// AI Tutor Types
export interface ChatMessage {
  id?: number
  message: string
  response: string
  language: string
  intent?: string
  timestamp?: string
}

// Skill Types
export interface Skill {
  name: string
  category: string
  proficiency: number
}

// Dashboard Types
export interface DashboardStats {
  total_assessments: number
  average_score: number
  learning_streak: number
  study_hours_this_week: number
}

export interface DashboardData {
  user: User & { grade?: string }
  stats: DashboardStats
  skills: Skill[]
  recent_assessments: Assessment[]
  active_study_plan?: StudyPlan & { tasks: StudyTask[] }
  recommendations: string[]
}

// Resource Types
export interface LearningResource {
  id: number
  title: string
  description?: string
  type: string
  url: string
  topic?: string
  difficulty: number
  duration_minutes?: number
  tags: string[]
  rating: number
  view_count: number
}
