import { get, set } from 'idb-keyval';
import { NoteItem } from '@/types/note';
import { SAMPLE_NOTES } from './mockData';

const NOTES_STORAGE_KEY = 'noteup_saved_notes_v1';
const FALLBACK_LOCALSTORAGE_KEY = 'noteup_notes_backup_v1';

// Helper with timeout to prevent IndexedDB from hanging indefinitely
function withTimeout<T>(promise: Promise<T>, ms: number = 2000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`IndexedDB timeout after ${ms}ms`));
    }, ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function getLocalStorageNotes(): NoteItem[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(FALLBACK_LOCALSTORAGE_KEY);
    if (!item) return null;
    return JSON.parse(item);
  } catch {
    return null;
  }
}

function saveLocalStorageNotes(notes: NoteItem[]) {
  if (typeof window === 'undefined') return;
  try {
    // Exclude heavy Blobs from JSON localStorage
    const serializable = notes.map((n) => ({
      ...n,
      audioBlob: undefined,
    }));
    localStorage.setItem(FALLBACK_LOCALSTORAGE_KEY, JSON.stringify(serializable));
  } catch {
    // Ignore quota errors
  }
}

export async function loadNotes(): Promise<NoteItem[]> {
  if (typeof window === 'undefined') return SAMPLE_NOTES;

  try {
    // Check IndexedDB with strict timeout
    const data = await withTimeout(get<NoteItem[]>(NOTES_STORAGE_KEY), 2000);
    if (!data || data.length === 0) {
      // Check localStorage backup
      const backup = getLocalStorageNotes();
      if (backup && backup.length > 0) {
        return backup;
      }
      // Seed initial sample data safely in background
      set(NOTES_STORAGE_KEY, SAMPLE_NOTES).catch(() => {});
      saveLocalStorageNotes(SAMPLE_NOTES);
      return SAMPLE_NOTES;
    }
    saveLocalStorageNotes(data);
    return data;
  } catch (error) {
    console.warn('IndexedDB failed or timed out, using fallback:', error);
    const backup = getLocalStorageNotes();
    if (backup && backup.length > 0) {
      return backup;
    }
    return SAMPLE_NOTES;
  }
}

export async function saveNote(note: NoteItem): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const existing = await loadNotes();
    const index = existing.findIndex((n) => n.id === note.id);
    let updated: NoteItem[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = note;
    } else {
      updated = [note, ...existing];
    }
    saveLocalStorageNotes(updated);
    await withTimeout(set(NOTES_STORAGE_KEY, updated), 3000).catch((err) =>
      console.warn('IndexedDB set timed out, saved to localStorage backup:', err)
    );
  } catch (error) {
    console.error('Failed to save note:', error);
  }
}

export async function deleteNote(id: string): Promise<NoteItem[]> {
  if (typeof window === 'undefined') return [];
  try {
    const existing = await loadNotes();
    const updated = existing.filter((n) => n.id !== id);
    saveLocalStorageNotes(updated);
    await withTimeout(set(NOTES_STORAGE_KEY, updated), 3000).catch((err) =>
      console.warn('IndexedDB set timed out on delete:', err)
    );
    return updated;
  } catch (error) {
    console.error('Failed to delete note:', error);
    return [];
  }
}
