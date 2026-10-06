'use client';

import React, { useState, useRef } from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  Bookmark,
  Upload,
  FileText,
  FileAudio,
  Trash2,
  Sparkles,
  Loader2,
  Info,
} from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import { Marker, NoteCategory, NoteItem } from '@/types/note';
import { saveNote } from '@/lib/storage';
import { getClientSettings } from '@/lib/settings';

interface StudioViewProps {
  onNoteCreated: (note: NoteItem) => void;
}

type StudioTab = 'record' | 'upload_audio' | 'paste_text';

export const StudioView: React.FC<StudioViewProps> = ({ onNoteCreated }) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('record');
  const [category, setCategory] = useState<NoteCategory>('meeting');
  const [title, setTitle] = useState('');

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [quickMemo, setQuickMemo] = useState('');
  const [memos, setMemos] = useState<Array<{ id: string; time: number; content: string }>>([]);

  // Audio Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState(0);

  // Uploaded Files State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawTextContent, setRawTextContent] = useState('');

  // Audio Context & MediaRecorder Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Canvas visualizer loop in Notion charcoal minimalist style
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / (bufferLength / 2)) * 2.2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength / 2; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.82;

        // Clean Notion charcoal bar color
        ctx.fillStyle = '#37352f';
        ctx.fillRect(x, canvas.height - barHeight, Math.max(1, barWidth - 1.5), barHeight);

        x += barWidth;
      }
    };
    render();
  };

  // Start Live Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup audio analyzer for waveform
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setIsPaused(false);
      setRecordSeconds(0);
      setMarkers([]);
      setMemos([]);

      drawWaveform();

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Gagal mengakses mikrofon. Pastikan izin mikrofon telah diberikan pada browser.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const addMarker = () => {
    const newMarker: Marker = {
      id: `m-${Date.now()}`,
      time: recordSeconds,
      label: `Momen Penting #${markers.length + 1}`,
    };
    setMarkers((prev) => [...prev, newMarker]);
  };

  const addQuickMemo = () => {
    if (!quickMemo.trim()) return;
    setMemos((prev) => [
      ...prev,
      {
        id: `memo-${Date.now()}`,
        time: recordSeconds,
        content: quickMemo.trim(),
      },
    ]);
    setQuickMemo('');
  };

  const stopRecordingAndProcess = () => {
    if (!mediaRecorderRef.current) return;

    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());

    setIsRecording(false);
    setIsPaused(false);

    setTimeout(() => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioBlobUrl = URL.createObjectURL(audioBlob);
      processNewNote({
        sourceTitle: title || `Rekaman Suara ${new Date().toLocaleDateString('id-ID')}`,
        duration: recordSeconds,
        audioBlob,
        audioBlobUrl,
        markersList: markers,
        memosList: memos,
      });
    }, 300);
  };

  const discardRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordSeconds(0);
    setMarkers([]);
    setMemos([]);
  };

  // Process and generate note pipeline with real 9router API integration
  const processNewNote = async ({
    sourceTitle,
    duration,
    audioBlob,
    audioBlobUrl,
    markersList,
    memosList,
    uploadedContent,
  }: {
    sourceTitle: string;
    duration: number;
    audioBlob?: Blob;
    audioBlobUrl?: string;
    markersList?: Marker[];
    memosList?: Array<{ id: string; time: number; content: string }>;
    uploadedContent?: string;
  }) => {
    const settings = getClientSettings();
    setIsProcessing(true);
    setProcessingProgress(15);
    setProcessingStep('Menyimpan rekaman ke penyimpanan IndexedDB lokal...');

    let transcribedText = uploadedContent || '';

    // Step 1: If there is an audioBlob and no pre-transcribed text, transcribe with 9router
    if (audioBlob && !transcribedText) {
      setProcessingProgress(35);
      setProcessingStep('Menghubungkan ke 9router: Transkripsi Speech-to-Text...');
      try {
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');
        formData.append('baseUrl', settings.baseUrl);
        formData.append('apiKey', settings.apiKey);
        formData.append('model', settings.sttModel);
        formData.append('glossary', settings.glossary);
        formData.append('language', 'id');

        const transRes = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (transRes.ok) {
          const transData = await transRes.json();
          if (transData.ok && transData.text) {
            transcribedText = transData.text;
          }
        }
      } catch (sttErr) {
        console.warn('STT API call error, using local fallback:', sttErr);
      }
    }

    // Step 2: Call 9router LLM summarizer for multi-dimensional extraction
    setProcessingProgress(65);
    setProcessingStep('Menganalisis konten, pembicara, action items, & Mind Map via 9router...');

    let aiData: any = null;
    try {
      const sumRes = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sourceTitle,
          content:
            transcribedText ||
            `Rekaman audio ${sourceTitle} berdurasi ${duration} detik membahas tindak lanjut agenda dan target kerja.`,
          category,
          glossary: settings.glossary,
          baseUrl: settings.baseUrl,
          apiKey: settings.apiKey,
          model: settings.llmModel,
          duration: Math.max(duration, 30),
        }),
      });

      if (sumRes.ok) {
        const sumResult = await sumRes.json();
        if (sumResult.ok && sumResult.data) {
          aiData = sumResult.data;
        }
      }
    } catch (sumErr) {
      console.warn('Summarize API call error, using local fallback:', sumErr);
    }

    setProcessingProgress(90);
    setProcessingStep('Finalisasi visual Mind Map & sinkronisasi karaoke...');

    await new Promise((r) => setTimeout(r, 300));
    setProcessingProgress(100);

    // If 9router returned structured data, use it; otherwise provide honest offline draft
    const isAiSuccess = !!(aiData && (aiData.summary || aiData.overview));

    const finalSpeakers =
      isAiSuccess && aiData?.speakers && Array.isArray(aiData.speakers) && aiData.speakers.length > 0
        ? aiData.speakers
        : [
            { id: 'spk-1', name: 'Pembicara 1', color: '#286b97' },
          ];

    const finalSegments =
      isAiSuccess && aiData?.segments && Array.isArray(aiData.segments) && aiData.segments.length > 0
        ? aiData.segments
        : transcribedText
        ? [
            {
              id: 'seg-1',
              speakerId: 'spk-1',
              start: 0,
              end: Math.max(duration, 30),
              text: transcribedText,
            },
          ]
        : [
            {
              id: 'seg-offline',
              speakerId: 'spk-1',
              start: 0,
              end: Math.max(duration, 10),
              text: 'Audio rekaman tersimpan secara lokal. 9router sedang offline saat rekaman disimpan. Klik tombol "⚡ Proses Ulang dengan 9router" di atas untuk mentranskripsi dan merangkum suara ini.',
            },
          ];

    const finalSummary = isAiSuccess
      ? aiData.summary || {
          overview: aiData.overview || '',
          keyPoints: aiData.keyPoints || [],
          decisions: aiData.decisions || [],
          actionItems: aiData.actionItems || [],
        }
      : {
          overview:
            'Catatan ini tersimpan secara lokal saat gateway 9router offline. Audio rekaman aslimu aman dan bisa diputar. Silakan jalankan 9router di terminal, lalu klik tombol "⚡ Proses Ulang dengan 9router" di atas untuk mengekstrak transkrip, ringkasan, dan Mind Map.',
          keyPoints: [
            'Audio rekaman tersimpan aman di browser (IndexedDB).',
            'Menunggu koneksi ke 9router (port 20128) untuk proses transkripsi AI.',
          ],
          decisions: [],
          actionItems: [],
        };

    const finalMindmap = isAiSuccess && aiData?.mindmap
      ? aiData.mindmap
      : {
          markdown: `# ${sourceTitle}\n## Belum Diproses\n- Nyalakan 9router (port 20128)\n- Klik Proses Ulang untuk membuat Mind Map`,
          mermaid: `mindmap\n  root((${sourceTitle}))\n    Belum Diproses\n      Nyalakan 9router\n      Klik Proses Ulang`,
          rootNode: {
            id: 'root-offline',
            label: sourceTitle,
            children: [{ id: 'c1', label: 'Belum Diproses (Offline)' }],
          },
        };

    const generatedNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: sourceTitle,
      createdAt: new Date().toISOString(),
      duration: Math.max(duration, 15),
      category: category,
      tags: [
        category === 'meeting' ? 'Rapat' : category === 'lecture' ? 'Kuliah' : 'Catatan',
        isAiSuccess ? '9router AI' : 'Belum Diproses (Offline)',
      ],
      status: isAiSuccess ? 'completed' : 'draft',
      audioBlob,
      audioBlobUrl,
      markers: markersList || [],
      memos: memosList || [],
      speakers: finalSpeakers,
      segments: finalSegments,
      summary: finalSummary,
      mindmap: finalMindmap,
      chatHistory: [
        {
          id: `chat-${Date.now()}`,
          role: 'assistant',
          text: isAiSuccess
            ? `Halo! Saya sudah selesai memproses dan merangkum rekaman **${sourceTitle}**. Ada hal spesifik yang ingin kamu tanyakan mengenai isi rekaman ini?`
            : `Rekaman suara **${sourceTitle}** tersimpan aman. Begitu 9router aktif, klik tombol "⚡ Proses Ulang dengan 9router" agar saya bisa mentranskripsi dan menjawab pertanyaanmu!`,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    await saveNote(generatedNote);
    setIsProcessing(false);
    onNoteCreated(generatedNote);
  };

  const getAudioFileDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      try {
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(file);
        audio.src = objectUrl;

        audio.onloadedmetadata = () => {
          const dur = Math.round(audio.duration);
          URL.revokeObjectURL(objectUrl);
          if (dur && !isNaN(dur) && isFinite(dur)) {
            resolve(dur);
          } else {
            resolve(120);
          }
        };

        audio.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(120);
        };
      } catch {
        resolve(120);
      }
    });
  };

  const handleUploadAudioProcess = async () => {
    if (!uploadedFile) return;
    const url = URL.createObjectURL(uploadedFile);
    const actualDuration = await getAudioFileDuration(uploadedFile);

    processNewNote({
      sourceTitle: title || uploadedFile.name.replace(/\.[^/.]+$/, ''),
      duration: actualDuration,
      audioBlob: uploadedFile,
      audioBlobUrl: url,
    });
  };

  const handlePasteTextProcess = () => {
    if (!rawTextContent.trim()) return;
    processNewNote({
      sourceTitle: title || `Catatan Teks ${new Date().toLocaleDateString('id-ID')}`,
      duration: 60,
      uploadedContent: rawTextContent.trim(),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Notion Document Header */}
      <div className="space-y-2">
        <div className="text-3xl select-none">🎙️</div>
        <div className="border-b border-[#e7e7e5] pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#37352f] tracking-tight">
            Studio Rekaman & Audio AI
          </h1>
          <p className="text-sm text-[#787774] mt-1">
            Rekam langsung suara secara realtime atau unggah berkas audio/transkrip untuk dianalisis oleh AI.
          </p>
        </div>
      </div>

      {/* Notion Callout Box */}
      <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#f7f6f3] border border-[#e7e7e5] text-xs text-[#37352f] leading-relaxed">
        <span className="text-base select-none">💡</span>
        <div>
          <span className="font-semibold text-[#37352f]">IndexedDB Local-First:</span> Semua audio disimpan di peramban kamu. Transkripsi diarahkan ke gateway 9router lokal tanpa risiko kebocoran data audio.
        </div>
      </div>

      {/* Notion View Tabs */}
      <div className="flex items-center gap-1 border-b border-[#e7e7e5] pb-0.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('record')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
            activeTab === 'record'
              ? 'border-[#37352f] text-[#37352f] font-semibold'
              : 'border-transparent text-[#787774] hover:text-[#37352f] hover:bg-[rgba(55,53,47,0.04)] rounded-t'
          )}
        >
          <Mic className="h-3.5 w-3.5" />
          <span>Rekam Suara Langsung</span>
        </button>

        <button
          onClick={() => setActiveTab('upload_audio')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
            activeTab === 'upload_audio'
              ? 'border-[#37352f] text-[#37352f] font-semibold'
              : 'border-transparent text-[#787774] hover:text-[#37352f] hover:bg-[rgba(55,53,47,0.04)] rounded-t'
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Unggah Berkas Audio</span>
        </button>

        <button
          onClick={() => setActiveTab('paste_text')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
            activeTab === 'paste_text'
              ? 'border-[#37352f] text-[#37352f] font-semibold'
              : 'border-transparent text-[#787774] hover:text-[#37352f] hover:bg-[rgba(55,53,47,0.04)] rounded-t'
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Tempel Teks Transkrip</span>
        </button>
      </div>

      {/* Meta Input: Judul & Kategori Template */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-[#f7f6f3]/60 border border-[#e7e7e5]">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-[#787774] mb-1">
            Judul Catatan / Sesi
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Rapat Pleno Evaluasi Proker / Kuliah Sistem Cerdas"
            className="w-full px-3 py-1.5 rounded-md bg-white border border-[#e7e7e5] text-xs sm:text-sm text-[#37352f] placeholder-[#9b9a97] focus:outline-none focus:border-[#2383e2]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#787774] mb-1">
            Format Ringkasan
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as NoteCategory)}
            className="w-full px-3 py-1.5 rounded-md bg-white border border-[#e7e7e5] text-xs sm:text-sm text-[#37352f] focus:outline-none focus:border-[#2383e2]"
          >
            <option value="meeting">📋 Notulen Rapat Formal</option>
            <option value="lecture">🎓 Kuliah & Pembelajaran</option>
            <option value="brainstorm">💡 Brainstorming & Ide</option>
            <option value="personal">📔 Jurnal Personal</option>
          </select>
        </div>
      </div>

      {/* Processing State Overlay */}
      {isProcessing && (
        <div className="rounded-lg border border-[#e7e7e5] bg-[#f7f6f3] p-8 text-center space-y-4 shadow-xs">
          <div className="h-12 w-12 mx-auto rounded-full bg-white border border-[#e7e7e5] flex items-center justify-center shadow-xs">
            <Loader2 className="h-6 w-6 text-[#2383e2] animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#37352f]">
              Sedang Memproses dengan AI (9router)
            </h3>
            <p className="text-xs text-[#787774] mt-1">{processingStep}</p>
          </div>
          <div className="w-full max-w-sm mx-auto bg-[#e7e7e5] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#2383e2] h-full transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* TAB 1: LIVE RECORDING */}
      {!isProcessing && activeTab === 'record' && (
        <div className="rounded-lg border border-[#e7e7e5] bg-white p-6 space-y-5 shadow-xs">
          {/* Waveform Canvas Area */}
          <div className="relative h-28 w-full bg-[#f7f6f3] rounded-md overflow-hidden border border-[#e7e7e5] flex flex-col items-center justify-center">
            <canvas ref={canvasRef} width={600} height={110} className="w-full h-full" />
            {!isRecording && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#787774] bg-[#f7f6f3]/80">
                <Mic className="h-6 w-6 text-[#9b9a97] mb-1.5" />
                <span className="text-xs">Mikrofon siap. Klik tombol di bawah untuk mulai merekam.</span>
              </div>
            )}
            {isRecording && (
              <div className="absolute top-2.5 left-3 flex items-center gap-1.5 bg-white/90 px-2 py-0.5 rounded border border-[#e7e7e5]">
                <span className="h-2 w-2 rounded-full bg-[#eb5757] animate-pulse" />
                <span className="text-[11px] font-mono font-medium text-[#eb5757]">
                  {isPaused ? 'TERJEDA' : 'MEREKAM LANGSUNG'}
                </span>
              </div>
            )}
            <div className="absolute bottom-2.5 right-3 font-mono font-bold text-base text-[#37352f] bg-white/90 px-2 py-0.5 rounded border border-[#e7e7e5]">
              {formatTime(recordSeconds)}
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-5 py-2 rounded-md bg-[#eb5757] hover:bg-[#d44c47] text-white font-medium text-xs shadow-xs transition-colors"
              >
                <Mic className="h-4 w-4" />
                <span>Mulai Merekam</span>
              </button>
            ) : (
              <>
                <button
                  onClick={pauseRecording}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#f7f6f3] text-[#37352f] font-medium text-xs border border-[#e7e7e5] transition-colors"
                >
                  {isPaused ? <Play className="h-3.5 w-3.5 text-[#2b6e4f]" /> : <Pause className="h-3.5 w-3.5" />}
                  <span>{isPaused ? 'Lanjutkan' : 'Jeda'}</span>
                </button>

                <button
                  onClick={addMarker}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#fbf3db] hover:bg-[#f4e3b5] text-[#89632a] font-medium text-xs border border-[#f4e3b5] transition-colors"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>Tandai Momen ({markers.length})</span>
                </button>

                <button
                  onClick={stopRecordingAndProcess}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#2383e2] hover:bg-[#1a73ca] text-white font-medium text-xs shadow-xs transition-colors"
                >
                  <Square className="h-3.5 w-3.5 fill-white" />
                  <span>Selesai & Proses AI</span>
                </button>

                <button
                  onClick={discardRecording}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs text-[#eb5757] hover:bg-[#fbebee] transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Batal</span>
                </button>
              </>
            )}
          </div>

          {/* Quick Memo Input during Live Recording */}
          {isRecording && (
            <div className="border-t border-[#e7e7e5] pt-4 space-y-2.5">
              <label className="text-xs font-medium text-[#787774] flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#37352f]" />
                <span>Ketik Catatan Cepat / Memo saat Rapat Berlangsung:</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickMemo}
                  onChange={(e) => setQuickMemo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addQuickMemo()}
                  placeholder="Ketik catatan instan (otomatis disematkan pada detik berjalan)..."
                  className="flex-1 px-3 py-1.5 rounded-md bg-[#f7f6f3] border border-[#e7e7e5] text-xs text-[#37352f] placeholder-[#9b9a97] focus:outline-none focus:border-[#2383e2]"
                />
                <button
                  onClick={addQuickMemo}
                  className="px-3 py-1.5 bg-[#37352f] hover:bg-[#202020] text-white text-xs font-medium rounded-md transition-colors"
                >
                  Simpan Memo
                </button>
              </div>

              {/* Memo & Markers List */}
              {(markers.length > 0 || memos.length > 0) && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {markers.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#fbf3db] text-[#89632a] border border-[#f4e3b5]"
                    >
                      <Bookmark className="h-3 w-3" />
                      {formatTime(m.time)}: {m.label}
                    </span>
                  ))}
                  {memos.map((memo) => (
                    <span
                      key={memo.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-[#edf5fa] text-[#286b97] border border-[#d3e5f3]"
                    >
                      <span className="font-mono text-[#286b97]">[{formatTime(memo.time)}]</span>
                      <span>{memo.content}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UPLOAD AUDIO FILE */}
      {!isProcessing && activeTab === 'upload_audio' && (
        <div className="rounded-lg border border-[#e7e7e5] bg-white p-8 space-y-6 text-center shadow-xs">
          <div className="max-w-md mx-auto border-2 border-dashed border-[#d3d2cf] hover:border-[#2383e2] rounded-lg p-8 transition-colors flex flex-col items-center justify-center cursor-pointer relative bg-[#f7f6f3]/60">
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.webm"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setUploadedFile(e.target.files[0]);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <FileAudio className="h-10 w-10 text-[#787774] mb-2" />
            <p className="text-sm font-semibold text-[#37352f]">
              {uploadedFile ? uploadedFile.name : 'Pilih atau Tarik Berkas Audio ke Sini'}
            </p>
            <p className="text-xs text-[#787774] mt-1">
              Mendukung MP3, M4A, WAV, AAC, atau WebM rekaman HP (Maks. 100MB)
            </p>
            {uploadedFile && (
              <span className="mt-2.5 px-2 py-0.5 rounded text-xs font-mono bg-[#edf5fa] text-[#286b97] border border-[#d3e5f3]">
                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            )}
          </div>

          <div className="flex justify-center">
            <button
              disabled={!uploadedFile}
              onClick={handleUploadAudioProcess}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-xs transition-colors shadow-xs',
                uploadedFile
                  ? 'bg-[#2383e2] hover:bg-[#1a73ca] text-white'
                  : 'bg-[#f1f1ef] text-[#b4b3b0] border border-[#e7e7e5] cursor-not-allowed'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Proses Audio dengan 9router AI</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PASTE TEXT */}
      {!isProcessing && activeTab === 'paste_text' && (
        <div className="rounded-lg border border-[#e7e7e5] bg-white p-5 space-y-3 shadow-xs">
          <label className="block text-xs font-medium text-[#787774]">
            Tempel transkrip mentah, dialog percakapan, atau bahan kuliah:
          </label>
          <textarea
            rows={8}
            value={rawTextContent}
            onChange={(e) => setRawTextContent(e.target.value)}
            placeholder="Tempel catatan atau dialog rapat di sini. AI akan memecah pembicara, membuat ringkasan, to-do list, dan diagram Mind Map otomatis..."
            className="w-full p-3.5 rounded-md bg-[#f7f6f3] border border-[#e7e7e5] text-xs sm:text-sm text-[#37352f] placeholder-[#9b9a97] focus:outline-none focus:border-[#2383e2] font-mono leading-relaxed"
          />

          <div className="flex justify-end">
            <button
              disabled={!rawTextContent.trim()}
              onClick={handlePasteTextProcess}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-xs transition-colors shadow-xs',
                rawTextContent.trim()
                  ? 'bg-[#2383e2] hover:bg-[#1a73ca] text-white'
                  : 'bg-[#f1f1ef] text-[#b4b3b0] border border-[#e7e7e5] cursor-not-allowed'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Buat Ringkasan & Mind Map</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
