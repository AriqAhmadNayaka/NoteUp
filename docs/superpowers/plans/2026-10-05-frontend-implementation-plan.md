# Implementation Plan: NoteUp Frontend-First (Phase 1)

**Goal:** Build a complete, responsive, and functional frontend for NoteUp (Web & Mobile PWA) with mock engine, live MediaRecorder, interactive transcript audio sync, mind map visualizer, and Ask NoteUp chat assistant.

---

## Task Breakdown

### 1. Project Initialization & Tooling
- Initialize Next.js (App Router, TypeScript, Tailwind CSS, ESLint).
- Install icons & utility dependencies: `lucide-react`, `clsx`, `tailwind-merge`, `idb-keyval` (for lightweight IndexedDB offline storage), `canvas-confetti` (for interactive delight).
- Set up global color scheme, typography, and PWA manifest configurations.

### 2. Layout & Responsive Shell
- Responsive layout container:
  - **Desktop:** Left navigation sidebar (Studio, Library, Settings), clean header, breadcrumbs.
  - **Mobile:** Fixed bottom navigation bar with quick "+ Record" floating action button.
- Global theme and status bar.

### 3. Studio Screen (Recording & Upload)
- **Live Recorder Mode:**
  - Real browser `MediaRecorder` integration with microphone permission handling.
  - Dynamic audio visualizer canvas displaying real-time audio waveforms.
  - Live timer, Pause, Resume, Stop, and Discard controls.
  - Moment Marker (Pin icon) that records timestamped tags during live audio.
  - Live Quick Memo input field and photo attachment simulation.
- **Upload Mode (Audio & Text):**
  - Audio drag-and-drop dropzone supporting `.mp3`, `.m4a`, `.wav`, `.aac`, `.webm`.
  - Text input tab for pasting raw lecture/meeting notes to directly summarize.
- **Mock Processing State:**
  - Realistic progress bar (`Transcribing...` -> `Separating Speakers...` -> `Generating Mind Map...`).
  - Saves completed recordings into local IndexedDB storage.

### 4. Note Workspace Screen (The Heart of NoteUp)
- **Audio Sync Header:**
  - Continuous audio player with waveform timeline, playback speed (0.75x, 1x, 1.25x, 1.5x, 2x), and skip +/- 5s.
- **Interactive Transcript (Karaoke Sync):**
  - Speaker labels with editable names (`Speaker 1: Prof. Budi`, `Speaker 2: Ariq`).
  - Click-to-play: clicking any sentence immediately jumps audio playback to its timestamp.
  - Highlight current sentence matching playback audio time.
  - Timestamp markers from recording show up as highlighted pins.
- **Multi-Dimensional Summary & Action Items:**
  - Template selector (Meeting Notes, College Lecture, Brainstorming, Daily Journal).
  - Key discussion points and summary cards.
  - Interactive Action Items checklist (allows checking off tasks).
- **Interactive Mind Map Tab:**
  - Clean visual tree node structure for topics, subtopics, and key takeaways.
  - Zoom and toggle expand/collapse controls.
  - "Copy Mermaid" and "Copy Markdown" buttons for direct Obsidian paste.
- **Ask NoteUp (Interactive Q&A Assistant):**
  - Chat interface contextualized to the current note.
  - Pre-suggested quick prompt chips (e.g., "Apa saja tugas utama?", "Rangkum dalam 3 kalimat", "Siapa yang menyetujui budget?").
  - Simulated streaming reply with timestamp citation tags that jump to the audio snippet.

### 5. Library Screen & Offline Storage
- List of recorded notes with search bar, tag filters, and duration/date indicators.
- Offline badge for notes stored locally in IndexedDB.
- Pre-loaded rich sample notes (e.g. "Rapat Pleno BPM 2026", "Kuliah Smart City & IoT") so user can immediately test all features without needing to record first.

### 6. Verification & Mobile Responsiveness
- Test layout on desktop (1920x1080) and mobile viewport (iPhone/Android width 390px-412px).
- Verify audio recording, playback click-to-sync, and offline persistence.
