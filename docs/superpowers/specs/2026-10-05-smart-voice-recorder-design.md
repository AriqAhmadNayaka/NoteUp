# Design Spec: NoteUp — Smart Voice Recorder & AI Notes

- **Date:** 2026-10-05
- **Status:** Approved Draft
- **Target Platform:** Responsive Web App (Desktop & Mobile PWA)
- **Primary Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide React, IndexedDB (Offline Storage), 9router Gateway (Cloud AI API)

---

## 1. Overview & Vision
NoteUp adalah aplikasi perekam suara cerdas personal yang terinspirasi oleh PLAUD Note Pro. Aplikasi ini menggabungkan perekaman audio lokal, fleksibilitas upload file audio/teks, pemisahan pembicara (diarization), perangkuman multi-dimensi berbasis template, mind map interaktif dengan kompatibilitas ekspor Obsidian/Markdown, serta asisten tanya-jawab interaktif ("Ask NoteUp").

Pengembangan dilakukan dengan filosofi **Frontend-First**: membangun UI/UX interaktif responsif lengkap dengan mock data dan state offline sebelum mengintegrasikan backend endpoint dan panggilan API ke 9router.

---

## 2. Core Functional Requirements

### 2.1 Studio (Live Recording & Multimodal Input)
1. **Audio Recording (Web Audio & MediaRecorder API):**
   - Mendukung format web audio standar (`audio/webm`, `audio/mp4`).
   - Waveform audio visualizer dinamis saat merekam.
   - Kontrol Pause, Resume, Stop, dan Cancel.
2. **Marker & Quick Memo (Timestamped):**
   - Tombol "Highlight / Pin" untuk menandai detik waktu penting secara instan.
   - Textbox input memo instan dan upload lampiran foto saat rekaman sedang berjalan.
3. **Audio & Text Upload Mode:**
   - Dropzone file audio (`.mp3`, `.m4a`, `.wav`, `.aac`).
   - Text upload/paste input untuk langsung memproses dan merangkum transkrip mentah dari luar.
4. **Offline Resilience:**
   - Audio dan memo disimpan langsung ke IndexedDB lokal perangkat secara instan saat perekaman selesai.
   - Label status file: `draft_offline`, `ready_to_process`, `processing`, `completed`, `error`.

### 2.2 Processing & 9router Gateway
1. **Speech-to-Text & Diarization:**
   - Transkripsi multi-bahasa dengan pembagian segmen pembicara: `{ speaker: string, start: number, end: number, text: string }`.
2. **Multi-Dimensional AI Summary:**
   - Template sistem: Notulen Rapat, Kuliah / Perkuliahan, Brainstorming / Ide, Catatan Personal / Harian.
   - Ekstraksi otomatis **Action Items** (checklist tugas) dan **Key Decisions**.
3. **Mind Map Generator:**
   - Menghasilkan struktur pohon topik dalam format Markdown outline dan diagram Mermaid.
4. **Ask NoteUp (Interactive Q&A Assistant):**
   - Dialog chat interaktif berbasis konteks transkrip audio yang sedang dibuka.
   - Kutipan referensi detik audio (*timestamp citations*).

### 2.3 Workspace & Note Viewer (Frontend Experience)
1. **Karaoke Mode Audio-Transcript Sync:**
   - Bar pemutar audio terpadu dengan scrubber dan pengaturan kecepatan playback (1x, 1.25x, 1.5x, 2x).
   - Klik segmen transkrip langsung melompatkan pemutaran audio ke detik tersebut.
   - Segmen transkrip yang sedang diputar ditandai dengan highlight aktif.
2. **Interactive Mind Map Canvas:**
   - Tampilan visual interaktif berbasis pohon topik (Markmap / SVG Tree) dengan zoom dan collapse node.
   - Tombol copy cepat: "Copy as Mermaid" dan "Copy as Markdown" untuk integrasi ke Obsidian.
3. **Action Items Checklist:**
   - Checklist interaktif untuk menandai to-do list yang sudah diselesaikan.
4. **Export Options:**
   - Ekspor lengkap ke format Markdown (`.md`) terstruktur dengan frontmatter YAML.

---

## 3. Architecture & Data Flow

```
[Client: Desktop / Mobile Browser PWA]
  │
  ├── Local State & Audio Blob Storage (IndexedDB / Dexie)
  │     ├── Draft Audio Recordings (Offline-safe)
  │     ├── Uploaded Audio / Text Files
  │     └── Cached Transcripts & Notes
  │
  ├── UI Components (Next.js Client Components)
  │     ├── Studio: Live Recorder, Waveform Visualizer, Uploader
  │     ├── Note Workspace: Synchronized Transcript, Mind Map Viewer, Chat Panel
  │     └── Library: Note Lists, Filter by Tags & Templates
  │
  └── [Next.js API Layer] (/api/transcribe, /api/summarize, /api/chat)
        │
        └──► [9router Local Gateway] (OpenAI Compatible Endpoint)
              ├── Audio Transcription & Diarization
              └── LLM Processing (Gemini Flash / Groq via 9router)
```

---

## 4. Phased Implementation Roadmap

### Fase 1: Frontend UI & Interactive Mock Engine (Prioritas Pertama)
- Inisialisasi project Next.js 14+ dengan Tailwind CSS dan Lucide Icons.
- Implementasi sistem navigasi responsive (Bottom bar mobile & Sidebar desktop).
- Pembuatan layar **Studio** (Audio recorder UI dengan waveform mock/real, marker momen, dan tab uploader).
- Pembuatan layar **Note Workspace**:
  - Audio Player dengan click-to-sync transcript.
  - Interactive Mind Map viewer dengan toggle copy Mermaid/Markdown.
  - Ringkasan template & action items checklist.
  - Chat panel "Ask NoteUp".
- Penyimpanan client-side dengan IndexedDB / LocalStorage agar seluruh alur dapat diuji coba langsung di browser (Mobile & Desktop).

### Fase 2: 9router Backend Integration
- Konfigurasi environment endpoint 9router.
- Pembuatan API routes untuk audio upload handler, speech-to-text diarization, dan prompt summarization.
- Penggantian mock processing di frontend dengan real API calls ke Next.js backend.
- Pengujian end-to-end: rekam di HP -> proses via 9router -> lihat hasil rangkuman dan mind map.

---

## 5. Error Handling & Edge Cases
- **Koneksi Terputus saat Merekam:** Audio blob tetap aman tersimpan di IndexedDB browser perangkat.
- **Kegagalan API LLM:** Jika perangkuman gagal, transkrip mentah tetap tersimpan dan pengguna dapat menekan tombol "Retry Summarize" tanpa mengulang transkripsi.
- **File Audio Ukuran Besar:** Dukungan chunking audio atau kompresi sebelum dikirim ke endpoint.
