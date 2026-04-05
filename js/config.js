// ─── js/config.js ──────────────────────────────────────────
// Konfigurasi sentral IPB Makan
// Ganti nilai di bawah jika project Supabase berubah

const CONFIG = {
  supabase: {
    url: 'https://ahesoewawdtcgriergft.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZXNvZXdhd2R0Y2dyaWVyZ2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0Mjk4MTksImV4cCI6MjA5MDAwNTgxOX0.bAr_Y-BGTDZuNdQGgiUiYduNlSSVQdtprA8wyzmnqJg',
  },
  // Gemini dipanggil lewat Supabase Edge Function agar API key tidak terekspos ke browser
  gemini: {
    edgeFunctionUrl: 'https://ahesoewawdtcgriergft.supabase.co/functions/v1/gemini',
  },
  app: {
    name: 'IPB Makan',
    tagline: 'Ekosistem Pangan Kampus IPB',
    location: 'Jl. Babakan Raya, IPB University Dramaga, Bogor',
    pokiZone: 'IPB Dramaga',
    pokiBaseFee: 5000,
  },
};

window.CONFIG = CONFIG;
