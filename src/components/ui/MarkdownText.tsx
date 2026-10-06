'use client';

import React from 'react';

interface MarkdownTextProps {
  content: string;
  className?: string;
}

/**
 * Format inline text styles: bold (**text**), italic (*text* or _text_), and inline code (`code`)
 */
function formatInline(text: string): React.ReactNode {
  // Regex to split and capture **bold**, *italic*, `code`
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-semibold text-inherit">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-inherit">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="font-mono text-[11px] px-1 py-0.5 rounded bg-black/5 dark:bg-white/10"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/**
 * Lightweight, robust Markdown renderer for chat messages.
 * Handles paragraphs, lists (* item or - item), bold, italic, code, and linebreaks.
 */
export const MarkdownText: React.FC<MarkdownTextProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Normalize single linebreaks with bullet markers:
  // Sometimes LLMs return "Heading: * item 1 * item 2" in a single line.
  let normalized = content
    .replace(/\s+\*\s+\*\*/g, '\n* **')
    .replace(/\s+-\s+\*\*/g, '\n- **');

  const lines = normalized.split('\n');

  return (
    <div className={`space-y-1.5 leading-relaxed ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1" />;
        }

        // Bullet point line (* item or - item)
        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
        if (isBullet) {
          const bulletContent = trimmed.slice(2).trim();
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1">
              <span className="text-[#787774] select-none text-xs leading-5">•</span>
              <div className="flex-1 min-w-0">{formatInline(bulletContent)}</div>
            </div>
          );
        }

        // Numbered list item (1. item)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          const num = numMatch[1];
          const numContent = numMatch[2];
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1">
              <span className="text-[#787774] select-none font-mono text-xs leading-5">
                {num}.
              </span>
              <div className="flex-1 min-w-0">{formatInline(numContent)}</div>
            </div>
          );
        }

        // Regular paragraph
        return <p key={lineIdx}>{formatInline(trimmed)}</p>;
      })}
    </div>
  );
};
