# 🚀 CVForge: AI-Powered Resume Intelligence

<div align="center">

![CVForge Homepage](./public/homepage.png)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-blue.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini_Pro-purple.svg)](https://ai.google.dev/)

**Stop guessing, start tailoring.** CVForge is a state-of-the-art Resume Analyzer and ATS simulation platform that leverages Google's Gemini AI to bridge the gap between your professional experience and your dream job.

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Workflow](#-how-it-works)

</div>

---

## ✨ Key Features

### 📊 Precision ATS Scoring
Gain an instant, data-driven score out of 100. Our algorithms simulate modern Applicant Tracking Systems, showing you exactly how machines see your profile.

### 🧠 Semantic Intelligence
Powered by **Google Gemini**, CVForge performs deep semantic analysis. It goes beyond simple keywords to understand the *narrative impact* and *quantifiable achievements* of your career.

### 🎯 Skill Gap Detection
Identify the "missing pieces." CVForge compares your resume against industry standards for your target roles and provides a concrete roadmap for upskilling.

### ✍️ Live AI Tailored Editor
Receive a reformatted, ATS-optimized version of your experience. Use our integrated **Radix UI** editor to make final polishes and export directly to a professional PDF.

### 🔒 Privacy-First
Your documents are processed entirely in-memory using secure Node.js buffers. No resumes are ever stored, logged, or shared.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| **UI/UX** | Radix UI (ScrollArea, Separator), Lucide Icons |
| **Backend** | Node.js, Express, Multer (Memory Storage) |
| **AI Engine** | Google Gemini API (via OpenRouter) |
| **Parsing** | `pdf-parse` (TypeScript) |
| **PDF Export** | jsPDF |

---

## 🔄 How It Works

1.  **Upload**: Securely drop your PDF resume into the dropzone.
2.  **Parse**: The Node.js backend extracts raw text using high-fidelity parsing.
3.  **Analyze**: Gemini AI performs a multi-stage analysis (ATS Score, Strengths, Weaknesses).
4.  **Tailor**: The system generates an optimized "Draft" version of your resume.
5.  **Polish**: Edit the draft in our custom editor and download your new PDF.

---

## 🚀 Getting Started

### Prerequisites
- Node.js **22.x** or later
- An **OpenRouter** API Key (Gemini 1.5/2.0 Models)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Nivethith-AK/CVForge.git
   cd CVForge
   ```

2. **Environment Setup:**
   Create a `.env` file in the root:
   ```env
   OPENROUTER_API_KEY="your_openrouter_key_here"
   PORT=3001
   ```

3. **Deploy:**
   ```bash
   npm install
   ```

4. **Launch:**
   ```bash
   npm run dev
   ```

### E2E Testing (Playwright)

Run against production (default):

```bash
npm run test:e2e
```

Run against a specific deployment:

```bash
E2E_BASE_URL="https://your-deployment.vercel.app" npm run test:e2e
```

---

## 📂 Project Structure

```text
├── src/
│   ├── components/  # Atomic & Layout components
│   ├── hooks/       # Logic for PDF uploads & streaming
│   ├── services/    # Gemini AI API integration
│   └── lib/         # Shared utilities (cn, etc.)
├── public/          # Static assets & screenshots
├── server.ts        # Express API & Vite Middleware
└── README.md        # You are here!
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Built with ❤️ by **Nivethith-AK**

[GitHub](https://github.com/Nivethith-AK) • [LinkedIn](https://linkedin.com/in/your-profile)

</div>
