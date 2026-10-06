import { NextRequest, NextResponse } from 'next/server';
import {
  callChatCompletion,
  DEFAULT_LLM_MODEL,
  ChatMessageParam,
} from '@/lib/routerClient';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messages = [],
      noteContext,
      noteTitle = 'Catatan',
      baseUrl,
      apiKey,
      model = DEFAULT_LLM_MODEL,
    } = body;

    let contextString = '';
    if (typeof noteContext === 'string') {
      contextString = noteContext;
    } else if (noteContext && typeof noteContext === 'object') {
      contextString = JSON.stringify(noteContext, null, 2);
    }

    const systemPrompt = `Kamu adalah "Ask NoteUp AI", asisten pintar untuk catatan audio dan pertemuan bernama "${noteTitle}".
Kamu memiliki akses penuh ke konteks catatan di bawah ini, termasuk transkrip dengan stempel waktu detik, ringkasan, action items, keputusan, dan pembicara.

Pedoman Menjawab:
1. Jawab pertanyaan pengguna secara akurat, ramah, dan ringkas berdasarkan fakta yang ada di konteks catatan.
2. Jika pengguna menanyakan tentang tugas, anggaran, jadwal, atau keputusan tertentu, cari di transkrip atau poin ringkasan.
3. JIKA jawabanmu merujuk pada percakapan atau momen spesifik yang memiliki detik/waktu di transkrip (misal detik ke-45 atau 01:15 = 75), sertakan tag di paling akhir jawaban dengan format:
   [TIMESTAMP: <angka_detik>]
   Contoh: "Anggaran merchandise dibahas oleh Citra sebesar Rp2.500.000. [TIMESTAMP: 73]"
4. Jika tidak ada momen audio spesifik yang dirujuk, JANGAN sertakan tag TIMESTAMP.
5. Gunakan bahasa Indonesia yang luwes dan natural.

Konteks Catatan:
"""
${contextString}
"""`;

    const formattedMessages: ChatMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; text?: string; content?: string }) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content || m.text || '',
      })),
    ];

    const completion = await callChatCompletion({
      baseUrl,
      apiKey,
      model,
      messages: formattedMessages,
      temperature: 0.3,
    });

    const replyRaw = completion.choices?.[0]?.message?.content || '';

    // Extract [TIMESTAMP: \d+] if present
    const timestampMatch = replyRaw.match(/\[TIMESTAMP:\s*(\d+)\]/i);
    let timestamp: number | undefined = undefined;
    let cleanText = replyRaw;

    if (timestampMatch) {
      timestamp = parseInt(timestampMatch[1], 10);
      cleanText = cleanText.replace(/\[TIMESTAMP:\s*(\d+)\]/gi, '').trim();
    }

    return NextResponse.json({
      ok: true,
      text: cleanText,
      timestamp,
    });
  } catch (err: unknown) {
    console.error('Error in /api/chat:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        text: `Maaf, terjadi kendala saat menghubungi 9router: ${message}. Pastikan 9router aktif dan terhubung.`,
      },
      { status: 500 }
    );
  }
}
