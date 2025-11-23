# Jumper

A full-stack application with Next.js frontend and FastAPI backend, integrated with Supabase for authentication.

## Project Structure

```
├── frontend/          # Next.js React application
├── backend/           # FastAPI Python application
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+
- Python 3.8+
- Supabase account and project

### Environment Variables

1. **Backend** (`backend/.env`):
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

2. **Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Installation & Running

1. **Backend Setup**:
```bash
cd backend
chmod +x start.sh
./start.sh
```
Or manually:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

2. **Frontend Setup**:
```bash
cd frontend
pnpm install  # or npm install
pnpm dev      # or npm run dev
```

The backend will run on `http://localhost:8000` and the frontend on `http://localhost:3000`.

## Features

- 🔐 Supabase authentication (sign up, sign in, sign out)
- 🎨 Modern UI with Tailwind CSS
- 🔄 Real-time auth state management
- 🚀 FastAPI backend with automatic OpenAPI documentation
- 📱 Responsive design with dark mode support

## API Documentation

When the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.