'use client';

import React, { useState, useEffect } from 'react';
import {
  Server,
  Cpu,
  BookA,
  Check,
  RefreshCw,
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import {
  getClientSettings,
  saveClientSettings,
  DEFAULT_SETTINGS,
} from '@/lib/settings';

interface SettingsViewProps {
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onResetData }) => {
  const [gatewayUrl, setGatewayUrl] = useState(DEFAULT_SETTINGS.baseUrl);
  const [apiKey, setApiKey] = useState(DEFAULT_SETTINGS.apiKey);
  const [whisperModel, setWhisperModel] = useState(DEFAULT_SETTINGS.sttModel);
  const [llmModel, setLlmModel] = useState(DEFAULT_SETTINGS.llmModel);
  const [customVocab, setCustomVocab] = useState(DEFAULT_SETTINGS.glossary);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Health check test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    ok: boolean;
    status: string;
    models?: string[];
    error?: string;
  } | null>(null);

  // Load saved settings from localStorage
  useEffect(() => {
    const settings = getClientSettings();
    setGatewayUrl(settings.baseUrl);
    setApiKey(settings.apiKey);
    setWhisperModel(settings.sttModel);
    setLlmModel(settings.llmModel);
    setCustomVocab(settings.glossary);
  }, []);

  const handleSaveSettings = () => {
    saveClientSettings({
      baseUrl: gatewayUrl,
      apiKey: apiKey,
      sttModel: whisperModel,
      llmModel: llmModel,
      glossary: customVocab,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const url = `/api/health?baseUrl=${encodeURIComponent(gatewayUrl.trim())}&apiKey=${encodeURIComponent(apiKey.trim())}`;
      const res = await fetch(url);
      const data = await res.json();
      setTestResult({
        tested: true,
        ok: data.ok,
        status: data.status,
        models: data.models,
        error: data.error,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setTestResult({
        tested: true,
        ok: false,
        status: 'offline',
        error: message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Notion Page Header */}
      <div className="space-y-2">
        <div className="text-3xl select-none">⚙️</div>
        <div className="border-b border-[#e7e7e5] pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#37352f] tracking-tight">
            Pengaturan & AI Gateway (9router)
          </h1>
          <p className="text-sm text-[#787774] mt-1">
            Konfigurasi koneksi model speech-to-text, LLM perangkuman, dan kamus istilah personal.
          </p>
        </div>
      </div>

      {/* 9router Status Test Card */}
      {testResult && (
        <div
          className={`p-4 rounded-lg border text-xs sm:text-sm transition-all ${
            testResult.ok
              ? 'bg-[#edf3ec] border-[#d3e5d2] text-[#2b6e4f]'
              : 'bg-[#fdf2f2] border-[#f8d7da] text-[#c53030]'
          }`}
        >
          <div className="flex items-start gap-3">
            {testResult.ok ? (
              <CheckCircle2 className="h-5 w-5 text-[#2b6e4f] shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-[#c53030] shrink-0 mt-0.5" />
            )}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="font-semibold flex items-center justify-between">
                <span>
                  {testResult.ok
                    ? '9router Terhubung Berhasil!'
                    : '9router Tidak Terjangkau (Offline)'}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/70 border border-current">
                  {testResult.ok ? 'Status: 200 OK' : 'Status: Offline'}
                </span>
              </div>

              {testResult.ok ? (
                <div>
                  <p className="text-xs text-[#2b6e4f]/90 leading-relaxed">
                    Gateway aktif dan siap melayani permintaan transkripsi audio dan chat LLM.
                  </p>
                  {testResult.models && testResult.models.length > 0 && (
                    <div className="mt-2 text-xs">
                      <span className="font-medium">Model terdeteksi: </span>
                      <span className="font-mono text-[11px]">
                        {testResult.models.slice(0, 5).join(', ')}
                        {testResult.models.length > 5 ? ` (+${testResult.models.length - 5} lainnya)` : ''}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs leading-relaxed text-[#c53030]">
                    Koneksi ke <code className="font-mono bg-white/80 px-1 py-0.5 rounded">{gatewayUrl}</code> gagal: {testResult.error || 'Server tidak merespons'}.
                  </p>
                  <div className="p-2.5 rounded bg-white/80 border border-[#f8d7da] text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-[#37352f]">
                      <Terminal className="h-3.5 w-3.5" />
                      <span>Panduan Menjalankan 9router di Terminal:</span>
                    </div>
                    <p className="text-[#5a5a58]">
                      Jalankan perintah berikut pada Command Prompt atau PowerShell:
                    </p>
                    <code className="block bg-[#f7f6f3] text-[#37352f] p-1.5 rounded font-mono text-[11px] border border-[#e7e7e5]">
                      9router -p 20128
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 9router Endpoint Form (Notion Card Style) */}
      <div className="p-5 rounded-lg bg-white border border-[#e7e7e5] space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-[#edf5fa] text-[#286b97] flex items-center justify-center border border-[#d3e5f3]">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#37352f]">
                9router Local Endpoint URL
              </h3>
              <p className="text-xs text-[#787774]">
                Endpoint gateway lokal yang kompatibel dengan format OpenAI API.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#f7f6f3] text-[#286b97] border border-[#d3e5f3] text-xs font-medium transition-colors shadow-xs"
          >
            <Activity className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Mengecek...' : 'Tes Koneksi'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#787774] mb-1">
              Base URL (Homeserver 9router)
            </label>
            <input
              type="text"
              value={gatewayUrl}
              onChange={(e) => setGatewayUrl(e.target.value)}
              placeholder="http://100.79.100.111:20128/v1"
              className="w-full px-3 py-1.5 rounded-md bg-[#f7f6f3] border border-[#e7e7e5] text-xs sm:text-sm text-[#37352f] font-mono focus:outline-none focus:border-[#2383e2]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#787774] mb-1">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-1.5 rounded-md bg-[#f7f6f3] border border-[#e7e7e5] text-xs sm:text-sm text-[#37352f] font-mono focus:outline-none focus:border-[#2383e2]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-medium text-[#787774] mb-1 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-[#286b97]" />
              <span>Model Transkripsi & Audio STT</span>
            </label>
            <input
              type="text"
              value={whisperModel}
              onChange={(e) => setWhisperModel(e.target.value)}
              placeholder="ag/gemini-3.8-flash-medium"
              className="w-full px-3 py-1.5 rounded-md bg-[#f7f6f3] border border-[#e7e7e5] text-xs sm:text-sm text-[#37352f] font-mono focus:outline-none focus:border-[#2383e2]"
            />
            <p className="text-[10px] text-[#9b9a97] mt-1">
              Rekomendasi: <code className="font-mono">ag/gemini-3.8-flash-medium</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#787774] mb-1 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-[#6940a5]" />
              <span>Model LLM (Ringkasan & Chat)</span>
            </label>
            <input
              type="text"
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
              placeholder="ag/gemini-3.8-flash-medium"
              className="w-full px-3 py-1.5 rounded-md bg-[#f7f6f3] border border-[#e7e7e5] text-xs sm:text-sm text-[#37352f] font-mono focus:outline-none focus:border-[#2383e2]"
            />
            <p className="text-[10px] text-[#9b9a97] mt-1">
              Rekomendasi: <code className="font-mono">ag/gemini-3.8-flash-medium</code>
            </p>
          </div>
        </div>
      </div>

      {/* Personal Glossary / Vocabulary */}
      <div className="p-5 rounded-lg bg-white border border-[#e7e7e5] space-y-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-[#f4f0f7] text-[#6940a5] flex items-center justify-center border border-[#e2d9f3]">
            <BookA className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#37352f]">
              Kamus Kosakata Personal (Custom Glossary)
            </h3>
            <p className="text-xs text-[#787774]">
              Daftar istilah khusus, nama orang, atau singkatan agar tidak salah dikenali AI saat transkripsi suara.
            </p>
          </div>
        </div>

        <textarea
          rows={3}
          value={customVocab}
          onChange={(e) => setCustomVocab(e.target.value)}
          placeholder="Pisahkan dengan koma (contoh: BPM, Telkom University, Ariq Nayaka, MQTT, LoRaWAN)..."
          className="w-full p-3 rounded-md bg-[#f7f6f3] border border-[#e7e7e5] text-xs sm:text-sm text-[#37352f] font-mono focus:outline-none focus:border-[#2383e2] leading-relaxed"
        />
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => {
            if (confirm('Pulihkan sampel data default ke IndexedDB?')) {
              onResetData();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#fbebee] text-[#787774] hover:text-[#eb5757] border border-[#e7e7e5] text-xs font-medium transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reset Sample Notes</span>
        </button>

        <button
          type="button"
          onClick={handleSaveSettings}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#2383e2] hover:bg-[#1a73ca] text-white font-medium text-xs shadow-xs transition-colors"
        >
          {savedSuccess ? <Check className="h-3.5 w-3.5 text-white" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Konfigurasi'}</span>
        </button>
      </div>
    </div>
  );
};
