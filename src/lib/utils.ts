import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NoteItem } from '@/types/note';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const rounded = Math.floor(seconds);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function exportNoteAsMarkdown(note: NoteItem): string {
  const frontmatter = `---
title: "${note.title}"
date: ${note.createdAt}
duration: "${formatTime(note.duration)}"
category: ${note.category}
tags: [${note.tags.map((t) => `"${t}"`).join(', ')}]
---

`;

  const overview = `## 📌 Overview
${note.summary.overview}

`;

  const keyPoints = `## 💡 Key Discussion Points
${note.summary.keyPoints.map((pt) => `- ${pt}`).join('\n')}

`;

  const decisions =
    note.summary.decisions.length > 0
      ? `## 🎯 Keputusan Penting
${note.summary.decisions.map((d) => `- [x] ${d}`).join('\n')}

`
      : '';

  const actionItems = `## ✅ Action Items & Tasks
${note.summary.actionItems
  .map(
    (act) =>
      `- [${act.done ? 'x' : ' '}] **${act.task}** ${act.assignee ? `*(@${act.assignee})*` : ''}`
  )
  .join('\n')}

`;

  const mindmapSection = `## 🗺️ Mind Map (Mermaid)
\`\`\`mermaid
${note.mindmap.mermaid}
\`\`\`

`;

  const transcript = `## 🎙️ Transkrip Lengkap
${note.segments
  .map((seg) => {
    const spk = note.speakers.find((s) => s.id === seg.speakerId);
    const spkName = spk ? spk.name : 'Unknown';
    return `**[${formatTime(seg.start)} - ${formatTime(seg.end)}] ${spkName}:**\n${seg.text}\n`;
  })
  .join('\n')}
`;

  return frontmatter + overview + keyPoints + decisions + actionItems + mindmapSection + transcript;
}
