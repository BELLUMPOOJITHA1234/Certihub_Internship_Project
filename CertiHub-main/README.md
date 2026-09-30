<div align="center">
# CertiHub

**The Intelligent Credential Hub for the Modern Professional**

[![React](https://img.shields.io/badge/React-19.2.5-61DAFB?logo=react)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-5.2.1-000000?logo=express)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Groq AI](https://img.shields.io/badge/Groq_AI-Llama_3.3-8B5CF6)](https://groq.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-F68D1E?logo=cloudinary)](https://cloudinary.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

CertiHub transforms static professional certificates into a dynamic, strategic career engine. Leveraging **Multimodal AI** (Vision + LLM) to verify achievements, analyze skills, and plot personalized career roadmaps.

</div>

---
## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Key Features](#key-features)
- [Project Workflow](#project-workflow)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Problem Statement

Traditional professional certificates are **static, difficult to verify instantly, and disconnected from career growth**.

- **Recruitment Friction** — Recruiters struggle with manual data entry and lack real-time insights into a candidate's skill set.
- **Verification Lag** — Authenticating certificates requires manual handshake between institutions.
- **Data Silos** — Valuable professional data is trapped in images and PDFs, invisible to automated career planning tools.

## Solution Overview

CertiHub bridges the gap between visual credentials and career intelligence through an **AI-First ecosystem**.

- **Automated Extraction** — Using Llama-3.2 Vision to "read" certificates like a human with 95%+ accuracy.
- **Smart Issuance** — Automates institutional workflows, mapping visual certificates to employee records via AI name-matching.
- **Dynamic Insights** — Transforms static files into a real-time skills matrix and institutional analytics dashboard.
  
## Key Features

### Self-Healing AI Extraction

- **Dual-Engine Logic** — Uses Vision AI for layout parsing and OCR for text-heavy documents.
- **Auto-Heal** — Automatically triggers high-clarity re-analysis for "Unknown" data points.

### AI Smart Batch Issuance

- **Visual Mapping** — Upload a folder of certificates + a CSV; AI extracts names and maps recipients instantly.
- **Metadata Harvesting** — Automatically extracts titles, skills, and dates without manual input.

### Institutional Analytics Dashboard

- **Talent Heatmaps** — Public-facing charts showing skill distribution of an organization's workforce.
- **Issuance Ledger** — Anonymized, real-time public record of all credentials issued.

### AI Career Strategist

- **Market Readiness Matrix** — Analyzes expertise across Web Dev, AI, Cloud, and more.
- **Strategic Roadmap** — Step-by-step action plans to reach specific career milestones.

### Additional Features

- **Role-Based Access Control** — Multi-tier auth (Student, Mentor, HOD, Institution, Org Admin, Super Admin).
- **AI Chatbot** — In-app conversational assistant for certificate-related queries.
- **Dark/Light Theme** — Full theme support with persistent preference.
- **LinkedIn Post Generator** — One-click professional post creation from verified certificates.
- **Public Portfolio** — Shareable profile pages with verified credential history.

---

## Project Workflow

```
User uploads certificate (Image/PDF)
         │
         ▼
┌─────────────────────────┐
│   Cloudinary Storage    │  ← Secure asset upload
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Dual-Engine AI Analysis │
│  ┌───────────┬─────────┐ │
│  │ Vision AI │  OCR    │ │  ← Llama-3.2 Vision + Tesseract.js
│  └───────────┴─────────┘ │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Groq LLM Processing    │  ← Structured JSON extraction
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Firestore Persistence  │  ← Metadata stored with certificate
└────────┬────────────────┘
         │
         ▼
   ┌─────┴─────┐
   │           │
Student     Entity
Portfolio   Analytics Dashboard
```

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Tailwind CSS 3, Framer Motion, React Router 7, Lucide Icons |
| **Backend** | Node.js, Express 5, Multer |
| **Database & Auth** | Firebase (Firestore, Authentication, Admin SDK) |
| **AI Engine** | Groq Cloud — Llama 3.3 70B (text), Llama 3.2 90B Vision (images) |
| **OCR** | Tesseract.js 7, pdf-parse |
| **Asset Storage** | Cloudinary (signed URLs, on-the-fly transformations) |
| **DevOps** | Vercel (frontend), Render/GCP (backend), Jest + Supertest (testing) |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- A [Firebase](https://console.firebase.google.com/) project (Auth + Firestore enabled)
- A [Groq API](https://console.groq.com/) key
- A [Cloudinary](https://cloudinary.com/) account

### 1. Clone the Repository

```bash
git clone https://github.com/CertiHub/certihub.git
cd certihub
```

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
```

Place your `firebase-service-account.json` in the `server/` directory.

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Firebase config
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---
website link: https://certihub-taupe.vercel.app

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Required |
| :--- | :--- | :--- |
| `PORT` | Server port (default: `5000`) | Optional |
| `GROQ_API_KEY` | Groq API key for AI inference | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `FRONTEND_URL` | Frontend origin for CORS | Yes |
| `FIREBASE_SERVICE_ACCOUNT` | Stringified service account JSON (alt to file) | Optional |

### Frontend (`frontend/.env`)

| Variable | Description | Required |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `VITE_API_URL` | Backend API base URL (default: `http://localhost:5000`) | Yes |

---

## Project Structure

```
CertiHub/
├── frontend/
│   ├── src/
│   │   ├── pages/          # Route pages (Dashboard, Login, Portfolio, etc.)
│   │   ├── components/     # Reusable UI components (Navbar, ChatBot, ThemeToggle)
│   │   ├── firebase/       # Firebase client config
│   │   ├── styles/         # Global styles
│   │   └── App.jsx         # Root component with routing
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── controllers/        # Business logic (cert, career, admin, institution, etc.)
│   ├── routes/             # API route definitions
│   ├── middleware/          # Auth middleware (verifyToken, checkRole)
│   ├── utils/              # AI service, Cloudinary helpers
│   ├── tests/              # Jest + Supertest test suites
│   ├── server.js           # Express entry point
│   └── package.json
│
└── README.md
```

---

## API Endpoints

All authenticated endpoints require a `Bearer` token in the `Authorization` header.

### Certificate Management

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/analyze` | Student+ | Upload & analyze a certificate (multipart) |
| `POST` | `/api/re-analyze` | Student+ | Re-analyze a certificate with AI |
| `POST` | `/api/delete-file` | Student+ | Delete certificate from Cloudinary |

### Career & Social

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/career-advice` | Student+ | Get AI career roadmap from certificates |
| `POST` | `/api/generate-post` | Student+ | Generate LinkedIn post for a certificate |
| `POST` | `/api/chat` | Student+ | Chat with AI assistant |
| `GET` | `/api/share/:id` | Public | View shared certificate page |

### Institution Management

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/institution/create-hod` | Institution | Create HOD account |
| `GET` | `/api/institution/departments` | Institution+ | Get departments list |
| `POST` | `/api/institution/batch-issue` | Institution | Batch issue certificates (multipart) |

### HOD Routes

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/hod/create-mentor` | HOD | Create mentor account |
| `POST` | `/api/hod/link-student` | HOD | Link student to department |

### Mentor Routes

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/mentor/students` | Mentor | Get list of assigned students |
| `POST` | `/api/mentor/verify` | Mentor | Verify a student certificate |

### Organization Routes

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/organization/smart-batch-issue` | Org Admin | AI-powered batch issuance with CSV mapping |

### Admin

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin+ | Platform-wide analytics |

---

## Deployment

### Frontend — Vercel

```bash
cd frontend
npm run build
npx vercel --prod
```

The `vercel.json` is pre-configured with SPA rewrites for client-side routing.

### Backend — Render / Google Cloud Run

```bash
cd server
npm run build   # if using a build step
```

Ensure the following environment variables are set in your hosting provider:
- `GROQ_API_KEY`
- `CLOUDINARY_*` credentials
- `FRONTEND_URL` (your deployed Vercel URL)
- `FIREBASE_SERVICE_ACCOUNT` or place `firebase-service-account.json` at `/etc/secrets/` on Render.

### Production Checklist

- [ ] Firebase Security Rules configured for Firestore
- [ ] CORS origins updated in `server.js`
- [ ] Cloudinary signed URLs enabled
- [ ] Admin email bootstrapped: `admin@certihub.com`

---

## Testing

```bash
cd server
npm test
```

Tests are built with **Jest** and **Supertest** for API endpoint validation.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Built with care by the **CertiHub** team

</div>
