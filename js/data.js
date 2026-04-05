// js/data.js - Supabase queries + cache + helpers

var _sb = null;
function getSB() {
  if (!_sb) _sb = supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
  return _sb;
}
window.getSB = getSB;

// ── CACHE: simpan data 5 menit di localStorage ──────────
// Sehingga perpindahan halaman tidak perlu fetch ulang
var CACHE_KEY = 'ipbmakan_cache';
var CACHE_TTL = 5 * 60 * 1000; // 5 menit

function saveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ts:      Date.now(),
      umkm:    STATE.umkm,
      menu:    STATE.menu,
      videos:  STATE.videos,
      reviews: STATE.reviews,
      drivers: STATE.drivers
    }));
  } catch(e) {}
}

function loadCache() {
  try {
    var raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    var c = JSON.parse(raw);
    if (Date.now() - c.ts > CACHE_TTL) return false;
    if (!c.umkm || !c.umkm.length) return false;
    STATE.umkm    = c.umkm    || [];
    STATE.menu    = c.menu    || [];
    STATE.videos  = c.videos  || [];
    STATE.reviews = c.reviews || [];
    STATE.drivers = c.drivers || [];
    return true;
  } catch(e) { return false; }
}

window.clearDataCache = function() {
  try { localStorage.removeItem(CACHE_KEY); } catch(e) {}
};

// Fetch dari Supabase (dipanggil hanya jika cache miss)
async function loadAllData() {
  try {
    var results = await Promise.all([
      getSB().from('umkm').select('*').order('umkm_rating', { ascending: false }),
      getSB().from('menu').select('*').eq('is_available', true).order('total_sold', { ascending: false }),
      getSB().from('videos').select('*').order('likes', { ascending: false }),
      getSB().from('reviews').select('*').order('created_at', { ascending: false }),
      getSB().from('poki_drivers').select('*')
    ]);
    STATE.umkm    = results[0].data || [];
    STATE.menu    = results[1].data || [];
    STATE.videos  = results[2].data || [];
    STATE.reviews = results[3].data || [];
    STATE.drivers = results[4].data || [];
    saveCache();
    return true;
  } catch(e) {
    console.error('loadAllData error:', e);
    return false;
  }
}
window.loadAllData = loadAllData;

// ensureData: pakai cache dulu, fetch hanya jika perlu
// Dipanggil di setiap halaman sebagai pengganti loadAllData langsung
async function ensureData() {
  if (STATE.umkm.length > 0) return true;   // sudah di memori
  if (loadCache()) return true;              // ada di cache
  return await loadAllData();                // fetch dari Supabase
}
window.ensureData = ensureData;

// Data helpers
window.getUmkm     = function(id)  { for(var i=0;i<STATE.umkm.length;i++){if(STATE.umkm[i].id===id)return STATE.umkm[i];}return null; };
window.getMenu     = function(uid) { return STATE.menu.filter(function(m){return m.umkm_id===uid;}); };
window.getReviews  = function(uid) { return STATE.reviews.filter(function(r){return r.umkm_id===uid;}); };
window.getMyVideos = function(uid) { return STATE.videos.filter(function(v){return v.umkm_id===uid;}); };
window.getDriver   = function()    { for(var i=0;i<STATE.drivers.length;i++){if(STATE.drivers[i].is_available)return STATE.drivers[i];}return null; };
window.getMyUmkmId = function()    { return STATE.umkmId || (STATE.umkm.length ? STATE.umkm[0].id : null); };

// Format helpers
window.rp  = function(n) { return 'Rp ' + (n||0).toLocaleString('id-ID'); };
window.rpK = function(n) {
  if (!n) return 'Rp 0';
  if (n >= 1000000) return 'Rp ' + (n/1000000).toFixed(1).replace('.0','') + 'jt';
  if (n >= 1000)    return 'Rp ' + Math.round(n/1000) + 'rb';
  return 'Rp ' + n;
};
window.fn  = function(n) { return n >= 1000 ? (n/1000).toFixed(1).replace('.0','')+'rb' : String(n||0); };
window.fd  = function(d) { return d ? new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '-'; };
window.nt  = function()  { return new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}); };
window.esc = function(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
window.getPhoto = function(m) { return m && m.photo_url ? m.photo_url : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80'; };
