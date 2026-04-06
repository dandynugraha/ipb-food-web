// ─── js/pages/admin-tiktok.js ────────────────────────────
// Panel upload TikTok review IPB Makan (admin only)
// Insert ke tabel videos dengan is_official = true

let UP_VIDEO_FILE = null;
let UP_THUMB_FILE = null;
let UP_BUSY = false;
let OFFICIAL_VIDEOS = [];

async function init() {
  // Untuk demo: skip auth, izinkan semua role akses
  // Kalau mau strict, uncomment baris berikut:
  // if (!requireAuth(['admin'])) return;

  restoreSession();
  await ensureData();
  renderSidebar();
  updateCartBadge();
  await loadOfficial();
  render();
  setTimeout(() => document.getElementById('ldr').classList.add('out'), 1000);
}

async function loadOfficial() {
  try {
    const sb = getSB();
    const { data, error } = await sb.from('videos')
      .select('*')
      .eq('is_official', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    OFFICIAL_VIDEOS = data || [];
  } catch (e) {
    console.error('[admin-tiktok] loadOfficial:', e);
    OFFICIAL_VIDEOS = [];
  }
}

function render() {
  document.getElementById('pageContent').innerHTML = `
    <div class="ph">
      <div>
        <div class="ptit" style="display:flex;align-items:center;gap:10px">
          Upload Review TikTok
          <span class="bx" style="background:linear-gradient(135deg,var(--gold),var(--goldl));color:#fff;font-size:10px">★ ADMIN</span>
        </div>
        <div class="psub">Upload video TikTok official IPB Makan → tampil di halaman Review</div>
      </div>
      <button class="btn b-pri" onclick="openUpModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Upload Video TikTok
      </button>
    </div>

    <!-- Info banner -->
    <div style="background:linear-gradient(135deg,#1a0408,#080814);border-radius:var(--r16);padding:18px 22px;display:flex;align-items:center;gap:16px;margin-bottom:22px;border:1px solid rgba(201,168,76,.2)">
      <div style="width:48px;height:48px;background:linear-gradient(135deg,var(--gold),var(--goldl));border-radius:var(--r12);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>
      <div style="flex:1">
        <div style="color:#fff;font-size:14px;font-weight:800;margin-bottom:3px">Workflow Upload TikTok IPB Makan</div>
        <div style="color:rgba(255,255,255,.5);font-size:12px;line-height:1.5">
          1. Download video dari TikTok @ipbmakan pakai snaptik.app atau ssstik.io<br>
          2. Upload MP4 di sini → tandai sebagai Official<br>
          3. Otomatis muncul di halaman <strong style="color:var(--gold)">Review IPB Makan</strong> dengan auto-play TikTok-style
        </div>
      </div>
      <span class="bx" style="background:rgba(201,168,76,.15);color:var(--gold);border:1px solid rgba(201,168,76,.3);flex-shrink:0">${OFFICIAL_VIDEOS.length} Review</span>
    </div>

    <!-- Grid review yang udah diupload -->
    <div class="ga" id="reviewGrid">
      ${OFFICIAL_VIDEOS.length ? '' : `<div style="grid-column:1/-1">${emptyState('Belum ada review TikTok. Klik "Upload Video TikTok" untuk memulai.')}</div>`}
    </div>

    <!-- Modal upload -->
    <div class="mbk" id="mUp" onclick="if(event.target===this)closeModal('mUp')">
      <div class="modal" style="max-width:560px">
        <div class="mh">
          <div class="mt" style="display:flex;align-items:center;gap:8px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--gold)">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Upload Review TikTok
          </div>
          <button class="mx" onclick="closeModal('mUp')">✕</button>
        </div>
        <div class="mb">
          <div class="fg">
            <label class="fl">File Video MP4 (maks. 100MB)</label>
            <div class="uz" id="upZone" onclick="document.getElementById('upFileInp').click()"
              ondragover="upDragOver(event)" ondragleave="upDragLeave(event)" ondrop="upDrop(event)">
              <div class="uz-i">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div class="uz-t" id="upZoneText">Drag &amp; drop video TikTok atau klik untuk pilih</div>
              <div class="uz-s" id="upZoneSub">MP4, MOV, WebM — Maks. 100MB</div>
            </div>
            <input type="file" id="upFileInp" accept="video/mp4,video/quicktime,video/webm" style="display:none" onchange="upFileSelect(event)">
          </div>

          <div class="fg">
            <label class="fl">Judul Video / Caption *</label>
            <input type="text" class="fi" id="upTitle" placeholder="Review Ayam Bakar Bu Sari yang Viral di TikTok!">
          </div>

          <div class="fg">
            <label class="fl">Deskripsi (opsional)</label>
            <textarea class="fi" id="upDesc" rows="2" placeholder="Penjelasan lebih detail tentang video..."></textarea>
          </div>

          <div class="fg">
            <label class="fl">Warung yang Direview (opsional)</label>
            <select class="fi fi-sel" id="upUmkm">
              <option value="">— Tidak terkait warung tertentu —</option>
            </select>
            <div class="fi-h">Pilih warung kalau review-mu terkait warung tertentu</div>
          </div>

          <div class="fg">
            <label class="fl">Thumbnail / Cover (opsional)</label>
            <input type="file" class="fi" id="upThumbInp" accept="image/*" onchange="upThumbSelect(event)">
            <div class="fi-h" id="upThumbHelp">Kalau kosong, frame pertama video dipakai otomatis</div>
          </div>

          <div class="fg">
            <label class="fl">URL TikTok Asli (opsional)</label>
            <input type="text" class="fi" id="upTtUrl" placeholder="https://www.tiktok.com/@ipbmakan/video/...">
            <div class="fi-h">Untuk credit / link balik ke TikTok original</div>
          </div>

          <button class="btn b-pri b-fw" id="upSaveBtn" onclick="upSave()" style="background:linear-gradient(135deg,var(--gold),var(--goldl));border:none">
            ★ Upload sebagai Review Official
          </button>
        </div>
      </div>
    </div>`;

  populateUmkmSelect();
  renderReviewGrid();
}

function populateUmkmSelect() {
  const sel = document.getElementById('upUmkm');
  if (!sel || !STATE.umkm.length) return;
  STATE.umkm.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = u.nama + (u.kiosk_number ? ` (Kios ${u.kiosk_number})` : '');
    sel.appendChild(opt);
  });
}

