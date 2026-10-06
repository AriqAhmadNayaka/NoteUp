# NoteUp 🎙️✨

> **Smart Voice Recorder & AI Notes with Notion-like Elegance**  
> An open-source, local-first alternative to PLAUD Note Pro. Built with Next.js, Tailwind CSS, and powered by OpenAI-compatible AI Gateways (such as [9router](https://github.com)).

---

## 🌟 Key Features

- **🎙️ Real-time Audio Recording:** MediaRecorder with a clean, monochrome live waveform visualizer.
- **📌 Moment Markers & Live Memos:** Pin important timestamps and type instant notes while recording is in progress.
- **📁 Multimodal Upload:** Drag-and-drop external audio recordings (`.mp3`, `.m4a`, `.wav`, `.aac`) or paste raw lecture/meeting text notes.
- **🗣️ Speaker Labels & Diarization:** Identifies who is speaking and separates conversations per speaker.
- **🎧 Interactive Karaoke Audio-Sync:** Click any sentence in the transcript to jump audio playback to that exact second.
- **📋 Multi-Dimensional Summaries:** Categorized by meeting, lecture, brainstorming, or personal notes.
- **✅ Action Items & To-Dos:** Automatically extract tasks and assignees with interactive Notion-style square checkboxes.
- **🗺️ Interactive Mind Map:** Dynamic topic tree visualizer with direct **Copy to Mermaid** and **Markdown** buttons for seamless Obsidian integration.
- **💬 Ask NoteUp AI Assistant:** Context-aware Q&A chat with timestamp citations that jump straight into audio playback.
- **📱 PWA & Mobile-First:** Installable on Android & iOS homescreens as a standalone app with full touch and safe-area optimization.
- **🛡️ Local-First & Offline Resilient:** Saves recordings and state to browser IndexedDB storage before sending to the AI gateway.

---

## 🏗️ Tech Stack

- **Framework:** Next.js (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Notion Design System: warm neutrals, subtle borders, custom palette)
- **Storage:** Client-side IndexedDB (`idb-keyval`)
- **Visuals:** Markmap / Mermaid / Canvas Confetti / Lucide Icons
- **AI Backend Gateway:** OpenAI-compatible API endpoints (e.g. 9router with Gemini / Whisper / Llama)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+ or v20+)
- **npm** or **pnpm**
- An OpenAI-compatible gateway (e.g., [9router](https://github.com) or local Whisper/Ollama)

### 2. Installation

Clone this repository:
```bash
git clone https://github.com/your-username/NoteUp.git
cd NoteUp
```

Install dependencies:
```bash
npm install
```

Copy the environment file:
```bash
cp .env.example .env
```

Edit `.env` according to your gateway setup:
```env
ROUTER_BASE_URL=http://127.0.0.1:20128/v1
ROUTER_API_KEY=your_api_key_here
ROUTER_LLM_MODEL=ag/gemini-3.8-flash-medium
ROUTER_STT_MODEL=ag/gemini-3.8-flash-medium
PORT=3000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment

NoteUp is pre-configured for Docker with a lightweight multi-stage standalone build.

### Running with Docker Compose:

```bash
docker compose up -d --build
```

The app will be accessible at `http://localhost:3000`.

---

## 📱 Mobile Installation (PWA)

1. Open NoteUp in your mobile browser (Chrome / Brave / Safari).
2. Tap the browser menu (`⋮` or Share button).
3. Select **"Install App"** (or *"Add to Home Screen"* on iOS).
4. Launch NoteUp directly from your home screen as a standalone application.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
