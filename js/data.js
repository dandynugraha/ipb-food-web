// ─── js/data.js ───────────────────────────────────────────
// Data layer: query Supabase + helper formatter

let _sb = null;

function getSB() {
  if (!_sb) _sb = supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
  return _sb;
}
window.getSB = getSB;

// Muat semua data ke STATE sekaligus (parallel)
async function loadAllData() {
  try {
    const [umkm, menu, videos, reviews, drivers] = await Promise.all([
      getSB().from('umkm').select('*').order('umkm_rating', { ascending: false }),
      getSB().from('menu').select('*').eq('is_available', true).order('total_sold', { ascending: false }),
      getSB().from('videos').select('*').order('likes', { ascending: false }),
      getSB().from('reviews').select('*').order('created_at', { ascending: false }),
      getSB().from('poki_drivers').select('*'),
    ]);

    if (umkm.error)    console.error('umkm error:', umkm.error);
    if (menu.error)    console.error('menu error:', menu.error);
    if (videos.error)  console.error('videos error:', videos.error);
    if (reviews.error) console.error('reviews error:', reviews.error);
    if (drivers.error) console.error('drivers error:', drivers.error);

    STATE.umkm    = umkm.data    || [];
    STATE.menu    = menu.data    || [];
    STATE.videos  = videos.data  || [];
    STATE.reviews = reviews.data || [];
    STATE.drivers = drivers.data || [];

    return true;
  } catch (e) {
    console.error('loadAllData failed:', e);
    return false;
  }
}
window.loadAllData = loadAllData;

// ─── Data helpers ─────────────────────────────────────────
window.getUmkm    = id  => STATE.umkm.find(u => u.id === id) || null;
window.getMenu    = uid => STATE.menu.filter(m => m.umkm_id === uid);
window.getReviews = uid => STATE.reviews.filter(r => r.umkm_id === uid);
window.getMyVideos = uid => STATE.videos.filter(v => v.umkm_id === uid);
window.getDriver  = ()  => STATE.drivers.find(d => d.is_available) || null;
window.getMyUmkmId = () => STATE.umkmId || STATE.umkm[0]?.id || null;

// ─── Format helpers ────────────────────────────────────────
window.rp  = n => 'Rp ' + (n || 0).toLocaleString('id-ID');
window.rpK = n => {
  if (!n) return 'Rp 0';
  if (n >= 1e6) return 'Rp ' + (n / 1e6).toFixed(1).replace('.0', '') + 'jt';
  if (n >= 1e3) return 'Rp ' + Math.round(n / 1e3) + 'rb';
  return 'Rp ' + n;
};
window.fn  = n => n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'rb' : String(n || 0);
window.fd  = d => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
window.nt  = ()  => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
window.esc = s   => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
window.getPhoto = m => m?.photo_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80';
window.timeGreeting = () => {
  const h = new Date().getHours();
  return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
};
