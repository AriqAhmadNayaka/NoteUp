import { NextRequest, NextResponse } from 'next/server';
import { callChatCompletion, DEFAULT_LLM_MODEL } from '@/lib/routerClient';

export const dynamic = 'force-dynamic';

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  // Strip markdown code block wrappers like ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
    cleaned = cleaned.replace(/\n?```\s*$/i, '');
  }
  // If there's still text before the first '{', find it
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title = 'Catatan Tanpa Judul',
      content = '',
      segments: existingSegments = [],
      category = 'meeting',
      glossary = '',
      baseUrl,
      apiKey,
      model = DEFAULT_LLM_MODEL,
      duration = 60,
    } = body;

    if (!content.trim() && (!existingSegments || existingSegments.length === 0)) {
      return NextResponse.json(
        { ok: false, error: 'Konten atau transkrip tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const categoryInstructions: Record<string, string> = {
      meeting:
        'Format NOTULEN RAPAT FORMAL: Identifikasi pembicara (diarization), ringkas overview eksekutif, poin-poin keputusan yang disepakati, dan daftar action items dengan assignee yang spesifik.',
      lecture:
        'Format KULIAH & PEMBELAJARAN: Identifikasi pengajar dan peserta tanya-jawab, ringkas konsep teori utama, poin-poin penjelasan penting, kesimpulan materi, dan tugas/bacaan lanjutan.',
      brainstorm:
        'Format BRAINSTORMING & IDEASI: Identifikasi kontributor gagasan, catat klaster-klaster ide kreatif, evaluasi pro-kontra, konsensus tim, dan langkah validasi prototipe.',
      personal:
        'Format JURNAL & REFLEKSI PERSONAL: Catat insight pribadi, pemikiran kunci, evaluasi diri, dan resolusi langkah selanjutnya.',
    };

    const specificGuidance = categoryInstructions[category] || categoryInstructions.meeting;

    const systemPrompt = `Kamu adalah AI transkripsi dan asisten notulen profesional untuk NoteUp.
Tugas utamamu adalah menganalisis transkrip rekaman atau catatan audio dan menghasilkan struktur data JSON yang valid dan kaya informasi.

Instruksi Analisis:
1. ${specificGuidance}
2. Jika ada istilah teknis atau singkatan dalam daftar glossary (${glossary || 'tidak ada'}), pastikan dieja dengan tepat.
3. Petakan pembicara (Speakers) dengan ID 'spk-1', 'spk-2', dst. Berikan nama yang masuk akal dan warna hex (pilihan warna: #286b97, #2b6e4f, #6940a5, #89632a, #eb5757).
4. Buat segments transkrip berdurasi proporsional (total durasi perkiraan: ${duration} detik). Setiap segmen harus memiliki 'id', 'speakerId', 'start', 'end', dan 'text'.
5. Buat Action Items yang actionable dengan 'id' (misal: 'act-1'), 'task', 'assignee', dan 'done': false.
6. Buat Mind Map dalam 3 bentuk:
   - 'markdown': Markdown berjenjang (# Judul, ## Cabang, - Subcabang)
   - 'mermaid': Format mermaid mindmap yang valid (contoh: "mindmap\\n  root((Judul))\\n    Poin 1\\n      Sub 1\\n    Poin 2")
   - 'rootNode': Objek hierarki tree { "id": "root", "label": "...", "children": [ { "id": "c1", "label": "...", "children": [...] } ] }

PENTING:
- Kembalikan HANYA JSON murni tanpa pengantar atau penutup.
- Jangan gunakan markdown format backtick jika memungkinkan.
- Pastikan semua string di-escape dengan benar sehingga JSON valid parsed oleh JSON.parse().

Format JSON yang DIHARUSKAN:
{
  "overview": "Ringkasan komprehensif...",
  "keyPoints": ["Poin 1", "Poin 2", "Poin 3"],
  "decisions": ["Keputusan 1", "Keputusan 2"],
  "actionItems": [
    { "id": "act-1", "task": "Deskripsi tugas", "assignee": "Nama orang / Tim", "done": false }
  ],
  "speakers": [
    { "id": "spk-1", "name": "Pembicara 1", "color": "#286b97" },
    { "id": "spk-2", "name": "Pembicara 2", "color": "#2b6e4f" }
  ],
  "segments": [
    { "id": "seg-1", "speakerId": "spk-1", "start": 0, "end": 15, "text": "..." }
  ],
  "mindmap": {
    "markdown": "# ${title}\\n## Cabang A\\n- Sub 1",
    "mermaid": "mindmap\\n  root((${title}))\\n    Cabang A\\n      Sub 1",
    "rootNode": {
      "id": "root",
      "label": "${title}",
      "children": [
        { "id": "node-1", "label": "Cabang A", "children": [{ "id": "node-1-1", "label": "Sub 1" }] }
      ]
    }
  }
}`;

    const userPrompt = `Judul: ${title}
Kategori: ${category}
Kamus Istilah (Glossary): ${glossary || 'Tidak ada'}
Total Durasi Audio (Detik): ${duration}

Transkrip / Konten:
"""
${content}
"""

Silakan hasilkan output JSON sesuai spesifikasi.`;

    const completion = await callChatCompletion({
      baseUrl,
      apiKey,
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      jsonMode: true,
    });

    const rawResponse = completion.choices?.[0]?.message?.content || '{}';
    const cleaned = cleanJsonString(rawResponse);

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleaned);
    } catch (parseError) {
      console.warn('Failed to parse 9router JSON directly, attempting recovery:', parseError);
      // Fallback basic wrapper if JSON parse fails
      parsedResult = {
        overview: rawResponse.substring(0, 300),
        keyPoints: ['Poin utama dari rekaman audio telah diproses.'],
        decisions: ['Kesepakatan tindak lanjut dicatat.'],
        actionItems: [
          {
            id: 'act-1',
            task: 'Tinjau kembali hasil ringkasan catatan',
            assignee: 'Tim',
            done: false,
          },
        ],
        speakers: [
          { id: 'spk-1', name: 'Pembicara 1', color: '#286b97' },
        ],
        segments: [
          {
            id: 'seg-1',
            speakerId: 'spk-1',
            start: 0,
            end: Math.max(duration, 30),
            text: content || 'Konten rekaman audio',
          },
        ],
        mindmap: {
          markdown: `# ${title}\n## Poin Utama\n- ${content.substring(0, 80)}`,
          mermaid: `mindmap\n  root((${title}))\n    Ringkasan\n      Poin Utama`,
          rootNode: {
            id: 'root',
            label: title,
            children: [{ id: 'c1', label: 'Ringkasan Utama' }],
          },
        },
      };
    }

    return NextResponse.json({
      ok: true,
      data: parsedResult,
    });
  } catch (err: unknown) {
    console.error('Error in /api/summarize:', err);
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
