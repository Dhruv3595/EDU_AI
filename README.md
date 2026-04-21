# 🎓 EduAI - AI-Powered Education Platform
## 👨‍💻 Developed By
Dhruv Pandya  
Full Stack Developer  

- GitHub: https://github.com/Dhruv3595
- LinkedIn: https://linkedin.com/in/dhruv-pandya07

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://www.postgresql.org/)

**EduAI** is an advanced AI-powered education platform that helps students identify learning gaps, provides career guidance in regional languages, and creates personalized study plans using cutting-edge AI/ML technologies.

![EduAI Banner](https://via.placeholder.com/1200x400/6366F1/FFFFFF?text=EduAI+-+AI+Education+Platform)

## 🌟 Key Features

### 1. 🤖 AI Learning Gap Analysis
- Machine learning-powered assessment system
- Identifies specific topic-level weaknesses
- Provides personalized improvement suggestions
- Tracks progress over time with visual analytics

### 2. 🌍 Multi-Language Career Guidance
- Support for 10+ Indian regional languages
- AI-powered translation with cultural context
- Localized career recommendations
- Industry-specific salary insights

### 3. 📚 Personalized Study Plans
- Adaptive learning paths based on student performance
- Spaced repetition algorithm
- Time-based scheduling
- Resource recommendation engine

### 4. 💬 24/7 AI Tutor
- RAG (Retrieval-Augmented Generation) powered chatbot
- Multi-modal support (text, voice)
- Context-aware responses
- Instant doubt resolution

### 5. 📊 Advanced Analytics
- Learning velocity tracking
- Knowledge retention metrics
- Comparative analysis
- Predictive performance modeling

### 6. 🏆 Gamification
- XP points and badges
- Achievement tracking
- Learning streaks
- Progress certificates

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │ Assessments  │  │  Study Plans │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Career Guide  │  │   AI Tutor   │  │   Profile    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Auth      │  │ Assessments  │  │ Study Plans  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Careers    │  │   AI Tutor   │  │    Admin     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │    Redis     │  │ Vector DB    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python)
- **Authentication**: JWT + OAuth2
- **AI/ML**: 
  - TensorFlow/PyTorch for learning models
  - scikit-learn for gap analysis
  - Transformers for NLP
  - LangChain for AI tutor
- **API Documentation**: Auto-generated Swagger UI

### Database
- **Primary**: PostgreSQL (structured data)
- **Cache**: Redis (session management)
- **Vector Store**: ChromaDB (for AI embeddings)

## 📁 Project Structure

```
eduai/
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx          # Main application
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # FastAPI Backend
│   ├── routers/             # API route handlers
│   ├── models/              # SQLAlchemy models
│   ├── services/            # Business logic
│   ├── ai_models/           # ML model implementations
│   ├── utils/               # Utility functions
│   ├── database/            # Database connection
│   ├── main.py              # Application entry
│   └── requirements.txt
│
├── database/                 # Database migrations
├── docs/                     # Documentation
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- Python 3.10+
- PostgreSQL 15+
- Redis (optional, for caching)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/eduai.git
cd eduai
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URL

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. Database Setup

```bash
# Create PostgreSQL database
createdb eduai

# Run migrations (from backend directory)
alembic upgrade head

# Seed initial data (optional)
python scripts/seed_data.py
```

## 🌐 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/eduai

# Security
SECRET_KEY=your-super-secret-key

# Application
DEBUG=True
PORT=8000

# AI/ML (optional)
OPENAI_API_KEY=your-openai-key
HUGGINGFACE_TOKEN=your-hf-token
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

## 📱 Features Overview

### Student Dashboard
- Overview of learning progress
- Recent assessments
- Active study plans
- Skill tracking
- AI recommendations

### Assessments
- Subject-wise assessments
- Adaptive difficulty
- Real-time feedback
- Gap analysis with visual charts
- Personalized recommendations

### Study Plans
- AI-generated personalized plans
- Task management
- Progress tracking
- Calendar integration
- Resource recommendations

### Career Guidance
- Multi-language support
- Industry exploration
- Skill matching
- Career roadmaps
- Salary insights

### AI Tutor
- 24/7 availability
- Multi-language support
- Context-aware responses
- Voice input (coming soon)
- Chat history

### Admin Panel
- User management
- Content management
- Analytics dashboard
- Question bank
- Resource management

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy

### Backend (Render/Railway)
1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set environment variables
4. Deploy

### Database (Supabase/Neon)
1. Create account on Supabase or Neon
2. Create new project
3. Get connection string
4. Update environment variables

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [React](https://reactjs.org/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Hugging Face](https://huggingface.co/) - AI models

## 📞 Support

For support, email support@eduai.com or join our [Discord community](https://discord.gg/eduai).

## 🔗 Links

- [Live Demo](https://eduai.vercel.app)
- [Documentation](https://docs.eduai.com)
- [API Reference](https://api.eduai.com/docs)

---

Made with ❤️ by the EduAI Team
