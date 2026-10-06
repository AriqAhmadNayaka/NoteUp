export interface NoteUpSettings {
  baseUrl: string;
  apiKey: string;
  sttModel: string;
  llmModel: string;
  glossary: string;
}

export const DEFAULT_SETTINGS: NoteUpSettings = {
  baseUrl: 'http://127.0.0.1:20128/v1',
  apiKey: '',
  sttModel: 'ag/gemini-3.8-flash-medium',
  llmModel: 'ag/gemini-3.8-flash-medium',
  glossary:
    'NoteUp, Smart City, IoT, AI Recorder, Speech-to-Text, Diarization',
};

const SETTINGS_STORAGE_KEY = 'noteup_ai_settings_v2';
export const SETTINGS_CHANGE_EVENT = 'noteup_settings_changed';

export function getClientSettings(): NoteUpSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      baseUrl: parsed.baseUrl || DEFAULT_SETTINGS.baseUrl,
      apiKey: parsed.apiKey || DEFAULT_SETTINGS.apiKey,
      sttModel: parsed.sttModel || DEFAULT_SETTINGS.sttModel,
      llmModel: parsed.llmModel || DEFAULT_SETTINGS.llmModel,
      glossary: parsed.glossary !== undefined ? parsed.glossary : DEFAULT_SETTINGS.glossary,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveClientSettings(settings: Partial<NoteUpSettings>): NoteUpSettings {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SETTINGS, ...settings };
  }
  const current = getClientSettings();
  const updated: NoteUpSettings = {
    ...current,
    ...settings,
  };
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: updated }));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
  return updated;
}
