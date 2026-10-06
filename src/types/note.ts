export type NoteCategory = 'meeting' | 'lecture' | 'brainstorm' | 'personal';

export interface Marker {
  id: string;
  time: number; // in seconds
  label: string;
}

export interface Speaker {
  id: string;
  name: string;
  color: string;
  avatar?: string;
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee?: string;
  done: boolean;
}

export interface NoteSummary {
  overview: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  decisions: string[];
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

export interface NoteMindMap {
  markdown: string;
  mermaid: string;
  rootNode: MindMapNode;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp?: number; // referenced audio timestamp
  createdAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  createdAt: string;
  duration: number; // in seconds
  category: NoteCategory;
  tags: string[];
  status: 'draft' | 'processing' | 'completed' | 'error';
  audioBlobUrl?: string;
  audioBlob?: Blob;
  markers: Marker[];
  speakers: Speaker[];
  segments: TranscriptSegment[];
  summary: NoteSummary;
  mindmap: NoteMindMap;
  chatHistory: ChatMessage[];
  memos?: Array<{ id: string; time: number; content: string }>;
}
