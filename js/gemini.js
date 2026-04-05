// ─── js/gemini.js ─────────────────────────────────────────
// Gemini AI lewat Supabase Edge Function
// API key tersimpan server-side → tidak terekspos, tidak ada CORS

async function askGemini(message, context, history = []) {
  try {
    const res = await fetch(CONFIG.gemini.edgeFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context, history }),
    });
    if (!res.ok) throw new Error(`Edge function ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.response;
  } catch (e) {
    console.warn('Gemini edge function error, using fallback:', e.message);
    return gemFallback(message, context);
  }
}
window.askGemini = askGemini;

// Fallback lokal jika edge function tidak bisa diakses
function gemFallback(msg, ctx) {
  const m = msg.toLowerCase();
  const name = ctx?.nama || 'warung Anda';
  const disc = ctx?.student_discount_pct || 10;

  if (m.includes('harga') || m.includes('price'))
    return `Untuk **${name}** di Babakan Raya, harga kompetitif: nasi+lauk Rp 12k–22k, minuman Rp 4k–8k, paket Rp 20k–28k. Diskon mahasiswa ${disc}% sudah tepat sasaran.`;

  if (m.includes('menu') || m.includes('trend'))
    return `Tren menu mahasiswa IPB: (1) Rice bowl topping beragam (margin 60%+), (2) Minuman susu kekinian matcha/taro, (3) Gorengan sore 14–16. Menu Anda sudah tepat!`;

  if (m.includes('promosi') || m.includes('promo') || m.includes('marketing'))
    return `Strategi promosi efektif Babakan Raya: pre-order discount 10% via IPB Makan, video TikTok 1× sehari proses masak, happy hour 14–16 diskon 15%, program poin loyalitas mahasiswa.`;

  if (m.includes('sepi') || m.includes('slow'))
    return `Jam sepi biasanya 09–10 dan 14–16. Solusi: paket sarapan Rp 8k–12k, snack sore gorengan+teh Rp 7k, notif ke mahasiswa jam 13.45. Potensi +Rp 150k–200k/hari.`;

  if (m.includes('tiktok') || m.includes('video') || m.includes('konten'))
    return `Tips TikTok untuk warung Babakan Raya: rekam proses masak (bukan hanya hasil), durasi 15–30 detik, upload jam 10–12 atau 20–22. Gunakan hashtag #makanIPB #babakanraya.`;

  if (m.includes('rating') || m.includes('ulasan') || m.includes('review'))
    return `Untuk meningkatkan rating: (1) Minta ulasan setelah makan, (2) Beri voucher diskon 5% sebagai ucapan terima kasih, (3) Respons semua ulasan, (4) Perbaiki kritik yang sering muncul.`;

  return `Untuk **${name}** (${ctx?.umkm_rating || '—'}/5, ${ctx?.total_reviews || 0} ulasan) di Babakan Raya: konsistensi kualitas menu unggulan, aktifkan Poki Delivery, dan upload 1 video/hari. Warung dengan video mendapat 3× lebih banyak kunjungan.`;
}
