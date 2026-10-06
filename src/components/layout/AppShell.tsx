'use client';

import React, { useState, useEffect } from 'react';
import {
  Mic,
  FolderOpen,
  Settings,
  Plus,
  ArrowLeft,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Radio,
  FileText,
  Search,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getClientSettings, SETTINGS_CHANGE_EVENT } from '@/lib/settings';

export type ActiveTab = 'studio' | 'library' | 'workspace' | 'settings';

interface AppShellProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedNoteTitle?: string;
  onBackToLibrary?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  setActiveTab,
  selectedNoteTitle,
  onBackToLibrary,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [routerStatus, setRouterStatus] = useState<'connected' | 'offline' | 'checking'>('checking');

  const checkStatus = async () => {
    try {
      const settings = getClientSettings();
      const res = await fetch(
        `/api/health?baseUrl=${encodeURIComponent(settings.baseUrl)}&apiKey=${encodeURIComponent(settings.apiKey)}`
      );
      const data = await res.json();
      setRouterStatus(data.ok ? 'connected' : 'offline');
    } catch {
      setRouterStatus('offline');
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    const handleSettingsChange = () => checkStatus();
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    };
  }, []);

  return (
    <div className="flex h-screen w-full bg-white text-[#37352f] overflow-hidden font-sans">
      {/* Desktop Left Sidebar (Notion Design Language) */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-[#e7e7e5] bg-[#f7f6f3] justify-between shrink-0 transition-all duration-200 select-none z-20',
          isSidebarCollapsed ? 'w-14 p-2 items-center' : 'w-64 p-3'
        )}
      >
        <div className="space-y-4 w-full">
          {/* Workspace Switcher Header */}
          <div className="flex items-center justify-between pb-1 border-b border-[#e7e7e5]/60">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-2 px-1 py-1 rounded-md hover:bg-[rgba(55,53,47,0.06)] transition-colors cursor-pointer flex-1 min-w-0 mr-1">
                <div className="h-6 w-6 rounded bg-[#2383e2] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  N
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold text-[13.5px] text-[#37352f] truncate">
                    Ariq&apos;s NoteUp
                  </span>
                  <ChevronDown className="h-3 w-3 text-[#787774] shrink-0" />
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsSidebarCollapsed(false)}
                className="h-7 w-7 rounded bg-[#2383e2] text-white flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                title="Buka Sidebar"
              >
                N
              </div>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded hover:bg-[rgba(55,53,47,0.08)] text-[#787774] hover:text-[#37352f] transition-colors"
              title={isSidebarCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            >
              {isSidebarCollapsed ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <ChevronsLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Quick Action: New Recording / Document */}
          {!isSidebarCollapsed ? (
            <button
              onClick={() => setActiveTab('studio')}
              className="w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md bg-white border border-[#e7e7e5] hover:bg-[rgba(55,53,47,0.04)] text-[#37352f] font-medium text-[13px] shadow-xs transition-colors group"
            >
              <div className="h-4 w-4 rounded-full bg-[#eb5757] text-white flex items-center justify-center shrink-0">
                <Plus className="h-3 w-3" />
              </div>
              <span className="truncate">Rekam / Catatan Baru</span>
              <span className="ml-auto text-[10px] text-[#9b9a97] font-mono border border-[#e7e7e5] px-1 rounded bg-[#f7f6f3]">
                Studio
              </span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('studio')}
              className="h-8 w-8 mx-auto rounded-md bg-white border border-[#e7e7e5] hover:bg-[rgba(55,53,47,0.06)] text-[#eb5757] flex items-center justify-center shadow-xs"
              title="Rekam Baru"
            >
              <Mic className="h-4 w-4" />
            </button>
          )}

          {/* Section: Main Navigation */}
          <div className="space-y-0.5">
            {!isSidebarCollapsed && (
              <div className="px-2 pt-2 pb-1 text-[11px] font-semibold text-[#9b9a97] uppercase tracking-wider">
                Workspace
              </div>
            )}

            <button
              onClick={() => setActiveTab('library')}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13.5px] transition-colors',
                activeTab === 'library' || activeTab === 'workspace'
                  ? 'bg-[rgba(55,53,47,0.08)] text-[#37352f] font-semibold'
                  : 'text-[#5a5a58] hover:bg-[rgba(55,53,47,0.05)] hover:text-[#37352f]'
              )}
              title={isSidebarCollapsed ? 'Catatan & Library' : undefined}
            >
              <FolderOpen className="h-4 w-4 text-[#787774] shrink-0" />
              {!isSidebarCollapsed && <span>Catatan & Library</span>}
            </button>

            <button
              onClick={() => setActiveTab('studio')}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13.5px] transition-colors',
                activeTab === 'studio'
                  ? 'bg-[rgba(55,53,47,0.08)] text-[#37352f] font-semibold'
                  : 'text-[#5a5a58] hover:bg-[rgba(55,53,47,0.05)] hover:text-[#37352f]'
              )}
              title={isSidebarCollapsed ? 'Studio Rekaman' : undefined}
            >
              <Mic className="h-4 w-4 text-[#787774] shrink-0" />
              {!isSidebarCollapsed && <span>Studio & Perekam</span>}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13.5px] transition-colors',
                activeTab === 'settings'
                  ? 'bg-[rgba(55,53,47,0.08)] text-[#37352f] font-semibold'
                  : 'text-[#5a5a58] hover:bg-[rgba(55,53,47,0.05)] hover:text-[#37352f]'
              )}
              title={isSidebarCollapsed ? 'Pengaturan 9router' : undefined}
            >
              <Settings className="h-4 w-4 text-[#787774] shrink-0" />
              {!isSidebarCollapsed && <span>Pengaturan 9router</span>}
            </button>
          </div>

          {/* Section: Notion Pages List Preview */}
          {!isSidebarCollapsed && (
            <div className="space-y-0.5 pt-2">
              <div className="px-2 pb-1 text-[11px] font-semibold text-[#9b9a97] uppercase tracking-wider flex items-center justify-between">
                <span>Database Views</span>
              </div>

              <div
                onClick={() => setActiveTab('library')}
                className="flex items-center gap-2 px-2.5 py-1 rounded-md text-[13px] text-[#5a5a58] hover:bg-[rgba(55,53,47,0.05)] hover:text-[#37352f] cursor-pointer"
              >
                <span className="text-xs">📋</span>
                <span className="truncate">Semua Transkrip</span>
              </div>
              <div
                onClick={() => setActiveTab('library')}
                className="flex items-center gap-2 px-2.5 py-1 rounded-md text-[13px] text-[#5a5a58] hover:bg-[rgba(55,53,47,0.05)] hover:text-[#37352f] cursor-pointer"
              >
                <span className="text-xs">🏛️</span>
                <span className="truncate">Rapat Pleno BPM</span>
              </div>
              <div
                onClick={() => setActiveTab('library')}
                className="flex items-center gap-2 px-2.5 py-1 rounded-md text-[13px] text-[#5a5a58] hover:bg-[rgba(55,53,47,0.05)] hover:text-[#37352f] cursor-pointer"
              >
                <span className="text-xs">🎓</span>
                <span className="truncate">Kuliah Smart City</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Sidebar Info Card */}
        {!isSidebarCollapsed ? (
          <div className="pt-3 border-t border-[#e7e7e5]/80 space-y-1.5">
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#37352f]">
              <Database className="h-3.5 w-3.5 text-[#2b6e4f]" />
              <span>IndexedDB Offline Ready</span>
            </div>
            <p className="text-[11px] text-[#9b9a97] leading-relaxed">
              Catatan & audio tersimpan otomatis di browser tanpa cloud dependency.
            </p>
          </div>
        ) : (
          <div className="p-1 rounded-full bg-[#edf3ec] text-[#2b6e4f] flex items-center justify-center" title="IndexedDB Offline Ready">
            <span className="h-2 w-2 rounded-full bg-[#2b6e4f]" />
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white">
        {/* Top Notion Header Bar */}
        <header className="h-11 border-b border-[#e7e7e5] bg-white px-4 flex items-center justify-between shrink-0 select-none z-10">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 min-w-0 text-[13px]">
            {activeTab === 'workspace' && onBackToLibrary && (
              <button
                onClick={onBackToLibrary}
                className="flex items-center gap-1 text-[#787774] hover:text-[#37352f] font-medium py-1 px-1.5 rounded hover:bg-[rgba(55,53,47,0.06)] transition-colors mr-1 shrink-0"
                title="Kembali ke Database Catatan"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="text-xs">Library</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 truncate text-[#787774]">
              <span
                onClick={() => setActiveTab('library')}
                className="hover:text-[#37352f] cursor-pointer truncate hidden sm:inline"
              >
                NoteUp
              </span>
              <span className="text-[#b4b3b0] hidden sm:inline">/</span>

              {activeTab === 'workspace' && selectedNoteTitle ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate font-medium text-[#37352f]">
                    {selectedNoteTitle}
                  </span>
                </div>
              ) : (
                <span className="font-medium text-[#37352f] truncate">
                  {activeTab === 'studio' && '🎙️ Studio Rekam & Upload'}
                  {activeTab === 'library' && '📂 Library Catatan & Database'}
                  {activeTab === 'settings' && '⚙️ Pengaturan AI Gateway'}
                </span>
              )}
            </div>
          </div>

          {/* Right Status Badge */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors',
                routerStatus === 'connected'
                  ? 'bg-[#edf3ec] text-[#2b6e4f] border-[#d3e5d2]'
                  : routerStatus === 'checking'
                  ? 'bg-[#fbf3db] text-[#89632a] border-[#f4e3b5]'
                  : 'bg-[#fdf2f2] text-[#c53030] border-[#f8d7da]'
              )}
              title="Klik untuk membuka pengaturan 9router"
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  routerStatus === 'connected'
                    ? 'bg-[#2b6e4f]'
                    : routerStatus === 'checking'
                    ? 'bg-[#89632a] animate-pulse'
                    : 'bg-[#c53030]'
                )}
              />
              <span>
                {routerStatus === 'connected'
                  ? '9router Online'
                  : routerStatus === 'checking'
                  ? 'Checking 9router...'
                  : '9router Offline'}
              </span>
            </button>
          </div>
        </header>

        {/* Page Body Container */}
        <main className="flex-1 overflow-y-auto pb-32 sm:pb-8 p-4 sm:p-8 bg-white pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))]">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Notion Style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 pb-[env(safe-area-inset-bottom,0px)] bg-white/95 backdrop-blur-md border-t border-[#e7e7e5] px-6 flex items-center justify-around z-50">
        <button
          onClick={() => setActiveTab('library')}
          className={cn(
            'flex flex-col items-center gap-0.5 py-1 transition-colors',
            activeTab === 'library' || activeTab === 'workspace'
              ? 'text-[#2383e2] font-medium'
              : 'text-[#787774] hover:text-[#37352f]'
          )}
        >
          <FolderOpen className="h-5 w-5" />
          <span className="text-[10px]">Library</span>
        </button>

        <button
          onClick={() => setActiveTab('studio')}
          className={cn(
            'flex flex-col items-center gap-0.5 py-1 transition-colors',
            activeTab === 'studio'
              ? 'text-[#eb5757] font-medium'
              : 'text-[#787774] hover:text-[#37352f]'
          )}
        >
          <Mic className="h-5 w-5" />
          <span className="text-[10px]">Rekam</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            'flex flex-col items-center gap-0.5 py-1 transition-colors',
            activeTab === 'settings'
              ? 'text-[#2383e2] font-medium'
              : 'text-[#787774] hover:text-[#37352f]'
          )}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[10px]">Pengaturan</span>
        </button>
      </nav>
    </div>
  );
};
