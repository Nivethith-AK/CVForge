# ResumeAI - AI Resume Analyzer

An advanced, production-ready AI Resume Analyzer built for modern job seekers. Upload your resume, and let our ATS simulation and Gemini AI model analyze your strengths, weaknesses, missing skills, and provide actionable improvement strategies.

## ✨ Features

- **Instant Parsing**: Securely parses PDF resumes locally using an Express backend and `pdf-parse`.
- **AI-Powered Insights**: Integrates with Google's state-of-the-art **Gemini 3.1 Pro** API to perform deep semantic analysis.
- **ATS Compatibility Score**: Gives you a simulated ATS score out of 100.
- **Actionable Feedback**: Highlights key strengths, pinpoints weaknesses, identifies missing skills based on your industry, and offers concrete improvement suggestions.
- **Job Role Recommendations**: Recommends best-fit job roles based on your experience.
- **Beautiful Modern UI**: Built with React, Tailwind CSS, and Framer Motion. Features a dark SaaS aesthetic with glassmorphism, animated gradients, and circular progress indicators.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide React
- **Backend / Serve**: Express.js, Vite Middleware
- **AI / Parsing**: Google Gemini API (`@google/genai`), Multer (file upload), `pdf-parse`
- **Architecture**: Separated Frontend/Backend handling for secure file parsing before sending text safely to the client to query Gemini.

## 🚀 Getting Started

### Prerequisites
- Node.js 22.x or later
- Gemini API Key

### Installation

1. Copy `.env.example` to `.env` and add your Gemini API Key:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to include:*
   `GEMINI_API_KEY="your-gemini-api-key"`

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the application:
   ```bash
   npm run dev
   ```

## 📂 Folder Structure

- `/src/components/` - Reusable UI elements, including `Dashboard` and `UploadSection`.
- `/src/lib/` - Utilities such as the `cn` class merger.
- `/src/services/` - Contains `geminiService.ts` to handle asynchronous API calls.
- `/server.ts` - Express backend for memory-storage PDF parsing and Vite middleware.

## 🔒 Privacy

Resumes are processed entirely in memory on the backend (`multer.memoryStorage()`) and are not saved to any database. Extracted text is then transmitted securely directly to the Gemini API.

## 📄 License
MIT
