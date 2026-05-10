# 🚀 CVForge: AI-Powered Resume Intelligence

![CVForge Homepage](./public/homepage.png)

**CVForge** is a state-of-the-art Resume Analyzer and ATS (Applicant Tracking System) simulation platform. Built for modern job seekers, it leverages Google's Gemini AI to provide deep semantic insights into your resume, helping you bridge the gap between your experience and your dream job.

---

## ✨ Key Features

### 📊 Precision ATS Scoring
Get an instant, data-driven score out of 100 based on simulated ATS algorithms. Understand exactly how a machine sees your resume before it ever reaches a human recruiter.

### 🧠 Semantic Analysis via Gemini AI
Unlike basic keyword scanners, CVForge uses **Google Gemini** to perform deep semantic analysis. It understands your professional narrative, the impact of your achievements, and the nuance of your experience.

### 🎯 Skill Gap Detection
CVForge identifies technical and soft skills commonly found in your target roles that are missing from your profile, providing a roadmap for upskilling.

### ✍️ AI-Driven Tailored Drafts
Receive a fully reformatted, ATS-optimized version of your resume draft. Edit it in real-time with our custom-built editor and export it directly to PDF.

### 🔒 Privacy-First Architecture
Your data is yours. CVForge processes all documents in-memory on a secure backend. No resumes are ever stored in databases or persistent storage.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Framer Motion
- **UI Components**: Radix UI (ScrollArea, Separator), Lucide React
- **Backend**: Node.js, Express, Multer
- **AI Engine**: Google Gemini API (via OpenRouter)
- **PDF Processing**: `pdf-parse` (TypeScript Edition)
- **Export**: jsPDF

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22.x or later
- An OpenRouter or Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Nivethith-AK/CVForge.git
   cd CVForge
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   PORT=3001
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Launch Development Server:**
   ```bash
   npm run dev
   ```

5. **Open the App:**
   Navigate to [http://localhost:3001](http://localhost:3001) in your browser.

---

## 📂 Project Structure

- `src/components/` - High-performance UI components.
- `src/services/` - Gemini AI streaming integration.
- `src/hooks/` - Custom React hooks for PDF handling.
- `server.ts` - Express server with Vite middleware integration.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Built with ❤️ by Nivethith-AK.
