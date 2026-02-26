# 🤖 AI Resume Screener

A **offline AI-powered Resume Screening system** built with **FastAPI, React, PostgreSQL, and Local Mistral LLM (via Ollama)**. This system automatically analyzes resumes, extracts skills, scores candidates, and provides intelligent hiring recommendations.

Perfect for **HR teams, recruiters, and Autonomous Hiring Agents**.

---

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.9%2B-green)
![React](https://img.shields.io/badge/react-18.x-blue)
![FastAPI](https://img.shields.io/badge/fastapi-production-green)
![License](https://img.shields.io/badge/license-MIT-orange)

---

# ✨ Features

## ✅ Core Features

* Resume Upload (PDF & DOCX support)
* Offline AI analysis using Local Mistral LLM
* Automatic skill extraction
* Experience and education analysis
* AI-based candidate scoring
* Smart SELECT / REJECT recommendations
* Fully offline and private

---

## 🚀 Advanced Features

* 📊 Detailed score breakdown dashboard
* 🔍 AI semantic candidate search
* 📥 Export candidates to CSV
* 👤 Candidate profile view
* 📈 Analytics dashboard
* 📧 Email notifications
* 📝 Custom job descriptions
* 🏷️ Candidate tagging system
* 📅 Interview scheduling
* 🔄 Batch resume upload
* 📱 Mobile responsive UI
* 🔐 JWT Authentication
* 🗄️ PostgreSQL database support

---

# 🏗️ Architecture

```
Frontend (React + Tailwind)
        │
        ▼
FastAPI Backend
        │
        ▼
Local Mistral LLM (Ollama)
        │
        ▼
PostgreSQL / SQLite Database
```

---

# 🚀 Quick Start Guide

## 📋 Prerequisites

Make sure you have installed:

* Python 3.9+
* Node.js 16+
* PostgreSQL (optional)
* Ollama → https://ollama.com

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/Shankar7318/Ai-Resume-Screener.git
cd ai-resume-screener
```

---

## 2️⃣ Install Ollama and Pull Model

Install Ollama from:

https://ollama.com

Then run:

```bash
ollama pull mistral:latest
```

Optional faster models:

```bash
ollama pull phi
ollama pull tinyllama
```

---

## 3️⃣ Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv
```

Activate virtual environment:

Windows:

```bash
venv\Scripts\activate
```

Linux / Mac:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

This will install all the Python packages needed for your backend to run properly.

Run backend:

```bash
python run.py
```

or

```bash
uvicorn main:app --reload
```

---

## 4️⃣ Frontend Setup (React)

```bash
cd frontend

npm install

npm run dev
```

---

# 🌐 Access Application

Frontend:

```
http://localhost:5173
```

Backend API:

```
http://localhost:8000
```

API Docs:

```
http://localhost:8000/docs
```

---

# 📁 Project Structure

```
ai-resume-screener/
│
├── backend/
│   ├── main.py
│   ├── auth.py
│   ├── database.py
│   ├── models.py
│   ├── extract.py
│   ├── screener.py
│   ├── requirements.txt
│   ├── run.py
│   └── services/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── CandidateDetail.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│
└── README.md
```

---

# 🎯 API Endpoints

| Method | Endpoint         | Description             |
| ------ | ---------------- | ----------------------- |
| POST   | /register        | Register user           |
| POST   | /login           | Login user              |
| POST   | /upload          | Upload resume           |
| GET    | /candidates      | Get all candidates      |
| GET    | /candidates/{id} | Candidate details       |
| POST   | /semantic-search | AI semantic search      |
| POST   | /bulk-upload     | Upload multiple resumes |

---

# ⚙️ Environment Configuration

Create `.env` inside backend folder:

```
SECRET_KEY=your-secret-key
ALGORITHM=HS256

DATABASE_URL=postgresql://user:password@localhost/resume_db
```

---

# 🐳 Docker Deployment

Build and run:

```bash
docker-compose build
docker-compose up -d
```

---

# 📦 Production Deployment

Backend:

```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

Frontend:

```bash
npm run build
```

Serve dist folder using nginx.

---

# 🧪 Testing

Backend:

```bash
pytest
```

Frontend:

```bash
npm test
```

---

# 🔧 Troubleshooting

## Common Issues

### Model not responding

Run:

```bash
ollama run mistral
```

---

### Token issues

Clear browser storage and login again.

---

### Database issues

Delete database and restart backend.

---

# 🔮 Future Improvements

* Vector Database (FAISS / Chroma)
* Resume embeddings
* Multi-job matching
* Kubernetes deployment
* Multi-agent hiring system

---



