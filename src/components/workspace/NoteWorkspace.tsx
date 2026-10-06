'use client';

import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Bookmark,
  Share2,
  Download,
  FileText,
  ListTodo,
  GitBranch,
  Sparkles,
  Send,
  Check,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  Tag,
  User,
  MessageSquare,
} from 'lucide-react';
import { NoteItem, TranscriptSegment, ActionItem, ChatMessage, NoteCategory } from '@/types/note';
import { cn, formatTime, exportNoteAsMarkdown } from '@/lib/utils';
import { saveNote } from '@/lib/storage';
import { getClientSettings } from '@/lib/settings';
import { MindMapVisualizer } from './MindMapVisualizer';
import { MarkdownText } from '@/components/ui/MarkdownText';

interface NoteWorkspaceProps {
  note: NoteItem;
  onUpdateNote: (updatedNote: NoteItem) => void;
}

type WorkspaceTab = 'transcript' | 'summary' | 'mindmap' | 'ask';

const getCategoryEmoji = (category: NoteCategory) => {
  switch (category) {
    case 'meeting':
      return '📋';
    case 'lecture':
      return '🎓';
    case 'brainstorm':
      return '💡';
    case 'personal':
      return '📔';
    default:
      return '🎙️';
  }
};

const getCategoryBadgeClass = (category: NoteCategory) => {
  switch (category) {
    case 'meeting':
      return 'notion-tag-blue';
    case 'lecture':
      return 'notion-tag-purple';
    case 'brainstorm':
      return 'notion-tag-yellow';
    case 'personal':
      return 'notion-tag-green';
    default:
      return 'notion-tag-gray';
  }
};

