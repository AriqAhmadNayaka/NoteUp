/**
 * 9router Client Helper
 * NoteUp AI integration with OpenAI-compatible gateway (9router)
 */

export const DEFAULT_ROUTER_BASE_URL =
  process.env.ROUTER_BASE_URL || 'http://127.0.0.1:20128/v1';
export const DEFAULT_ROUTER_API_KEY =
  process.env.ROUTER_API_KEY || '';
export const DEFAULT_LLM_MODEL =
  process.env.ROUTER_LLM_MODEL || 'ag/gemini-3.8-flash-medium';
export const DEFAULT_STT_MODEL =
  process.env.ROUTER_STT_MODEL || 'ag/gemini-3.8-flash-medium';

/**
 * Normalize router base URL to ensure proper endpoint structure
 */
export function normalizeBaseUrl(url?: string): string {
  let base = (url || DEFAULT_ROUTER_BASE_URL).trim();
  // Strip trailing slash
  base = base.replace(/\/+$/, '');
  // If user only provided origin like http://100.79.100.111:20128, append /v1
  if (!base.endsWith('/v1')) {
    base = `${base}/v1`;
  }
  return base;
}

export interface ChatMessageParam {
  role: 'system' | 'user' | 'assistant';
  content: string | unknown[];
}

export interface ChatCompletionOptions {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  messages: ChatMessageParam[];
  temperature?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
}

export interface TranscriptionOptions {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  audioBlob: Blob | File;
  fileName?: string;
  prompt?: string;
  language?: string;
  timeoutMs?: number;
}

/**
 * Health check helper for 9router
 */
export async function checkRouterHealth(
  baseUrl?: string,
  apiKey?: string,
  timeoutMs: number = 5000
): Promise<{ ok: boolean; status: string; models?: string[]; error?: string }> {
  const normalized = normalizeBaseUrl(baseUrl);
  const key = apiKey || DEFAULT_ROUTER_API_KEY;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${normalized}/models`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${key}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        ok: false,
        status: 'error',
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    const models: string[] = Array.isArray(data?.data)
      ? data.data.map((m: { id?: string }) => m.id || String(m))
      : [];

    return {
      ok: true,
      status: 'connected',
      models,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      status: 'offline',
      error: message,
    };
  }
}

/**
 * Call /v1/chat/completions on 9router
 */
export async function callChatCompletion({
  baseUrl,
  apiKey,
  model = DEFAULT_LLM_MODEL,
  messages,
  temperature = 0.3,
  jsonMode = false,
  timeoutMs = 90000,
}: ChatCompletionOptions) {
  const normalized = normalizeBaseUrl(baseUrl);
  const key = apiKey || DEFAULT_ROUTER_API_KEY;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body: Record<string, unknown> = {
      model,
      stream: false,
      messages,
      temperature,
    };

    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(`${normalized}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`9router Chat HTTP ${res.status}: ${errText || res.statusText}`);
    }

    return await res.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Call /v1/audio/transcriptions on 9router
 */
export async function callTranscription({
  baseUrl,
  apiKey,
  model = DEFAULT_STT_MODEL,
  audioBlob,
  fileName = 'audio.webm',
  prompt,
  language = 'id',
  timeoutMs = 120000,
}: TranscriptionOptions): Promise<{ text: string }> {
  const normalized = normalizeBaseUrl(baseUrl);
  const key = apiKey || DEFAULT_ROUTER_API_KEY;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const formData = new FormData();
    formData.append('file', audioBlob, fileName);
    formData.append('model', model);
    if (prompt) {
      formData.append('prompt', prompt);
    }
    if (language) {
      formData.append('language', language);
    }
    formData.append('response_format', 'json');

    const res = await fetch(`${normalized}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`9router STT HTTP ${res.status}: ${errText || res.statusText}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return { text: json.text || json.transcript || '' };
    } else {
      const text = await res.text();
      return { text };
    }
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Fetch available models from 9router
 */
export async function fetchModels(baseUrl?: string): Promise<string[]> {
  const res = await checkRouterHealth(baseUrl);
  return res.models || [];
}
