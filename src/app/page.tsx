'use client';

import React, { useState, useEffect } from 'react';
import { AppShell, ActiveTab } from '@/components/layout/AppShell';
import { StudioView } from '@/components/studio/StudioView';
import { LibraryView } from '@/components/library/LibraryView';
import { NoteWorkspace } from '@/components/workspace/NoteWorkspace';
import { SettingsView } from '@/components/settings/SettingsView';
import { NoteItem } from '@/types/note';
import { loadNotes, saveNote, deleteNote } from '@/lib/storage';
import { SAMPLE_NOTES } from '@/lib/mockData';
import { set } from 'idb-keyval';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial notes with safety timeout
  useEffect(() => {
    let isMounted = true;

    // Fail-safe: if storage takes more than 1.5s, force unblock UI with sample notes
    const fallbackTimer = setTimeout(() => {
      if (isMounted && isLoading) {
        setNotes((prev) => (prev.length > 0 ? prev : SAMPLE_NOTES));
        setSelectedNote((prev) => prev || SAMPLE_NOTES[0]);
        setIsLoading(false);
      }
    }, 1500);

    async function initData() {
      try {
        const loaded = await loadNotes();
        if (isMounted) {
          setNotes(loaded);
          if (loaded.length > 0) {
            setSelectedNote(loaded[0]);
          }
        }
      } catch (err) {
        console.warn('Init notes error, using samples:', err);
        if (isMounted) {
          setNotes(SAMPLE_NOTES);
          setSelectedNote(SAMPLE_NOTES[0]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initData();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleSelectNote = (note: NoteItem) => {
    setSelectedNote(note);
    setActiveTab('workspace');
  };

  const handleNoteCreated = (newNote: NoteItem) => {
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNote(newNote);
    setActiveTab('workspace');
  };

  const handleUpdateNote = (updatedNote: NoteItem) => {
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    if (selectedNote && selectedNote.id === updatedNote.id) {
      setSelectedNote(updatedNote);
    }
  };

  const handleDeleteNote = async (id: string) => {
    const updated = await deleteNote(id);
    setNotes(updated);
    if (selectedNote && selectedNote.id === id) {
      setSelectedNote(updated.length > 0 ? updated[0] : null);
      if (activeTab === 'workspace') {
        setActiveTab('library');
      }
    }
  };

  const handleResetData = async () => {
    await set('noteup_saved_notes_v1', SAMPLE_NOTES);
    setNotes(SAMPLE_NOTES);
    setSelectedNote(SAMPLE_NOTES[0]);
    alert('Data contoh telah dipulihkan ke IndexedDB.');
  };

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      selectedNoteTitle={selectedNote?.title}
      onBackToLibrary={() => setActiveTab('library')}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-2 text-sm text-[#787774]">
          <div className="h-5 w-5 border-2 border-[#37352f]/20 border-t-[#37352f] rounded-full animate-spin" />
          <span>Memuat catatan...</span>
        </div>
      ) : (
        <>
          {activeTab === 'studio' && (
            <StudioView onNoteCreated={handleNoteCreated} />
          )}

          {activeTab === 'library' && (
            <LibraryView
              notes={notes}
              onSelectNote={handleSelectNote}
              onDeleteNote={handleDeleteNote}
              onGoToStudio={() => setActiveTab('studio')}
            />
          )}

          {activeTab === 'workspace' && selectedNote && (
            <NoteWorkspace
              note={selectedNote}
              onUpdateNote={handleUpdateNote}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView onResetData={handleResetData} />
          )}
        </>
      )}
    </AppShell>
  );
}