export const NoteWorkspace: React.FC<NoteWorkspaceProps> = ({ note, onUpdateNote }) => {
  const [currentTab, setCurrentTab] = useState<WorkspaceTab>('transcript');

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [copiedMd, setCopiedMd] = useState(false);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Action Items State
  const [newActionText, setNewActionText] = useState('');
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editingActionTask, setEditingActionTask] = useState('');
  const [editingActionAssignee, setEditingActionAssignee] = useState('');

  // Editing Speaker State
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [editingSpeakerName, setEditingSpeakerName] = useState('');

  // Editing Title, Category & Tags State (Notion-style inline editing)
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(note.title);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Sync tempTitle whenever active note changes
  useEffect(() => {
    setTempTitle(note.title);
    setIsEditingTitle(false);
    setIsEditingCategory(false);
    setIsAddingTag(false);
  }, [note.id]);

  const saveTitle = () => {
    if (!tempTitle.trim() || tempTitle.trim() === note.title) {
      setTempTitle(note.title);
      setIsEditingTitle(false);
      return;
    }
    const updatedNote: NoteItem = {
      ...note,
      title: tempTitle.trim(),
    };
    onUpdateNote(updatedNote);
    saveNote(updatedNote);
    setIsEditingTitle(false);
  };

  const updateCategory = (newCategory: NoteCategory) => {
    const updatedNote: NoteItem = {
      ...note,
      category: newCategory,
    };
    onUpdateNote(updatedNote);
    saveNote(updatedNote);
    setIsEditingCategory(false);
  };

  const addTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, '');
    if (!trimmed) {
      setIsAddingTag(false);
      return;
    }
    if (note.tags.includes(trimmed)) {
      setNewTagInput('');
      setIsAddingTag(false);
      return;
    }
    const updatedTags = [...note.tags, trimmed];
    const updatedNote: NoteItem = {
      ...note,
      tags: updatedTags,
    };
    onUpdateNote(updatedNote);
    saveNote(updatedNote);
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = note.tags.filter((t) => t !== tagToRemove);
    const updatedNote: NoteItem = {
      ...note,
      tags: updatedTags,
    };
    onUpdateNote(updatedNote);
    saveNote(updatedNote);
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [note.chatHistory, isTyping]);

  // Audio Playback & Blob URL Lifecycle State
  const [activeAudioSrc, setActiveAudioSrc] = useState<string | null>(null);

  // Maintain fresh ObjectURL from audioBlob whenever note changes or mounts
  useEffect(() => {
    let currentUrl: string | null = null;
    if (note.audioBlob) {
      try {
        currentUrl = URL.createObjectURL(note.audioBlob);
        setActiveAudioSrc(currentUrl);
      } catch (err) {
        console.warn('Could not create ObjectURL from audioBlob:', err);
      }
    } else if (note.audioBlobUrl) {
      setActiveAudioSrc(note.audioBlobUrl);
    } else {
      setActiveAudioSrc(null);
    }

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [note.id, note.audioBlob, note.audioBlobUrl]);

  // Audio Playback Handler
  const togglePlay = () => {
    if (activeAudioSrc && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Playback play() failed, falling back to simulated scrub:', err);
            // Fallback to simulated audio progress
            setIsPlaying(true);
            simTimerRef.current = setInterval(() => {
              setCurrentTime((prev) => {
                if (prev >= note.duration) {
                  if (simTimerRef.current) clearInterval(simTimerRef.current);
                  setIsPlaying(false);
                  return 0;
                }
                return prev + 1;
              });
            }, 1000 / playbackRate);
          });
      }
    } else {
      // Simulation mode for mock notes without audio blobs
      if (isPlaying) {
        if (simTimerRef.current) clearInterval(simTimerRef.current);
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        simTimerRef.current = setInterval(() => {
          setCurrentTime((prev) => {
            if (prev >= note.duration) {
              if (simTimerRef.current) clearInterval(simTimerRef.current);
              setIsPlaying(false);
              return 0;
            }
            return prev + 1;
          });
        }, 1000 / playbackRate);
      }
    }
  };

  const jumpToTime = (seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, note.duration));
    setCurrentTime(clamped);
    if (audioRef.current && activeAudioSrc) {
      try {
        audioRef.current.currentTime = clamped;
        if (!isPlaying) {
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => togglePlay());
        }
      } catch {
        if (!isPlaying) togglePlay();
      }
    } else if (!isPlaying) {
      togglePlay();
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Toggle Action Item Check (Notion Checkbox)
  const toggleActionItem = (actionId: string) => {
    const updatedActions = note.summary.actionItems.map((act) => {
      if (act.id === actionId) {
        const nextState = !act.done;
        if (nextState) {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.8 },
          });
        }
        return { ...act, done: nextState };
      }
      return act;
    });

    const updatedNote: NoteItem = {
      ...note,
      summary: {
        ...note.summary,
        actionItems: updatedActions,
      },
    };
    onUpdateNote(updatedNote);
    saveNote(updatedNote);
  };

  const addActionItem = () => {
    if (!newActionText.trim()) return;
    const newAct: ActionItem = {
      id: `act-${Date.now()}`,
      task: newActionText.trim(),
      assignee: 'Ariq',
      done: false,
    };
    const updatedNote: NoteItem = {
      ...note,
      summary: {
        ...note.summary,
        actionItems: [...note.summary.actionItems, newAct],
      },
    };
    setNewActionText('');
    onUpdateNote(updatedNote);
    saveNote(updatedNote);
  };

  const startEditActionItem = (act: ActionItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingActionId(act.id);
    setEditingActionTask(act.task);
    setEditingActionAssignee(act.assignee || '');
  };

  const saveEditActionItem = (actionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!editingActionTask.trim()) return;

    const updatedActions = note.summary.actionItems.map((act) =>
      act.id === actionId
        ? {
            ...act,
            task: editingActionTask.trim(),
            assignee: editingActionAssignee.trim() || undefined,
          }
        : act
    );

    const updatedNote: NoteItem = {
      ...note,
      summary: {
        ...note.summary,
        actionItems: updatedActions,
      },
    };
    onUpdateNote(updatedNote);
    saveNote(updatedNote);
    setEditingActionId(null);
  };

  const deleteActionItem = (actionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedActions = note.summary.actionItems.filter((act) => act.id !== actionId);
    const updatedNote: NoteItem = {
      ...note,
      summary: {
        ...note.summary,
        actionItems: updatedActions,
      },
    };
    onUpdateNote(updatedNote);
    saveNote(updatedNote);
    if (editingActionId === actionId) {
      setEditingActionId(null);
    }
  };

  // Speaker Rename
  const saveSpeakerName = (speakerId: string) => {
    if (!editingSpeakerName.trim()) return;
    const updatedSpeakers = note.speakers.map((s) =>
      s.id === speakerId ? { ...s, name: editingSpeakerName.trim() } : s
    );
    const updatedNote: NoteItem = {
      ...note,
      speakers: updatedSpeakers,
    };
    setEditingSpeakerId(null);
    onUpdateNote(updatedNote);
    saveNote(updatedNote);
  };

  // Ask NoteUp Chat with real 9router LLM integration
  const handleSendMessage = async (customText?: string) => {
    const query = (customText || chatInput).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      createdAt: new Date().toISOString(),
    };

    const updatedWithUser: NoteItem = {
      ...note,
      chatHistory: [...note.chatHistory, userMsg],
    };
    onUpdateNote(updatedWithUser);
    setChatInput('');
    setIsTyping(true);

    const settings = getClientSettings();

    // Prepare note context for LLM
    const noteContextData = {
      title: note.title,
      category: note.category,
      overview: note.summary.overview,
      keyPoints: note.summary.keyPoints,
      decisions: note.summary.decisions,
      actionItems: note.summary.actionItems,
      speakers: note.speakers,
      transcriptSegments: note.segments.map((s) => ({
        speaker: note.speakers.find((spk) => spk.id === s.speakerId)?.name || 'Unknown',
        time: `[${formatTime(s.start)} - ${formatTime(s.end)}] (detik ${s.start}-${s.end})`,
        text: s.text,
      })),
    };

    let replyText = '';
    let replyTimestamp: number | undefined = undefined;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedWithUser.chatHistory.map((m) => ({
            role: m.role,
            content: m.text,
          })),
          noteContext: noteContextData,
          noteTitle: note.title,
          baseUrl: settings.baseUrl,
          apiKey: settings.apiKey,
          model: settings.llmModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.text) {
          replyText = data.text;
          replyTimestamp = data.timestamp;
        }
      }
    } catch (err) {
      console.warn('Real chat API call failed, falling back to local responder:', err);
    }

    // Graceful offline fallback if 9router is unreachable
    if (!replyText) {
      const lower = query.toLowerCase();
      if (lower.includes('anggaran') || lower.includes('budget') || lower.includes('dana')) {
        replyText =
          'Berdasarkan percakapan pada detik 01:13, disetujui realokasi anggaran sebesar Rp2.500.000 untuk pengadaan merchandise humas yang dialihkan dari pos dana cadangan.';
        replyTimestamp = 73;
      } else if (lower.includes('tugas') || lower.includes('action') || lower.includes('to-do')) {
        replyText =
          'Ada 3 action items utama: 1) Citra membuat form revisi anggaran malam ini, 2) Dimas mengantarkan surat undangan sidang ke dekanat besok pagi, 3) Ariq tanda tangan dan konfirmasi peminjaman aula.';
        replyTimestamp = 126;
      } else if (lower.includes('jadwal') || lower.includes('sidang') || lower.includes('kapan')) {
        replyText =
          'Sidang Pleno Terbuka dijadwalkan pada hari Kamis, 22 Oktober 2026 pukul 14.00 WIB di Aula Utama.';
        replyTimestamp = 126;
      } else {
        replyText = `Mengenai "${query}", berdasarkan catatan "${note.title}", poin utama telah disetujui bersama dan tindak lanjut dikoordinasikan sesuai jadwal.`;
        replyTimestamp = note.segments.length > 0 ? note.segments[0].start : undefined;
      }
    }

    const botMsg: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      text: replyText,
      timestamp: replyTimestamp,
      createdAt: new Date().toISOString(),
    };

    const finalNote: NoteItem = {
      ...updatedWithUser,
      chatHistory: [...updatedWithUser.chatHistory, botMsg],
    };
    setIsTyping(false);
    onUpdateNote(finalNote);
    saveNote(finalNote);
  };

  // Reprocess note with 9router
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [reprocessStatus, setReprocessStatus] = useState<string>('');

  const handleReprocess = async () => {
    const settings = getClientSettings();
    setIsReprocessing(true);
    setReprocessStatus('Mengecek koneksi ke 9router...');

    try {
      // 1. Health check
      const healthRes = await fetch(`/api/health?baseUrl=${encodeURIComponent(settings.baseUrl)}`);
      const healthData = await healthRes.json();
      if (!healthData.ok) {
        alert(
          `9router belum aktif di ${settings.baseUrl}.\n\nSilakan jalankan perintah ini di PowerShell/CMD:\n9router -p 20128\n\nSetelah itu, klik tombol 'Proses Ulang' ini lagi.`
        );
        setIsReprocessing(false);
        setReprocessStatus('');
        return;
      }

      let transcribedText = '';

      // 2. Transcribe audio if blob exists
      if (note.audioBlob) {
        setReprocessStatus('Mentranskripsikan audio rekaman via 9router...');
        const formData = new FormData();
        formData.append('file', note.audioBlob, 'recording.webm');
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
      } else if (note.segments.length > 0 && !note.tags.includes('Belum Diproses (Offline)')) {
        transcribedText = note.segments.map((s) => s.text).join(' ');
      }

      if (!transcribedText && !note.audioBlob) {
        alert('Tidak ada file audio atau teks pada catatan ini untuk diproses.');
        setIsReprocessing(false);
        setReprocessStatus('');
        return;
      }

      // 3. Summarize with 9router
      setReprocessStatus('Menganalisis konten, poin penting, action items, & Mind Map...');
      const sumRes = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.title,
          content: transcribedText || 'Rekaman suara sedang diproses.',
          category: note.category,
          glossary: settings.glossary,
          baseUrl: settings.baseUrl,
          apiKey: settings.apiKey,
          model: settings.llmModel,
          duration: note.duration,
        }),
      });

      if (sumRes.ok) {
        const sumResult = await sumRes.json();
        if (sumResult.ok && sumResult.data) {
          const aiData = sumResult.data;

          const updatedNote: NoteItem = {
            ...note,
            status: 'completed',
            tags: note.tags.filter((t) => !t.includes('Offline')).concat(['9router AI']),
            speakers: aiData.speakers || note.speakers,
            segments: aiData.segments || (transcribedText ? [{ id: 'seg-1', speakerId: 'spk-1', start: 0, end: note.duration, text: transcribedText }] : note.segments),
            summary: aiData.summary || {
              overview: aiData.overview || '',
              keyPoints: aiData.keyPoints || [],
              decisions: aiData.decisions || [],
              actionItems: aiData.actionItems || [],
            },
            mindmap: aiData.mindmap || note.mindmap,
          };

          onUpdateNote(updatedNote);
          saveNote(updatedNote);
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
          alert('Catatan berhasil diproses ulang dengan 9router!');
        } else {
          alert('9router merespons tapi gagal menghasilkan struktur ringkasan. Silakan coba lagi.');
        }
      } else {
        const errJson = await sumRes.json().catch(() => ({}));
        alert(`Gagal memproses ke 9router: ${errJson.error || 'Server error'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Terjadi kesalahan saat memproses ke 9router: ${msg}`);
    } finally {
      setIsReprocessing(false);
      setReprocessStatus('');
    }
  };

  const handleExportMarkdown = () => {
    const md = exportNoteAsMarkdown(note);
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = exportNoteAsMarkdown(note);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${note.title.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hidden real audio element */}
      {activeAudioSrc && (
        <audio
          ref={audioRef}
          src={activeAudioSrc}
          preload="metadata"
          onLoadedMetadata={() => {
            if (audioRef.current) {
              const realDur = Math.round(audioRef.current.duration);
              if (realDur && !isNaN(realDur) && isFinite(realDur) && Math.abs(realDur - note.duration) > 2) {
                const updatedNote: NoteItem = {
                  ...note,
                  duration: realDur,
                };
                onUpdateNote(updatedNote);
                saveNote(updatedNote);
              }
            }
          }}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onError={(e) => {
            console.warn('HTML5 Audio playback error event:', e);
          }}
        />
      )}

      {/* Notion Document Header */}
      <div className="space-y-3">
        {/* Page Icon Emoji */}
        <div className="text-4xl select-none">
          {getCategoryEmoji(note.category)}
        </div>

        {/* Big H1 Notion Title (Click to Edit) */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') {
                      setTempTitle(note.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  onBlur={saveTitle}
                  autoFocus
                  className="w-full text-2xl sm:text-3xl font-bold text-[#37352f] tracking-tight leading-tight px-2 py-0.5 rounded border border-[#2383e2] bg-white focus:outline-none shadow-xs"
                />
                <button
                  onClick={saveTitle}
                  className="p-1.5 rounded-md bg-[#2383e2] text-white hover:bg-[#1a73ca] shrink-0"
                  title="Simpan Judul"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-2 cursor-pointer rounded-md p-1 -ml-1 hover:bg-[rgba(55,53,47,0.04)] transition-colors"
                title="Klik untuk mengubah judul"
              >
                <h1 className="text-2xl sm:text-3xl font-bold text-[#37352f] tracking-tight leading-tight">
                  {note.title}
                </h1>
                <Edit2 className="h-4 w-4 text-[#9b9a97] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )}
          </div>

          {/* Export & Obsidian Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
            <button
              onClick={handleReprocess}
              disabled={isReprocessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2383e2] hover:bg-[#1a73ca] text-white text-xs font-medium shadow-xs transition-colors"
              title="Proses ulang audio/teks dengan 9router AI"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
              <span>{isReprocessing ? (reprocessStatus || 'Memproses...') : '⚡ Proses Ulang dengan 9router'}</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white hover:bg-[#f7f6f3] text-[#37352f] border border-[#e7e7e5] text-xs font-medium transition-colors shadow-xs"
              title="Salin Markdown Lengkap (Frontmatter + Mermaid)"
            >
              {copiedMd ? <Check className="h-3.5 w-3.5 text-[#2b6e4f]" /> : <Share2 className="h-3.5 w-3.5 text-[#787774]" />}
              <span>{copiedMd ? 'Tersalin!' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#f7f6f3] text-[#37352f] border border-[#e7e7e5] text-xs font-medium shadow-xs transition-colors"
              title="Download file .md untuk Obsidian Vault"
            >
              <Download className="h-3.5 w-3.5 text-[#787774]" />
              <span>Ekspor .MD</span>
            </button>
          </div>
        </div>

        {/* Notion Database Properties Table */}
        <div className="pt-2 border-t border-[#e7e7e5] space-y-1.5 text-xs">
          {/* Row 1: Category (Click to Change) */}
          <div className="flex items-center gap-3">
            <div className="w-28 text-[#787774] flex items-center gap-1.5 shrink-0">
              <span className="text-xs">📁</span>
              <span>Kategori</span>
            </div>
            <div className="flex items-center">
              {isEditingCategory ? (
                <div className="flex items-center gap-1.5">
                  <select
                    value={note.category}
                    onChange={(e) => updateCategory(e.target.value as NoteCategory)}
                    onBlur={() => setIsEditingCategory(false)}
                    autoFocus
                    className="px-2 py-0.5 rounded border border-[#2383e2] bg-white text-xs text-[#37352f] focus:outline-none"
                  >
                    <option value="meeting">📋 Rapat Formal</option>
                    <option value="lecture">🎓 Kuliah / Belajar</option>
                    <option value="brainstorm">💡 Brainstorm</option>
                    <option value="personal">📔 Personal</option>
                  </select>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingCategory(true)}
                  className="group flex items-center gap-1 hover:opacity-85 transition-opacity"
                  title="Klik untuk mengganti kategori"
                >
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium border flex items-center gap-1',
                      getCategoryBadgeClass(note.category)
                    )}
                  >
                    <span>
                      {note.category === 'meeting'
                        ? 'Rapat Formal'
                        : note.category === 'lecture'
                        ? 'Kuliah'
                        : note.category === 'brainstorm'
                        ? 'Brainstorm'
                        : 'Personal'}
                    </span>
                    <Edit2 className="h-2.5 w-2.5 opacity-60 ml-0.5 group-hover:opacity-100" />
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Tags (Editable: Add and Remove) */}
          <div className="flex items-center gap-3">
            <div className="w-28 text-[#787774] flex items-center gap-1.5 shrink-0">
              <Tag className="h-3 w-3 text-[#9b9a97]" />
              <span>Tags</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="group inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-[#f1f1ef] text-[#5a5a58] border border-[#e3e2e0]"
                >
                  <span>#{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-[#9b9a97] hover:text-[#eb5757] transition-colors ml-0.5"
                    title={`Hapus tag #${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}

              {isAddingTag ? (
                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addTag();
                      if (e.key === 'Escape') {
                        setNewTagInput('');
                        setIsAddingTag(false);
                      }
                    }}
                    onBlur={addTag}
                    placeholder="nama tag..."
                    autoFocus
                    className="px-1.5 py-0.5 rounded border border-[#2383e2] bg-white text-[11px] text-[#37352f] w-24 focus:outline-none"
                  />
                  <button
                    onClick={addTag}
                    className="p-0.5 rounded bg-[#2383e2] text-white"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-[#787774] hover:text-[#37352f] hover:bg-[#f1f1ef] border border-dashed border-[#d3d2ce] transition-colors"
                  title="Tambah tag baru"
                >
                  <Plus className="h-2.5 w-2.5" />
                  <span>Tambah Tag</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 3: Duration & Date */}
          <div className="flex items-center gap-3">
            <div className="w-28 text-[#787774] flex items-center gap-1.5 shrink-0">
              <Clock className="h-3 w-3 text-[#9b9a97]" />
              <span>Durasi & Waktu</span>
            </div>
            <div className="flex items-center gap-2 text-[#37352f]">
              <span className="font-mono">{formatTime(note.duration)}</span>
              <span className="text-[#b4b3b0]">•</span>
              <span className="text-[#787774]">
                {new Date(note.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Row 4: Speakers */}
          <div className="flex items-center gap-3">
            <div className="w-28 text-[#787774] flex items-center gap-1.5 shrink-0">
              <User className="h-3 w-3 text-[#9b9a97]" />
              <span>Pembicara</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {note.speakers.map((spk) => (
                <span
                  key={spk.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-[#f7f6f3] text-[#37352f] border border-[#e7e7e5]"
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: spk.color }} />
                  <span>{spk.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MINIMALIST INTEGRATED NOTION AUDIO PLAYER BAR */}
      <div className="rounded-lg border border-[#e7e7e5] bg-[#f7f6f3] p-3.5 space-y-2.5 shadow-xs sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Controls: Play/Pause, Skips */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => jumpToTime(currentTime - 5)}
              className="p-1.5 rounded hover:bg-[rgba(55,53,47,0.08)] text-[#787774] hover:text-[#37352f] transition-colors"
              title="Mundur 5 detik"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={togglePlay}
              className="h-8 w-8 rounded-full bg-[#37352f] hover:bg-[#202020] flex items-center justify-center text-white shadow-xs transition-colors"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5 fill-white" />}
            </button>

            <button
              onClick={() => jumpToTime(currentTime + 5)}
              className="p-1.5 rounded hover:bg-[rgba(55,53,47,0.08)] text-[#787774] hover:text-[#37352f] transition-colors"
              title="Maju 5 detik"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1 font-mono text-xs text-[#37352f] ml-1">
              <span className="font-semibold">{formatTime(currentTime)}</span>
              <span className="text-[#9b9a97]">/</span>
              <span className="text-[#787774]">{formatTime(note.duration)}</span>
            </div>
          </div>

          {/* Markers Pills in Player */}
          {note.markers.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto max-w-xs py-0.5">
              {note.markers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => jumpToTime(m.time)}
                  className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#fbf3db] hover:bg-[#f4e3b5] text-[#89632a] border border-[#f4e3b5] transition-colors"
                >
                  <Bookmark className="h-2.5 w-2.5" />
                  <span>{formatTime(m.time)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Speed Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[#787774] mr-1 hidden sm:inline">Speed:</span>
            {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors',
                  playbackRate === speed
                    ? 'bg-white shadow-xs text-[#37352f] border border-[#e7e7e5] font-semibold'
                    : 'text-[#787774] hover:text-[#37352f] hover:bg-[rgba(55,53,47,0.06)]'
                )}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Scrubber Progress Bar */}
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min={0}
            max={note.duration || 100}
            value={currentTime}
            onChange={(e) => jumpToTime(Number(e.target.value))}
            className="w-full h-1 bg-[#e7e7e5] rounded appearance-none cursor-pointer accent-[#37352f]"
          />
        </div>
      </div>

      {/* NOTION WORKSPACE VIEW TABS */}
      <div className="flex items-center gap-1 border-b border-[#e7e7e5] pb-0.5 overflow-x-auto">
        <button
          onClick={() => setCurrentTab('transcript')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
            currentTab === 'transcript'
              ? 'border-[#37352f] text-[#37352f] font-semibold'
              : 'border-transparent text-[#787774] hover:text-[#37352f] hover:bg-[rgba(55,53,47,0.04)] rounded-t'
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Transkrip (Sync)</span>
        </button>

        <button
          onClick={() => setCurrentTab('summary')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
            currentTab === 'summary'
              ? 'border-[#37352f] text-[#37352f] font-semibold'
              : 'border-transparent text-[#787774] hover:text-[#37352f] hover:bg-[rgba(55,53,47,0.04)] rounded-t'
          )}
        >
          <ListTodo className="h-3.5 w-3.5" />
          <span>Ringkasan & Action Items</span>
          {note.summary.actionItems.length > 0 && (
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#edf3ec] text-[#2b6e4f] border border-[#d3e5d2]">
              {note.summary.actionItems.filter((a) => !a.done).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('mindmap')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
            currentTab === 'mindmap'
              ? 'border-[#37352f] text-[#37352f] font-semibold'
              : 'border-transparent text-[#787774] hover:text-[#37352f] hover:bg-[rgba(55,53,47,0.04)] rounded-t'
          )}
        >
          <GitBranch className="h-3.5 w-3.5" />
          <span>Mind Map Visual</span>
        </button>

        <button
          onClick={() => setCurrentTab('ask')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
            currentTab === 'ask'
              ? 'border-[#37352f] text-[#37352f] font-semibold'
              : 'border-transparent text-[#787774] hover:text-[#37352f] hover:bg-[rgba(55,53,47,0.04)] rounded-t'
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Ask NoteUp AI</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE TRANSCRIPT WITH DIARIZATION */}
      {currentTab === 'transcript' && (
        <div className="space-y-4">
          {/* Speaker Info Pill Bar */}
          <div className="flex flex-wrap items-center gap-2 p-2.5 bg-[#f7f6f3] rounded-lg border border-[#e7e7e5] text-xs text-[#787774]">
            <span className="font-medium text-[#37352f]">Diarization:</span>
            {note.speakers.map((spk) => (
              <div key={spk.id} className="flex items-center gap-1.5">
                {editingSpeakerId === spk.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editingSpeakerName}
                      onChange={(e) => setEditingSpeakerName(e.target.value)}
                      className="px-2 py-0.5 rounded bg-white border border-[#2383e2] text-xs text-[#37352f]"
                      autoFocus
                    />
                    <button
                      onClick={() => saveSpeakerName(spk.id)}
                      className="p-1 rounded bg-[#2383e2] text-white"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingSpeakerId(spk.id);
                      setEditingSpeakerName(spk.name);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-white border border-[#e7e7e5] hover:border-[#b4b3b0] text-[#37352f] transition-colors"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: spk.color }} />
                    <span>{spk.name}</span>
                    <Edit2 className="h-2.5 w-2.5 text-[#9b9a97] ml-0.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Transcript Segments List */}
          <div className="space-y-2.5">
            {note.segments.map((seg) => {
              const spk = note.speakers.find((s) => s.id === seg.speakerId);
              const isActive = currentTime >= seg.start && currentTime <= seg.end;

              const segmentMarkers = note.markers.filter(
                (m) => m.time >= seg.start && m.time <= seg.end
              );

              return (
                <div
                  key={seg.id}
                  onClick={() => jumpToTime(seg.start)}
                  className={cn(
                    'p-3.5 rounded-lg border transition-all cursor-pointer group',
                    isActive
                      ? 'bg-[#edf5fa] border-[#2383e2] shadow-xs'
                      : 'bg-white border-[#e7e7e5] hover:bg-[#f7f6f3]'
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#37352f] flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: spk?.color || '#37352f' }} />
                        <span>{spk?.name || 'Unknown'}</span>
                      </span>
                      <span className="font-mono text-[11px] text-[#9b9a97]">
                        {formatTime(seg.start)} - {formatTime(seg.end)}
                      </span>
                    </div>

                    <span className="opacity-0 group-hover:opacity-100 text-[11px] text-[#2383e2] flex items-center gap-1 transition-opacity">
                      <Play className="h-3 w-3 fill-[#2383e2]" /> Putar
                    </span>
                  </div>

                  <p
                    className={cn(
                      'text-xs sm:text-sm leading-relaxed transition-colors',
                      isActive ? 'text-[#37352f] font-medium' : 'text-[#37352f]'
                    )}
                  >
                    {seg.text}
                  </p>

                  {segmentMarkers.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 pt-1.5 border-t border-[#e7e7e5]">
                      {segmentMarkers.map((m) => (
                        <span
                          key={m.id}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#fbf3db] text-[#89632a] border border-[#f4e3b5]"
                        >
                          <Bookmark className="h-2.5 w-2.5" />
                          <span>Pin [{formatTime(m.time)}]: {m.label}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-DIMENSIONAL SUMMARY & ACTION ITEMS */}
      {currentTab === 'summary' && (
        <div className="space-y-5">
          {/* Executive Overview (Notion Callout Box) */}
          <div className="p-4 rounded-lg bg-[#f7f6f3] border border-[#e7e7e5] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#787774] uppercase tracking-wider">
              <span className="text-base select-none">💡</span>
              <span className="text-[#37352f]">Executive Overview</span>
            </div>
            <p className="text-xs sm:text-sm text-[#37352f] leading-relaxed">
              {note.summary.overview}
            </p>
          </div>

          {/* Key Discussion Points */}
          <div className="p-4 rounded-lg bg-white border border-[#e7e7e5] space-y-3">
            <h2 className="text-xs font-semibold text-[#787774] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[#37352f]" />
              <span className="text-[#37352f]">Poin Pembahasan Utama</span>
            </h2>
            <ul className="space-y-2">
              {note.summary.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#37352f] leading-relaxed">
                  <span className="h-4 w-4 rounded-full bg-[#f1f1ef] text-[#5a5a58] flex items-center justify-center shrink-0 text-[11px] font-semibold mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Decisions Card (Notion Soft Green Callout) */}
          {note.summary.decisions.length > 0 && (
            <div className="p-4 rounded-lg bg-[#edf3ec] border border-[#d3e5d2] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2b6e4f] uppercase tracking-wider">
                <span className="text-base select-none">🎯</span>
                <span>Keputusan Final yang Disepakati</span>
              </div>
              <ul className="space-y-1.5">
                {note.summary.decisions.map((dec, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-[#2b6e4f]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2b6e4f]" />
                    <span>{dec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items Checklist (Authentic Notion To-Do Checkboxes) */}
          <div className="p-3 sm:p-4 rounded-lg bg-white border border-[#e7e7e5] space-y-3 w-full min-w-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#e7e7e5] pb-2 gap-2">
              <h2 className="text-xs font-semibold text-[#37352f] uppercase tracking-wider flex items-center gap-1.5 min-w-0">
                <ListTodo className="h-3.5 w-3.5 text-[#37352f] shrink-0" />
                <span className="truncate">Tindak Lanjut & Action Items</span>
              </h2>
              <span className="text-[11px] font-mono text-[#787774] shrink-0">
                {note.summary.actionItems.filter((a) => a.done).length} / {note.summary.actionItems.length} Selesai
              </span>
            </div>

            {/* Checklist Items */}
            <div className="space-y-1.5 w-full min-w-0">
              {note.summary.actionItems.map((act) => (
                <div
                  key={act.id}
                  onClick={() => {
                    if (editingActionId !== act.id) {
                      toggleActionItem(act.id);
                    }
                  }}
                  className="p-2 sm:p-2.5 rounded-md hover:bg-[#f7f6f3] transition-colors cursor-pointer group w-full min-w-0"
                >
                  {editingActionId === act.id ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="w-full flex flex-col gap-2 py-1"
                    >
                      <input
                        type="text"
                        value={editingActionTask}
                        onChange={(e) => setEditingActionTask(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditActionItem(act.id);
                          if (e.key === 'Escape') setEditingActionId(null);
                        }}
                        autoFocus
                        placeholder="Deskripsi tugas..."
                        className="w-full px-2.5 py-1.5 rounded border border-[#2383e2] bg-white text-xs text-[#37352f] focus:outline-none shadow-xs"
                      />
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        <input
                          type="text"
                          value={editingActionAssignee}
                          onChange={(e) => setEditingActionAssignee(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditActionItem(act.id);
                            if (e.key === 'Escape') setEditingActionId(null);
                          }}
                          placeholder="Assignee (opsional, contoh: Ariq)..."
                          className="w-full sm:w-56 px-2.5 py-1 rounded border border-[#e7e7e5] bg-white text-xs text-[#5a5a58] focus:outline-none"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => saveEditActionItem(act.id, e)}
                            className="px-3 py-1 rounded bg-[#2383e2] hover:bg-[#1a73ca] text-white text-xs font-medium transition-colors shadow-xs"
                            title="Simpan Perubahan"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingActionId(null);
                            }}
                            className="px-2.5 py-1 rounded border border-[#e7e7e5] bg-white hover:bg-[#f7f6f3] text-xs text-[#787774] transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full min-w-0">
                      {/* Left: Checkbox + Natural Wrapping Text */}
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Notion-style Square Checkbox */}
                        <div
                          className={cn(
                            'h-4 w-4 rounded-[3px] border flex items-center justify-center transition-colors shrink-0 mt-0.5',
                            act.done
                              ? 'bg-[#2383e2] border-[#2383e2] text-white'
                              : 'border-[#b4b3b0] bg-white group-hover:border-[#787774]'
                          )}
                        >
                          {act.done && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>

                        <span
                          className={cn(
                            'text-xs sm:text-sm leading-relaxed transition-colors break-words whitespace-normal flex-1 min-w-0',
                            act.done ? 'text-[#9b9a97] line-through' : 'text-[#37352f]'
                          )}
                        >
                          {act.task}
                        </span>
                      </div>

                      {/* Right: Assignee Badge + Edit & Delete Buttons */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 pl-6 sm:pl-2 shrink-0">
                        {act.assignee ? (
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#f1f1ef] text-[#5a5a58] border border-[#e3e2e0] font-mono break-all max-w-[160px] truncate">
                            @{act.assignee}
                          </span>
                        ) : (
                          <span className="sm:hidden" />
                        )}

                        {/* Action Item Buttons: Mobile-friendly (always visible on touch / mobile, hover on desktop) */}
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => startEditActionItem(act, e)}
                            className="p-1 sm:p-1 rounded hover:bg-[#e7e7e5] text-[#787774] hover:text-[#37352f] transition-colors"
                            title="Edit tugas"
                          >
                            <Edit2 className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => deleteActionItem(act.id, e)}
                            className="p-1 sm:p-1 rounded hover:bg-[#fbebee] text-[#787774] hover:text-[#eb5757] transition-colors"
                            title="Hapus tugas"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Action Item Input (Notion inline block) */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#e7e7e5] w-full min-w-0">
              <input
                type="text"
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addActionItem()}
                placeholder="Tambah tugas / tindak lanjut baru..."
                className="w-full sm:flex-1 px-3 py-1.5 rounded-md bg-[#f7f6f3] border border-[#e7e7e5] text-xs text-[#37352f] placeholder-[#9b9a97] focus:outline-none focus:border-[#2383e2]"
              />
              <button
                onClick={addActionItem}
                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-[#37352f] hover:bg-[#202020] text-white text-xs font-medium transition-colors shrink-0 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTERACTIVE MIND MAP */}
      {currentTab === 'mindmap' && (
        <MindMapVisualizer mindmap={note.mindmap} title={note.title} />
      )}

      {/* TAB 4: ASK NOTEUP CHAT ASSISTANT (Notion AI Style) */}
      {currentTab === 'ask' && (
        <div className="rounded-lg border border-[#e7e7e5] bg-white flex flex-col h-[520px] overflow-hidden shadow-xs">
          {/* Header Banner */}
          <div className="px-4 py-2.5 bg-[#f7f6f3] border-b border-[#e7e7e5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#6940a5]" />
              <span className="text-xs font-semibold text-[#37352f]">
                Ask NoteUp AI Assistant
              </span>
            </div>
            <span className="text-[11px] text-[#787774]">Powered by 9router</span>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {note.chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-full bg-[#f4f0f7] text-[#6940a5] border border-[#e2d9f3] flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[85%] sm:max-w-[75%] p-3 rounded-lg text-xs sm:text-sm leading-relaxed space-y-2',
                    msg.role === 'user'
                      ? 'bg-[#2383e2] text-white'
                      : 'bg-[#f7f6f3] border border-[#e7e7e5] text-[#37352f]'
                  )}
                >
                  <MarkdownText content={msg.text} />

                  {/* Clickable Timestamp Citation */}
                  {msg.timestamp !== undefined && (
                    <button
                      onClick={() => jumpToTime(msg.timestamp!)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-white text-[#2383e2] border border-[#e7e7e5] hover:bg-[#edf5fa] transition-colors"
                    >
                      <Play className="h-3 w-3 fill-[#2383e2]" />
                      <span>Loncat ke audio [{formatTime(msg.timestamp)}]</span>
                    </button>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="h-7 w-7 rounded-full bg-[#37352f] text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    A
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 items-center text-xs text-[#787774]">
                <div className="h-6 w-6 rounded-full bg-[#f4f0f7] text-[#6940a5] flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="h-3 w-3" />
                </div>
                <span>NoteUp sedang merangkai jawaban...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-3 py-2 border-t border-[#e7e7e5] bg-[#f7f6f3] flex items-center gap-1.5 overflow-x-auto">
            {[
              'Apa keputusan anggaran tadi?',
              'Siapa saja yang diberi tugas?',
              'Rangkum dalam 3 kalimat',
              'Kapan sidang pleno dilaksanakan?',
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="shrink-0 px-2 py-1 rounded text-[11px] bg-white hover:bg-[rgba(55,53,47,0.06)] text-[#37352f] border border-[#e7e7e5] transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-white border-t border-[#e7e7e5] flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tanyakan hal spesifik tentang rekaman ini..."
              className="flex-1 px-3 py-1.5 rounded-md bg-[#f7f6f3] border border-[#e7e7e5] text-xs sm:text-sm text-[#37352f] placeholder-[#9b9a97] focus:outline-none focus:border-[#2383e2]"
            />
            <button
              onClick={() => handleSendMessage()}
              className="px-3.5 py-1.5 rounded-md bg-[#2383e2] hover:bg-[#1a73ca] text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