function renderReviewGrid() {
  const el = document.getElementById('reviewGrid');
  if (!el || !OFFICIAL_VIDEOS.length) return;
  el.innerHTML = OFFICIAL_VIDEOS.map(v => {
    const u = STATE.umkm.find(x => x.id === v.umkm_id);
    return `
    <div class="card" style="overflow:hidden;border:1px solid rgba(201,168,76,.2)">
      <div style="aspect-ratio:9/16;background:linear-gradient(135deg,#1a0408,#080814);position:relative;display:flex;align-items:center;justify-content:center">
        ${v.video_url
          ? `<video src="${v.video_url}" ${v.thumbnail_url ? `poster="${v.thumbnail_url}"` : ''} muted preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>`
          : (v.thumbnail_url
            ? `<img src="${v.thumbnail_url}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`
            : `<svg style="opacity:.15" width="56" height="56" viewBox="0 0 24 24" fill="var(--gold)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`)}
        <div style="position:absolute;top:10px;left:10px;z-index:2">
          <span class="bx" style="background:linear-gradient(135deg,var(--gold),var(--goldl));color:#fff;font-weight:800">★ Official</span>
        </div>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none">
          <div style="width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,.4);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
      </div>
      <div style="padding:12px 14px">
        <div style="font-size:12px;font-weight:800;margin-bottom:3px;line-height:1.3">${esc(v.title || v.food_name || (v.caption||'').slice(0,36))}</div>
        ${u ? `<div style="font-size:11px;color:var(--m);font-weight:600;margin-bottom:6px">Review: ${esc(u.nama)}</div>` : ''}
        <div style="font-size:10px;color:var(--t3);margin-bottom:10px;display:flex;gap:10px">
          <span>${fn(v.views||0)} tayangan</span><span>${fn(v.likes||0)} suka</span>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn b-dan b-sm b-fw" onclick="upDelete('${v.id}','${esc((v.title||v.food_name||'').slice(0,20))}')">Hapus</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ─── Modal handlers ──────────────────────────────────────
function openUpModal() {
  UP_VIDEO_FILE = null;
  UP_THUMB_FILE = null;
  openModal('mUp');
  setTimeout(() => {
    ['upTitle','upDesc','upTtUrl'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const fi = document.getElementById('upFileInp'); if (fi) fi.value = '';
    const ti = document.getElementById('upThumbInp'); if (ti) ti.value = '';
    const sel = document.getElementById('upUmkm'); if (sel) sel.value = '';
    const t = document.getElementById('upZoneText'); if (t) t.textContent = 'Drag & drop video TikTok atau klik untuk pilih';
    const s = document.getElementById('upZoneSub'); if (s) s.textContent = 'MP4, MOV, WebM — Maks. 100MB';
    const h = document.getElementById('upThumbHelp'); if (h) h.textContent = 'Kalau kosong, frame pertama video dipakai otomatis';
  }, 50);
}
window.openUpModal = openUpModal;

// File handlers
function upDragOver(e) { e.preventDefault(); document.getElementById('upZone').classList.add('drag'); }
function upDragLeave(e) { e.preventDefault(); document.getElementById('upZone').classList.remove('drag'); }
function upDrop(e) {
  e.preventDefault();
  document.getElementById('upZone').classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
}
window.upDragOver = upDragOver;
window.upDragLeave = upDragLeave;
window.upDrop = upDrop;

function upFileSelect(e) {
  const file = e.target.files[0];
  if (file) handleFile(file);
}
window.upFileSelect = upFileSelect;

function handleFile(file) {
  if (!file.type.startsWith('video/')) { toast('File harus berupa video', 'err'); return; }
  if (file.size > 100 * 1024 * 1024) { toast('Maksimal 100MB', 'err'); return; }
  UP_VIDEO_FILE = file;
  document.getElementById('upZoneText').textContent = '✓ ' + file.name;
  document.getElementById('upZoneSub').textContent = (file.size / 1024 / 1024).toFixed(1) + ' MB · siap diupload';
}

function upThumbSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  UP_THUMB_FILE = file;
  document.getElementById('upThumbHelp').textContent = '✓ ' + file.name;
}
window.upThumbSelect = upThumbSelect;

// ─── SAVE ────────────────────────────────────────────────
async function upSave() {
  if (UP_BUSY) return;
  const title = document.getElementById('upTitle').value.trim();
  const desc  = document.getElementById('upDesc').value.trim();
  const ttUrl = document.getElementById('upTtUrl').value.trim();
  const umkmId = document.getElementById('upUmkm').value || null;

  if (!title) { toast('Judul wajib diisi', 'err'); return; }
  if (!UP_VIDEO_FILE) { toast('Pilih file video MP4 dulu', 'err'); return; }

  UP_BUSY = true;
  const btn = document.getElementById('upSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Mengupload...';

  try {
    const sb = getSB();
    const ext = UP_VIDEO_FILE.name.split('.').pop().toLowerCase();
    const path = `official/${Date.now()}-${Math.random().toString(36).slice(2,9)}.${ext}`;

    btn.textContent = 'Mengupload video...';
    const { data: upData, error: upErr } = await sb.storage
      .from('videos').upload(path, UP_VIDEO_FILE, {
        cacheControl: '3600', upsert: false, contentType: UP_VIDEO_FILE.type,
      });
    if (upErr) throw new Error('Upload gagal: ' + upErr.message);
    const { data: urlData } = sb.storage.from('videos').getPublicUrl(upData.path);
    const video_url = urlData.publicUrl;

    let thumbnail_url = null;
    if (UP_THUMB_FILE) {
      btn.textContent = 'Mengupload thumbnail...';
      const tExt = UP_THUMB_FILE.name.split('.').pop().toLowerCase();
      const tPath = `official/thumb-${Date.now()}.${tExt}`;
      const { data: tData } = await sb.storage.from('videos')
        .upload(tPath, UP_THUMB_FILE, { cacheControl: '3600', contentType: UP_THUMB_FILE.type });
      if (tData) {
        const { data: tUrl } = sb.storage.from('videos').getPublicUrl(tData.path);
        thumbnail_url = tUrl.publicUrl;
      }
    }

    btn.textContent = 'Menyimpan...';
    const row = {
      umkm_id: umkmId,
      title: title,
      caption: desc || title,
      food_name: title,
      food_price: 0,
      video_url: video_url,
      thumbnail_url: thumbnail_url,
      tiktok_url: ttUrl || null,
      is_tiktok: !!ttUrl,
      is_official: true,    // ★ ini yang membedakan
      is_active: true,
      likes: 0,
      views: 0,
    };

    const { data: inserted, error: insErr } = await sb.from('videos').insert(row).select().single();
    if (insErr) throw new Error('Database error: ' + insErr.message);

    OFFICIAL_VIDEOS.unshift(inserted);
    if (window.clearDataCache) clearDataCache();

    closeModal('mUp');
    toast(`Review "${title}" berhasil di-upload sebagai Official!`, 'ok');
    render();

  } catch (err) {
    console.error('[upSave]', err);
    toast(err.message || 'Terjadi kesalahan', 'err');
  } finally {
    UP_BUSY = false;
    btn.disabled = false;
    btn.textContent = '★ Upload sebagai Review Official';
  }
}
window.upSave = upSave;

// ─── DELETE ──────────────────────────────────────────────
async function upDelete(id, name) {
  if (!confirm(`Hapus review "${name}"?`)) return;
  try {
    const sb = getSB();
    const v = OFFICIAL_VIDEOS.find(x => x.id === id);
    if (v?.video_url && v.video_url.includes('/storage/v1/object/public/videos/')) {
      const p = v.video_url.split('/storage/v1/object/public/videos/')[1];
      if (p) await sb.storage.from('videos').remove([p]);
    }
    if (v?.thumbnail_url && v.thumbnail_url.includes('/storage/v1/object/public/videos/')) {
      const p = v.thumbnail_url.split('/storage/v1/object/public/videos/')[1];
      if (p) await sb.storage.from('videos').remove([p]);
    }
    const { error } = await sb.from('videos').delete().eq('id', id);
    if (error) throw error;
    OFFICIAL_VIDEOS = OFFICIAL_VIDEOS.filter(v => v.id !== id);
    if (window.clearDataCache) clearDataCache();
    toast(`Review "${name}" dihapus`, 'info');
    render();
  } catch (err) {
    toast('Gagal hapus: ' + err.message, 'err');
  }
}
window.upDelete = upDelete;

init();
