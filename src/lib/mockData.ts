import { NoteItem } from '@/types/note';

export const SAMPLE_NOTES: NoteItem[] = [
  {
    id: 'note-bpm-pleno-2026',
    title: 'Rapat Pleno BPM 2026: Evaluasi Proker & Alokasi Anggaran',
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    duration: 184, // 3m 4s sample
    category: 'meeting',
    tags: ['BPM 2026', 'Anggaran', 'Organisasi'],
    status: 'completed',
    markers: [
      { id: 'm1', time: 15, label: 'Pembahasan Anggaran Divisi' },
      { id: 'm2', time: 75, label: 'Persetujuan Dana Cadangan' },
      { id: 'm3', time: 130, label: 'Keputusan Tanggal Sidang Pleno' },
    ],
    speakers: [
      { id: 'spk-1', name: 'Ariq Nayaka (Ketua BPM)', color: '#3b82f6' },
      { id: 'spk-2', name: 'Citra (Bendahara)', color: '#10b981' },
      { id: 'spk-3', name: 'Dimas (Komisi Pengawasan)', color: '#f59e0b' },
    ],
    segments: [
      {
        id: 's1',
        speakerId: 'spk-1',
        start: 0,
        end: 18,
        text: 'Selamat sore rekan-rekan BPM. Agenda rapat pleno hari ini kita fokuskan untuk evaluasi serapan anggaran semester awal dan penyesuaian dana program kerja.',
      },
      {
        id: 's2',
        speakerId: 'spk-2',
        start: 19,
        end: 45,
        text: 'Terima kasih Ariq. Dari laporan bendahara, alokasi untuk kegiatan aspirasi mahasiswa saat ini tersisa sekitar 40%. Namun divisi humas mengajukan tambahan pengadaan merchandise edukasi.',
      },
      {
        id: 's3',
        speakerId: 'spk-3',
        start: 46,
        end: 72,
        text: 'Dari komisi pengawasan kami melihat serapan dana humas sudah sesuai target KPI. Menurut saya tambahan merchandise bisa disetujui asalkan dialihkan dari pos dana cadangan yang belum terpakai.',
      },
      {
        id: 's4',
        speakerId: 'spk-1',
        start: 73,
        end: 105,
        text: 'Baik, saya setuju dengan usulan Dimas. Kita alihkan 2.5 juta dari pos dana cadangan. Citra tolong buatkan form revisi anggaran dan kirimkan malam ini agar besok bisa ditandatangani.',
      },
      {
        id: 's5',
        speakerId: 'spk-2',
        start: 106,
        end: 125,
        text: 'Siap Ariq, form revisi anggaran akan saya selesaikan sebelum jam 9 malam beserta lampiran nota pengajuan dari humas.',
      },
      {
        id: 's6',
        speakerId: 'spk-1',
        start: 126,
        end: 155,
        text: 'Bagus. Terakhir untuk jadwal Sidang Pleno Terbuka mahasiswa, kita tetapkan hari Kamis tanggal 22 jam 14.00 di aula utama. Dimas tolong koordinasikan surat undangan ke dekanat.',
      },
      {
        id: 's7',
        speakerId: 'spk-3',
        start: 156,
        end: 184,
        text: 'Baik, surat undangan sudah siap drafnya. Besok pagi langsung saya submit ke bagian administrasi dekanat. Rapat bisa kita tutup.',
      },
    ],
    summary: {
      overview:
        'Rapat pleno BPM 2026 membahas evaluasi serapan anggaran triwulan pertama, persetujuan penambahan anggaran merchandise humas melalui realokasi dana cadangan, serta penetapan jadwal Sidang Pleno Terbuka.',
      keyPoints: [
        'Sisa alokasi dana kegiatan aspirasi mahasiswa berada di angka 40%.',
        'Pengajuan tambahan dana merchandise humas disetujui sebesar Rp2.500.000 dengan mengalihkan pos dana cadangan.',
        'Jadwal Sidang Pleno Terbuka resmi ditetapkan pada Kamis, 22 Oktober 2026 pukul 14.00 WIB.',
      ],
      decisions: [
        'Disetujui realokasi Rp2.500.000 dari dana cadangan ke divisi humas.',
        'Sidang Pleno Terbuka dilaksanakan di Aula Utama Telkom University.',
      ],
      actionItems: [
        {
          id: 'act-1',
          task: 'Buat form revisi anggaran 2.5 juta dan lampiran nota humas',
          assignee: 'Citra (Bendahara)',
          done: true,
        },
        {
          id: 'act-2',
          task: 'Submit surat undangan Sidang Pleno ke administrasi dekanat',
          assignee: 'Dimas (Komisi Pengawasan)',
          done: false,
        },
        {
          id: 'act-3',
          task: 'Tanda tangan berkas revisi anggaran dan konfirmasi peminjaman aula',
          assignee: 'Ariq Nayaka',
          done: false,
        },
      ],
    },
    mindmap: {
      markdown: `# Rapat Pleno BPM 2026
## 1. Evaluasi Anggaran
- Sisa alokasi dana aspirasi 40%
- Pengajuan divisi humas untuk merchandise
## 2. Keputusan Realokasi
- Persetujuan dana Rp2.500.000
- Sumber: Pos dana cadangan
## 3. Sidang Pleno Terbuka
- Hari/Tanggal: Kamis, 22 Oktober 2026
- Waktu: 14.00 WIB
- Lokasi: Aula Utama
## 4. Tindak Lanjut (Action Items)
- Citra: Form revisi anggaran
- Dimas: Undangan Dekanat
- Ariq: Approval & Konfirmasi`,
      mermaid: `mindmap
  root((Rapat Pleno BPM 2026))
    Evaluasi Anggaran
      Sisa Aspirasi 40%
      Merchandise Humas
    Keputusan Realokasi
      Rp2.500.000
      Dari Pos Cadangan
    Sidang Pleno Terbuka
      Kamis 22 Oktober 14.00
      Aula Utama
    Tindak Lanjut
      Citra: Form Anggaran
      Dimas: Surat Dekanat
      Ariq: Tanda Tangan`,
      rootNode: {
        id: 'root',
        label: 'Rapat Pleno BPM 2026',
        children: [
          {
            id: 'n1',
            label: '1. Evaluasi Anggaran',
            children: [
              { id: 'n1-1', label: 'Sisa Dana Aspirasi 40%' },
              { id: 'n1-2', label: 'Pengajuan Merchandise Humas' },
            ],
          },
          {
            id: 'n2',
            label: '2. Keputusan Realokasi',
            children: [
              { id: 'n2-1', label: 'Realokasi Rp 2.5 Juta Disetujui' },
              { id: 'n2-2', label: 'Diambil dari Pos Cadangan' },
            ],
          },
          {
            id: 'n3',
            label: '3. Sidang Pleno Terbuka',
            children: [
              { id: 'n3-1', label: 'Kamis, 22 Okt - 14:00 WIB' },
              { id: 'n3-2', label: 'Lokasi: Aula Utama' },
            ],
          },
          {
            id: 'n4',
            label: '4. Action Items',
            children: [
              { id: 'n4-1', label: 'Citra: Form revisi anggaran' },
              { id: 'n4-2', label: 'Dimas: Surat Dekanat' },
            ],
          },
        ],
      },
    },
    chatHistory: [
      {
        id: 'c1',
        role: 'assistant',
        text: 'Halo! Saya asisten NoteUp untuk rekaman **Rapat Pleno BPM 2026**. Kamu bisa menanyakan apa saja mengenai keputusan anggaran, timeline, atau pembagian tugas.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'c2',
        role: 'user',
        text: 'Berapa anggaran yang disetujui untuk humas dan dari mana dananya?',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'c3',
        role: 'assistant',
        text: 'Berdasarkan pembahasan pada detik 01:13, Ariq menyetujui anggaran sebesar **Rp2.500.000** untuk merchandise humas yang dialihkan dari **pos dana cadangan** yang belum terpakai.',
        timestamp: 73,
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'note-kuliah-smart-city',
    title: 'Kuliah Sistem Cerdas: Arsitektur IoT & Sensor Kota Cerdas',
    createdAt: new Date(Date.now() - 3600 * 1000 * 28).toISOString(),
    duration: 240,
    category: 'lecture',
    tags: ['Smart City', 'IoT', 'Kuliah', 'Telkom University'],
    status: 'completed',
    markers: [
      { id: 'lm1', time: 30, label: 'Layer Arsitektur IoT' },
      { id: 'lm2', time: 110, label: 'Protokol MQTT vs HTTP' },
      { id: 'lm3', time: 190, label: 'Tugas Proyek Kelompok' },
    ],
    speakers: [
      { id: 'spk-dos', name: 'Dosen Pengampu', color: '#8b5cf6' },
      { id: 'spk-mhs', name: 'Mahasiswa', color: '#06b6d4' },
    ],
    segments: [
      {
        id: 'ls1',
        speakerId: 'spk-dos',
        start: 0,
        end: 45,
        text: 'Dalam pengembangan smart city, arsitektur IoT umumnya dibagi menjadi 4 layer utama: Perception layer yang berisi sensor fisik, Network layer untuk transmisi data, Middleware untuk manajemen event, dan Application layer untuk antarmuka pengguna.',
      },
      {
        id: 'ls2',
        speakerId: 'spk-mhs',
        start: 46,
        end: 75,
        text: 'Pak, untuk sensor kualitas udara di perkotaan, kenapa lebih disarankan menggunakan protokol MQTT dibanding REST HTTP standar?',
      },
      {
        id: 'ls3',
        speakerId: 'spk-dos',
        start: 76,
        end: 140,
        text: 'Pertanyaan bagus. MQTT menggunakan model publish-subscribe yang sangat lightweight dengan header packet hanya 2 bytes. Ini menghemat daya baterai perangkat sensor lapangan hingga 60% dibanding HTTP payload overhead yang berat.',
      },
      {
        id: 'ls4',
        speakerId: 'spk-dos',
        start: 141,
        end: 240,
        text: 'Untuk tugas minggu depan, masing-masing kelompok wajib membuat skema topologi jaringan sensor cerdas dan mengirimkan laporannya ke LMS sebelum hari Jumat jam 23.59.',
      },
    ],
    summary: {
      overview:
        'Materi perkuliahan mengenai 4 layer arsitektur IoT pada domain Smart City, keunggulan protokol MQTT untuk telemetry hemat daya, serta instruksi tugas perancangan topologi sensor.',
      keyPoints: [
        '4 Layer IoT: Perception Layer, Network Layer, Middleware/Processing, dan Application Layer.',
        'MQTT vs HTTP: MQTT jauh lebih efisien untuk edge nodes karena protokol publish-subscribe dengan low latency dan overhead paket minimal (2 bytes).',
        'Aplikasi nyata: monitoring kualitas udara, smart lighting, dan deteksi banjir perkotaan.',
      ],
      decisions: [
        'Format tugas kelompok harus mencantumkan kalkulasi bandwidth konsumsi MQTT vs HTTP.',
      ],
      actionItems: [
        {
          id: 'lact-1',
          task: 'Bentuk kelompok proyek Smart City (3-4 orang)',
          assignee: 'Ariq',
          done: true,
        },
        {
          id: 'lact-2',
          task: 'Selesaikan desain topologi sensor MQTT dan submit ke LMS Jumat 23.59',
          assignee: 'Kelompok 2',
          done: false,
        },
      ],
    },
    mindmap: {
      markdown: `# Arsitektur IoT Smart City
## 1. Empat Layer Utama
- Perception (Sensors & Actuators)
- Network (LoRaWAN, 4G/5G, WiFi)
- Middleware (Message Broker, Analytics)
- Application (Smart Dashboard, Alerting)
## 2. Protokol Komunikasi
- MQTT: Ringan (2-byte header), Pub-Sub, Battery Saver
- HTTP: Stateless, Cocok untuk batch query
## 3. Penugasan
- Desain Topologi Sensor Cerdas
- Deadline: Jumat 23.59 di LMS`,
      mermaid: `mindmap
  root((Arsitektur IoT Smart City))
    Empat Layer
      Perception
      Network
      Middleware
      Application
    Protokol Komunikasi
      MQTT (Lightweight Pub-Sub)
      HTTP (RESTful API)
    Penugasan Kelompok
      Topologi Sensor
      Deadline Jumat 23.59`,
      rootNode: {
        id: 'lroot',
        label: 'Arsitektur IoT Smart City',
        children: [
          {
            id: 'ln1',
            label: '1. Empat Layer Utama',
            children: [
              { id: 'ln1-1', label: 'Perception Layer (Sensor & Edge)' },
              { id: 'ln1-2', label: 'Network Layer (LoRa/Cellular)' },
              { id: 'ln1-3', label: 'Application Layer (Dashboard)' },
            ],
          },
          {
            id: 'ln2',
            label: '2. Protokol Telemetri',
            children: [
              { id: 'ln2-1', label: 'MQTT: Lightweight 2-byte header' },
              { id: 'ln2-2', label: 'Hemat baterai hingga 60%' },
            ],
          },
          {
            id: 'ln3',
            label: '3. Tugas Kelompok',
            children: [
              { id: 'ln3-1', label: 'Topologi Jaringan Sensor' },
              { id: 'ln3-2', label: 'Deadline: Jumat 23:59 WIB' },
            ],
          },
        ],
      },
    },
    chatHistory: [
      {
        id: 'lc1',
        role: 'assistant',
        text: 'Halo! Saya asisten NoteUp untuk catatan kuliah **Arsitektur IoT & Sensor Kota Cerdas**. Ada yang ingin diperdalam?',
        createdAt: new Date().toISOString(),
      },
    ],
  },
];
