'use client';

import React, { useState } from 'react';
import {
  Search,
  Clock,
  Users,
  CheckCircle2,
  Trash2,
  ChevronRight,
  FolderOpen,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { NoteCategory, NoteItem } from '@/types/note';
import { formatTime, cn } from '@/lib/utils';

interface LibraryViewProps {
  notes: NoteItem[];
  onSelectNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onGoToStudio: () => void;
}

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
      return '📄';
  }
};

export const LibraryView: React.FC<LibraryViewProps> = ({
  notes,
  onSelectNote,
  onDeleteNote,
  onGoToStudio,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'gallery' | 'list'>('gallery');

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      n.summary.overview.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || n.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Notion Document Header */}
      <div className="space-y-2">
        <div className="text-3xl select-none">📚</div>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#e7e7e5] pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#37352f] tracking-tight">
              Catatan & Transkrip
            </h1>
            <p className="text-sm text-[#787774] mt-1">
              Database notulensi, rekaman audio offline, dan rangkuman AI terstruktur.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onGoToStudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2383e2] hover:bg-[#1a73ca] text-white text-xs font-medium shadow-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Rekam / Buat Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notion Database Views & Toolbar */}
      <div className="flex flex-col gap-3">
        {/* Category Views Tabs */}
        <div className="flex items-center justify-between border-b border-[#e7e7e5] overflow-x-auto pb-0.5">
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'Semua Catatan', emoji: '📋' },
              { id: 'meeting', label: 'Rapat', emoji: '👥' },
              { id: 'lecture', label: 'Kuliah', emoji: '🎓' },
              { id: 'brainstorm', label: 'Brainstorm', emoji: '💡' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
                  selectedCategory === cat.id
                    ? 'border-[#37352f] text-[#37352f] font-semibold'
                    : 'border-transparent text-[#787774] hover:text-[#37352f] hover:bg-[rgba(55,53,47,0.04)] rounded-t'
                )}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                {cat.id === 'all' && (
                  <span className="text-[11px] text-[#9b9a97] ml-0.5">
                    ({notes.length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Gallery vs List */}
          <div className="hidden sm:flex items-center gap-1 p-0.5 rounded border border-[#e7e7e5] bg-[#f7f6f3]">
            <button
              onClick={() => setViewMode('gallery')}
              className={cn(
                'p-1 rounded text-xs transition-colors',
                viewMode === 'gallery'
                  ? 'bg-white shadow-xs text-[#37352f]'
                  : 'text-[#787774] hover:text-[#37352f]'
              )}
              title="Tampilan Galeri"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1 rounded text-xs transition-colors',
                viewMode === 'list'
                  ? 'bg-white shadow-xs text-[#37352f]'
                  : 'text-[#787774] hover:text-[#37352f]'
              )}
              title="Tampilan Daftar"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Search Bar (Notion Style) */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9b9a97]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari dalam database (judul, tag, pembicara, kesimpulan)..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-md bg-[#f7f6f3] hover:bg-[#efeeea] focus:bg-white border border-[#e7e7e5] text-xs text-[#37352f] placeholder-[#9b9a97] focus:outline-none focus:border-[#2383e2] transition-colors"
          />
        </div>
      </div>

      {/* Notes List / Gallery */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-lg border border-[#e7e7e5] bg-[#f7f6f3]/50 space-y-3">
          <div className="text-3xl select-none">🔍</div>
          <div>
            <h3 className="text-sm font-semibold text-[#37352f]">
              Tidak ada catatan yang cocok
            </h3>
            <p className="text-xs text-[#787774] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ditemukan hasil untuk "${searchQuery}". Coba kata kunci lain.`
                : 'Belum ada catatan pada kategori ini. Mulai dengan merekam atau mengunggah audio.'}
            </p>
          </div>
          <button
            onClick={onGoToStudio}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2383e2] hover:bg-[#1a73ca] text-white text-xs font-medium shadow-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Rekam Sekarang</span>
          </button>
        </div>
      ) : viewMode === 'gallery' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => {
            const completedActions = note.summary.actionItems.filter((a) => a.done).length;
            const totalActions = note.summary.actionItems.length;

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className="group p-4 rounded-lg bg-white border border-[#e7e7e5] hover:border-[#b4b3b0] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3.5"
              >
                <div className="space-y-2">
                  {/* Top Bar: Icon + Category Badge + Date */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg select-none">
                        {getCategoryEmoji(note.category)}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[11px] font-medium border',
                          getCategoryBadgeClass(note.category)
                        )}
                      >
                        {note.category === 'meeting'
                          ? 'Rapat Formal'
                          : note.category === 'lecture'
                          ? 'Kuliah'
                          : note.category === 'brainstorm'
                          ? 'Brainstorm'
                          : 'Personal'}
                      </span>
                    </div>

                    <span className="text-[11px] text-[#9b9a97] font-mono">
                      {new Date(note.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-[15px] font-semibold text-[#37352f] group-hover:text-[#2383e2] transition-colors line-clamp-2 leading-snug">
                    {note.title}
                  </h3>

                  {/* Overview excerpt */}
                  <p className="text-xs text-[#787774] line-clamp-2 leading-relaxed">
                    {note.summary.overview}
                  </p>

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-[#f1f1ef] text-[#5a5a58] border border-[#e3e2e0]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Properties (Notion Style) */}
                <div className="pt-2.5 border-t border-[#e7e7e5] flex items-center justify-between text-xs text-[#787774]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-[#787774]">
                      <Clock className="h-3 w-3 text-[#9b9a97]" />
                      {formatTime(note.duration)}
                    </span>

                    <span className="flex items-center gap-1 text-[11px] text-[#787774]">
                      <Users className="h-3 w-3 text-[#9b9a97]" />
                      {note.speakers.length} Pembicara
                    </span>

                    {totalActions > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-[#2b6e4f] bg-[#edf3ec] px-1.5 py-0.5 rounded border border-[#d3e5d2]">
                        <CheckCircle2 className="h-3 w-3 text-[#2b6e4f]" />
                        {completedActions}/{totalActions} Tasks
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Hapus catatan "${note.title}"?`)) {
                          onDeleteNote(note.id);
                        }
                      }}
                      className="p-1 rounded text-[#9b9a97] hover:text-[#eb5757] hover:bg-[#fbebee] transition-colors"
                      title="Hapus catatan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <ChevronRight className="h-3.5 w-3.5 text-[#9b9a97] group-hover:text-[#37352f] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table View (Classic Notion Database List) */
        <div className="border border-[#e7e7e5] rounded-lg divide-y divide-[#e7e7e5] bg-white overflow-hidden">
          {filteredNotes.map((note) => {
            const completedActions = note.summary.actionItems.filter((a) => a.done).length;
            const totalActions = note.summary.actionItems.length;

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className="group p-3 flex items-center justify-between gap-3 hover:bg-[#f7f6f3] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-base select-none shrink-0">
                    {getCategoryEmoji(note.category)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-medium text-[#37352f] group-hover:text-[#2383e2] truncate">
                        {note.title}
                      </span>
                      <span
                        className={cn(
                          'hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-medium border shrink-0',
                          getCategoryBadgeClass(note.category)
                        )}
                      >
                        {note.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#787774] shrink-0">
                  <span className="font-mono text-[11px] hidden sm:inline text-[#9b9a97]">
                    {formatTime(note.duration)}
                  </span>

                  {totalActions > 0 && (
                    <span className="hidden md:inline-flex text-[11px] text-[#2b6e4f] bg-[#edf3ec] px-1.5 py-0.5 rounded border border-[#d3e5d2]">
                      {completedActions}/{totalActions} tasks
                    </span>
                  )}

                  <span className="text-[11px] text-[#9b9a97]">
                    {new Date(note.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Hapus catatan "${note.title}"?`)) {
                        onDeleteNote(note.id);
                      }
                    }}
                    className="p-1 rounded text-[#9b9a97] hover:text-[#eb5757] hover:bg-[#fbebee]"
                    title="Hapus"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
