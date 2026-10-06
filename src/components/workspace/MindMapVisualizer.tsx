'use client';

import React, { useState } from 'react';
import { Copy, Check, ZoomIn, ZoomOut, ChevronRight, ChevronDown, GitBranch } from 'lucide-react';
import { MindMapNode, NoteMindMap } from '@/types/note';

interface MindMapVisualizerProps {
  mindmap: NoteMindMap;
  title: string;
}

// Recursive visual tree node component (Notion Style)
const TreeNode: React.FC<{ node: MindMapNode; depth?: number }> = ({ node, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col my-1.5 ml-4 sm:ml-6 relative">
      {/* Connector lines (Notion subtle gray) */}
      <div className="absolute -left-3 sm:-left-4 top-3.5 bottom-0 w-px bg-[#d3d2cf]" />
      <div className="absolute -left-3 sm:-left-4 top-3.5 w-3 sm:w-4 h-px bg-[#d3d2cf]" />

      <div className="flex items-center gap-1.5 group">
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 rounded hover:bg-[rgba(55,53,47,0.08)] text-[#787774] hover:text-[#37352f] transition-colors"
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <div className="w-4 h-4 flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9b9a97]" />
          </div>
        )}

        <div
          className={`px-3 py-1.5 rounded-md text-xs sm:text-sm transition-all border shadow-xs ${
            depth === 0
              ? 'bg-[#37352f] text-white border-[#202020] font-bold'
              : depth === 1
              ? 'bg-white border-[#d3e5f3] text-[#286b97] font-semibold bg-[#edf5fa]'
              : 'bg-white border-[#e7e7e5] text-[#37352f] hover:border-[#b4b3b0]'
          }`}
        >
          {node.label}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col mt-0.5">
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const MindMapVisualizer: React.FC<MindMapVisualizerProps> = ({ mindmap, title }) => {
  const [copiedType, setCopiedType] = useState<'mermaid' | 'markdown' | null>(null);
  const [scale, setScale] = useState(1);

  const copyToClipboard = (text: string, type: 'mermaid' | 'markdown') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Mindmap Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-[#f7f6f3] rounded-lg border border-[#e7e7e5]">
        <div className="flex items-center gap-2 text-xs text-[#787774]">
          <GitBranch className="h-4 w-4 text-[#37352f]" />
          <span className="font-medium text-[#37352f]">Diagram Mind Map Interaktif</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-white rounded-md border border-[#e7e7e5] p-0.5 shadow-xs">
            <button
              onClick={() => setScale((prev) => Math.max(0.7, prev - 0.1))}
              className="p-1 hover:bg-[rgba(55,53,47,0.06)] rounded text-[#787774] hover:text-[#37352f]"
              title="Perkecil"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-[#787774]">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((prev) => Math.min(1.4, prev + 0.1))}
              className="p-1 hover:bg-[rgba(55,53,47,0.06)] rounded text-[#787774] hover:text-[#37352f]"
              title="Perbesar"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Copy Mermaid */}
          <button
            onClick={() => copyToClipboard(mindmap.mermaid, 'mermaid')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-[#f7f6f3] text-[#37352f] border border-[#e7e7e5] text-xs font-medium transition-colors shadow-xs"
          >
            {copiedType === 'mermaid' ? <Check className="h-3.5 w-3.5 text-[#2b6e4f]" /> : <Copy className="h-3.5 w-3.5 text-[#787774]" />}
            <span>{copiedType === 'mermaid' ? 'Mermaid Tersalin!' : 'Copy Mermaid'}</span>
          </button>

          {/* Copy Markdown */}
          <button
            onClick={() => copyToClipboard(mindmap.markdown, 'markdown')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-[#f7f6f3] text-[#37352f] border border-[#e7e7e5] text-xs font-medium transition-colors shadow-xs"
          >
            {copiedType === 'markdown' ? <Check className="h-3.5 w-3.5 text-[#2b6e4f]" /> : <Copy className="h-3.5 w-3.5 text-[#787774]" />}
            <span>{copiedType === 'markdown' ? 'Markdown Tersalin!' : 'Copy Markdown'}</span>
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="relative p-6 sm:p-8 rounded-lg bg-[#ffffff] border border-[#e7e7e5] overflow-x-auto min-h-[340px] flex items-center justify-start shadow-xs">
        <div
          className="transition-transform origin-top-left"
          style={{ transform: `scale(${scale})` }}
        >
          <TreeNode node={mindmap.rootNode} depth={0} />
        </div>
      </div>
    </div>
  );
};
