import { NextRequest, NextResponse } from 'next/server';
import {
  callTranscription,
  callChatCompletion,
  DEFAULT_STT_MODEL,
  DEFAULT_LLM_MODEL,
} from '@/lib/routerClient';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let audioBlob: Blob | null = null;
    let fileName = 'recording.webm';
    let prompt: string | undefined = undefined;
    let baseUrl: string | undefined = undefined;
    let apiKey: string | undefined = undefined;
    let model: string = DEFAULT_STT_MODEL;
    let language: string = 'id';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') || formData.get('audio');
      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        audioBlob = file as Blob;
        if ('name' in file && typeof file.name === 'string') {
          fileName = file.name;
        }
      }

      prompt =
        (formData.get('prompt') as string) ||
        (formData.get('glossary') as string) ||
        undefined;
      baseUrl = (formData.get('baseUrl') as string) || undefined;
      apiKey = (formData.get('apiKey') as string) || undefined;
      const formModel = formData.get('model') as string;
      if (formModel) model = formModel;
      const formLang = formData.get('language') as string;
      if (formLang) language = formLang;
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      const {
        audioBase64,
        mimeType = 'audio/webm',
        fileName: jsonFileName,
        glossary,
        prompt: jsonPrompt,
        baseUrl: jsonBaseUrl,
        apiKey: jsonApiKey,
        model: jsonModel,
        language: jsonLang,
      } = body;

      if (jsonFileName) fileName = jsonFileName;
      if (jsonPrompt || glossary) prompt = jsonPrompt || glossary;
      if (jsonBaseUrl) baseUrl = jsonBaseUrl;
      if (jsonApiKey) apiKey = jsonApiKey;
      if (jsonModel) model = jsonModel;
      if (jsonLang) language = jsonLang;

      if (audioBase64) {
        // Strip data url prefix if included
        const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        audioBlob = new Blob([buffer], { type: mimeType });
      }
    }

    if (!audioBlob) {
      return NextResponse.json(
        { ok: false, error: 'Tidak ada berkas audio yang dikirimkan.' },
        { status: 400 }
      );
    }

    // Try standard STT endpoint (/audio/transcriptions)
    try {
      const transcriptionResult = await callTranscription({
        baseUrl,
        apiKey,
        model,
        audioBlob,
        fileName,
        prompt,
        language,
      });

      if (transcriptionResult && transcriptionResult.text && transcriptionResult.text.trim()) {
        return NextResponse.json({
          ok: true,
          text: transcriptionResult.text.trim(),
        });
      }
    } catch (sttErr) {
      console.warn(
        'Standard STT /audio/transcriptions failed, attempting Gemini multimodal transcription fallback:',
        sttErr
      );
    }

    // Fallback: Gemini multimodal input_audio via chat/completions
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');

      let audioFormat = 'webm';
      if (fileName.endsWith('.mp3')) audioFormat = 'mp3';
      else if (fileName.endsWith('.wav')) audioFormat = 'wav';
      else if (fileName.endsWith('.m4a') || fileName.endsWith('.mp4')) audioFormat = 'mp4';

      const completion = await callChatCompletion({
        baseUrl,
        apiKey,
        model: model || DEFAULT_LLM_MODEL,
        messages: [
          {
            role: 'system',
            content: `Kamu adalah audio transcriber profesional. Dengarkan rekaman audio ini dan transkripsikan seluruh kata demi kata (verbatim) yang diucapkan secara akurat dalam Bahasa Indonesia atau bahasa aslinya. Jika ada istilah Korea, judul komik, nama orang, atau singkatan (seperti 별이삼샵, Hyeono, *23#, Cyworld, Anycall, dll.), tuliskan dengan tepat. Kembalikan HANYA teks transkripsi murni tanpa pengantar atau penutup.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Transkripsikan seluruh isi audio ini. ${prompt ? `Kamus istilah / Glossary: ${prompt}` : ''}`,
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: base64Data,
                  format: audioFormat,
                },
              },
            ] as unknown as string,
          },
        ],
        temperature: 0.1,
      });

      const transcribedText = completion.choices?.[0]?.message?.content || '';
      if (transcribedText && transcribedText.trim()) {
        return NextResponse.json({
          ok: true,
          text: transcribedText.trim(),
        });
      }
    } catch (multimodalErr) {
      console.error('Multimodal audio transcription also failed:', multimodalErr);
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'Gagal mentranskripsi audio. Pastikan 9router aktif dan mendukung model STT atau Gemini.',
      },
      { status: 500 }
    );
  } catch (err: unknown) {
    console.error('Error in /api/transcribe:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
