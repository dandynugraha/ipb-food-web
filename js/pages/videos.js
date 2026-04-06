// ─── js/pages/videos.js ───────────────────────────────────
// Manajemen video UMKM:
// - Tab "Upload Video" → upload MP4 ke Supabase Storage bucket "videos"
// - Tab "TikTok Link" → simpan URL TikTok (warning: tidak auto-play di feed)
// - Form: judul, caption, harga, thumbnail (opsional)
// - Save langsung ke tabel `videos` di Supabase

// State lokal upload
let UP_VIDEO_FILE = null;
let UP_THUMB_FILE = null;
let UP_BUSY = false;

async function init() {
  if (!requireAuth(['umkm', 'admin'])) return;
  await ensureData();
  renderSidebar();
  updateCartBadge();
  render();
  setTimeout(() => document.getElementById('ldr').classList.add('out'), 1200);
}

function render() {
  const uid    = getMyUmkmId();
  const myVids = getMyVideos(uid);

  document.getElementById('pageContent').innerHTML = `
    <div class="ph">
      <div>
        <div class="ptit">Video & TikTok</div>
        <div class="psub">Upload video MP4 ke Supabase Storage → tampil di Video Feed publik dengan auto-play TikTok-style</div>
      </div>
      <button class="btn b-pri" onclick="openVidModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Tambah Video
      </button>
    </div>

    <!-- Info banner -->
    <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:var(--r16);padding:18px 22px;display:flex;align-items:center;gap:16px;margin-bottom:22px;border:1px solid rgba(255,255,255,.06)">
      <div style="width:44px;height:44px;background:rgba(255,255,255,.08);border-radius:var(--r12);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
        </svg>
      </div>
      <div style="flex:1">
        <div style="color:#fff;font-size:14px;font-weight:800;margin-bottom:3px">Cara kerja Video Feed</div>
        <div style="color:rgba(255,255,255,.5);font-size:12px;line-height:1.5">
          Upload file MP4 → tersimpan di Supabase Storage → langsung muncul di feed dengan auto-play saat user scroll. Untuk konten TikTok: download dulu pakai snaptik.app, lalu upload MP4-nya di sini.
        </div>
      </div>
      <span class="bx" style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.1);flex-shrink:0">${myVids.length} Video</span>
    </div>

    <!-- Grid video -->
    <div class="ga" id="vidGrid">
      ${myVids.length ? '' : `<div style="grid-column:1/-1">${emptyState('Belum ada video. Klik "+ Tambah Video" untuk memulai.')}</div>`}
    </div>

    <!-- Modal tambah video -->
    <div class="mbk" id="mVid" onclick="if(event.target===this)closeModal('mVid')">
      <div class="modal" style="max-width:560px">
        <div class="mh"><div class="mt">Tambah Video</div><button class="mx" onclick="closeModal('mVid')">✕</button></div>
        <div class="mb">
          <div class="atabs" style="margin-bottom:20px" id="vTabs">
            <button class="atab on" onclick="swVType('up')">📹 Upload MP4 (Auto-play)</button>
            <button class="atab" onclick="swVType('tt')">🔗 Link TikTok</button>
          </div>

          <!-- TAB: Upload MP4 -->
          <div id="vUPF">
            <div class="fg">
              <label class="fl">File Video (MP4, MOV, WebM — maks. 100MB)</label>
              <div class="uz" id="vUploadZone" onclick="document.getElementById('vFileInp').click()"
                ondragover="vDragOver(event)" ondragleave="vDragLeave(event)" ondrop="vDrop(event)">
                <div class="uz-i">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                  </svg>
                </div>
                <div class="uz-t" id="vUzText">Drag &amp; drop video atau klik untuk pilih</div>
                <div class="uz-s" id="vUzSub">MP4, MOV, WebM — Maks. 100MB</div>
              </div>
              <input type="file" id="vFileInp" accept="video/mp4,video/quicktime,video/webm" style="display:none" onchange="vFileSelect(event)">
            </div>
          </div>

          <!-- TAB: TikTok URL -->
          <div id="vTTF" style="display:none">
            <div class="fg">
              <label class="fl">URL TikTok</label>
              <input type="text" class="fi" id="vUrl"
                placeholder="https://www.tiktok.com/@username/video/7234567890123456789"
                oninput="previewTT(this.value)">
              <div class="fi-h">⚠ Mode link TikTok hanya menyimpan referensi. Untuk auto-play TikTok-style di feed, gunakan tab Upload MP4.</div>
            </div>
            <div id="ttPreview" style="display:none;background:var(--gbg);border-radius:var(--r12);padding:12px;margin-bottom:14px;align-items:center;gap:10px;border-left:3px solid var(--green)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              <div>
                <div style="font-size:12px;font-weight:700;color:var(--green)">TikTok Video Terdeteksi</div>
                <div style="font-size:11px;color:var(--t3)" id="ttIdLbl">ID: —</div>
              </div>
            </div>
          </div>

          <!-- Form fields umum -->
          <div class="fg">
            <label class="fl">Judul / Nama Makanan *</label>
            <input type="text" class="fi" id="vCap" placeholder="Ayam Bakar Bumbu Rahasia Bu Sari">
          </div>

          <div class="fg">
            <label class="fl">Caption / Deskripsi (opsional)</label>
            <textarea class="fi" id="vDesc" rows="2" placeholder="Deskripsi singkat tentang video..."></textarea>
          </div>

          <div class="r2">
            <div class="fg"><label class="fl">Harga Mahasiswa (Rp)</label><input type="number" class="fi" id="vPS" placeholder="16000"></div>
            <div class="fg"><label class="fl">Harga Umum (Rp)</label><input type="number" class="fi" id="vPG" placeholder="18000"></div>
          </div>

          <div class="fg">
            <label class="fl">Thumbnail / Cover (opsional, JPG/PNG)</label>
            <input type="file" class="fi" id="vThumbInp" accept="image/jpeg,image/png,image/webp" onchange="vThumbSelect(event)">
            <div class="fi-h" id="vThumbHelp">Jika kosong, frame pertama video akan dipakai sebagai thumbnail otomatis.</div>
          </div>

          <button class="btn b-pri b-fw" id="vSaveBtn" onclick="saveVid()">Simpan &amp; Tampilkan di Feed</button>
        </div>
      </div>
    </div>`;

  renderGrid(myVids);
}

function renderGrid(vids) {
  const el = document.getElementById('vidGrid');
  if (!el || !vids.length) return;
  el.innerHTML = vids.map(v => `
    <div class="card" style="overflow:hidden">
      <div style="aspect-ratio:9/16;background:linear-gradient(135deg,#0f172a,#1e293b);position:relative;display:flex;align-items:center;justify-content:center">
        ${v.video_url
          ? `<video src="${v.video_url}" ${v.thumbnail_url ? `poster="${v.thumbnail_url}"` : ''} muted preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>`
          : (v.thumbnail_url
            ? `<img src="${v.thumbnail_url}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`
            : `<svg style="opacity:.12" width="56" height="56" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>`)}

        ${v.is_tiktok
          ? `<div style="position:absolute;top:10px;left:10px;z-index:2"><span class="bx bx-n" style="background:rgba(0,0,0,.6);color:#fff;border:1px solid rgba(255,255,255,.15)">TikTok</span></div>`
          : `<div style="position:absolute;top:10px;left:10px;z-index:2"><span class="bx bx-b">MP4</span></div>`}

        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none">
          <div style="width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,.4);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
      </div>
      <div style="padding:12px 14px">
        <div style="font-size:12px;font-weight:800;margin-bottom:3px;line-height:1.3">${esc(v.food_name || (v.caption||'').slice(0,36))}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:14px;font-weight:800;color:var(--m)">${rp(v.food_price || v.tiktok_price || 0)}</div>
        </div>
        <div style="font-size:10px;color:var(--t3);margin-bottom:10px;display:flex;gap:10px">
          <span>${fn(v.views||0)} tayangan</span><span>${fn(v.likes||0)} suka</span><span>${fd(v.created_at)}</span>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn b-gho b-sm" style="flex:1" onclick="toast('Fitur edit segera hadir','info')">Edit</button>
          <button class="btn b-dan b-sm" onclick="delVid('${v.id}','${esc((v.food_name||v.caption||'').slice(0,20))}')">Hapus</button>
        </div>
      </div>
    </div>`).join('');
}

// ─── Modal ────────────────────────────────────────────────
function openVidModal() {
  // Reset state
  UP_VIDEO_FILE = null;
  UP_THUMB_FILE = null;
  openModal('mVid');
  // Reset form
  setTimeout(() => {
    const ids = ['vUrl','vCap','vDesc','vPS','vPG'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const fi = document.getElementById('vFileInp'); if (fi) fi.value = '';
    const ti = document.getElementById('vThumbInp'); if (ti) ti.value = '';
    const uzText = document.getElementById('vUzText');
    if (uzText) uzText.textContent = 'Drag & drop video atau klik untuk pilih';
    const uzSub = document.getElementById('vUzSub');
    if (uzSub) uzSub.textContent = 'MP4, MOV, WebM — Maks. 100MB';
    const tp = document.getElementById('ttPreview'); if (tp) tp.style.display = 'none';
    swVType('up');
  }, 50);
}
window.openVidModal = openVidModal;

// ─── Tab switch ───────────────────────────────────────────
function swVType(t) {
  document.querySelectorAll('#vTabs .atab').forEach((b, i) =>
    b.classList.toggle('on', (t === 'up' && i === 0) || (t === 'tt' && i === 1)));
  document.getElementById('vUPF').style.display = t === 'up' ? '' : 'none';
  document.getElementById('vTTF').style.display = t === 'tt' ? '' : 'none';
}
window.swVType = swVType;

// ─── TikTok URL preview ───────────────────────────────────
function previewTT(url) {
  const match = url.match(/video\/(\d+)/);
  const pv = document.getElementById('ttPreview');
  const lb = document.getElementById('ttIdLbl');
  if (pv) pv.style.display = match ? 'flex' : 'none';
  if (lb && match) lb.textContent = `ID: ${match[1]}`;
}
window.previewTT = previewTT;

// ─── File upload handlers ─────────────────────────────────
function vDragOver(e) { e.preventDefault(); document.getElementById('vUploadZone').classList.add('drag'); }
function vDragLeave(e) { e.preventDefault(); document.getElementById('vUploadZone').classList.remove('drag'); }
function vDrop(e) {
  e.preventDefault();
  document.getElementById('vUploadZone').classList.remove('drag');
  const file = e.dataTransfer.files[0];
  if (file) handleVideoFile(file);
}
window.vDragOver = vDragOver;
window.vDragLeave = vDragLeave;
window.vDrop = vDrop;

function vFileSelect(e) {
  const file = e.target.files[0];
  if (file) handleVideoFile(file);
}
window.vFileSelect = vFileSelect;

function handleVideoFile(file) {
  if (!file.type.startsWith('video/')) {
    toast('File harus berupa video (MP4, MOV, WebM)', 'err');
    return;
  }
  if (file.size > 100 * 1024 * 1024) {
    toast('Ukuran file maksimal 100MB', 'err');
    return;
  }
  UP_VIDEO_FILE = file;
  document.getElementById('vUzText').textContent = '✓ ' + file.name;
  document.getElementById('vUzSub').textContent = (file.size / 1024 / 1024).toFixed(1) + ' MB · siap diupload';
}

function vThumbSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast('Thumbnail harus gambar', 'err');
    return;
  }
  UP_THUMB_FILE = file;
  document.getElementById('vThumbHelp').textContent = '✓ ' + file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)';
}
window.vThumbSelect = vThumbSelect;

// ─── SAVE: upload + insert ke Supabase ────────────────────
async function saveVid() {
  if (UP_BUSY) return;

  const cap  = document.getElementById('vCap').value.trim();
  const desc = document.getElementById('vDesc')?.value.trim() || '';
  const url  = document.getElementById('vUrl')?.value.trim() || '';
  const prcG = parseInt(document.getElementById('vPG').value) || 0;
  const prcS = parseInt(document.getElementById('vPS').value) || 0;

  if (!cap) { toast('Judul wajib diisi', 'err'); return; }

  // Tentukan mode
  const isUploadMode = document.getElementById('vUPF').style.display !== 'none';
  const tiktokId = url ? (url.match(/video\/(\d+)/)?.[1] || null) : null;

  if (isUploadMode && !UP_VIDEO_FILE) {
    toast('Pilih file video MP4 dulu', 'err');
    return;
  }
  if (!isUploadMode && !url) {
    toast('Tempel URL TikTok dulu', 'err');
    return;
  }

  UP_BUSY = true;
  const btn = document.getElementById('vSaveBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Mengupload...'; }

  try {
    const sb  = getSB();
    const uid = getMyUmkmId();
    let video_url = null;
    let thumbnail_url = null;

    // ── Upload video file ke Storage ──
    if (isUploadMode && UP_VIDEO_FILE) {
      if (btn) btn.textContent = 'Mengupload video... (0%)';
      const ext = UP_VIDEO_FILE.name.split('.').pop().toLowerCase();
      const path = `${uid || 'public'}/${Date.now()}-${Math.random().toString(36).slice(2,9)}.${ext}`;

      const { data: upData, error: upErr } = await sb.storage
        .from('videos')
        .upload(path, UP_VIDEO_FILE, {
          cacheControl: '3600',
          upsert: false,
          contentType: UP_VIDEO_FILE.type,
        });

      if (upErr) {
        console.error('Upload error:', upErr);
        throw new Error('Upload gagal: ' + (upErr.message || 'Cek bucket "videos" di Supabase Storage'));
      }

      const { data: urlData } = sb.storage.from('videos').getPublicUrl(upData.path);
      video_url = urlData.publicUrl;
    }

    // ── Upload thumbnail (opsional) ──
    if (UP_THUMB_FILE) {
      if (btn) btn.textContent = 'Mengupload thumbnail...';
      const tExt  = UP_THUMB_FILE.name.split('.').pop().toLowerCase();
      const tPath = `${uid || 'public'}/thumb-${Date.now()}.${tExt}`;
      const { data: tData, error: tErr } = await sb.storage
        .from('videos')
        .upload(tPath, UP_THUMB_FILE, { cacheControl: '3600', upsert: false, contentType: UP_THUMB_FILE.type });

      if (!tErr && tData) {
        const { data: tUrl } = sb.storage.from('videos').getPublicUrl(tData.path);
        thumbnail_url = tUrl.publicUrl;
      }
    }

    // ── Insert ke tabel videos ──
    if (btn) btn.textContent = 'Menyimpan ke database...';
    const row = {
      umkm_id:       uid,
      title:         cap,
      caption:       desc || cap,
      food_name:     cap,
      food_price:    prcG,
      video_url:     video_url,
      thumbnail_url: thumbnail_url,
      tiktok_url:    !isUploadMode ? url : null,
      tiktok_id:     tiktokId,
      is_tiktok:     !isUploadMode && !!tiktokId,
      is_active:     true,
      likes:         0,
      views:         0,
    };

    const { data: inserted, error: insErr } = await sb.from('videos').insert(row).select().single();

    if (insErr) {
      console.error('Insert error:', insErr);
      throw new Error('Gagal simpan ke database: ' + insErr.message);
    }

    // Update state lokal
    STATE.videos.unshift(inserted);
    clearDataCache(); // bust cache supaya halaman lain re-fetch

    closeModal('mVid');
    toast(`Video "${cap}" berhasil ditambahkan!`, 'ok');
    render();

  } catch (err) {
    console.error('[saveVid]', err);
    toast(err.message || 'Terjadi kesalahan', 'err');
  } finally {
    UP_BUSY = false;
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan & Tampilkan di Feed'; }
  }
}
window.saveVid = saveVid;

// ─── Delete video ─────────────────────────────────────────
async function delVid(id, name) {
  if (!confirm(`Hapus video "${name}"?`)) return;
  try {
    const sb = getSB();
    // Cari video buat tau path file (kalau ada)
    const v = STATE.videos.find(x => x.id === id);

    // Hapus file dari storage kalau video_url-nya dari bucket kita
    if (v?.video_url && v.video_url.includes('/storage/v1/object/public/videos/')) {
      const path = v.video_url.split('/storage/v1/object/public/videos/')[1];
      if (path) await sb.storage.from('videos').remove([path]);
    }
    if (v?.thumbnail_url && v.thumbnail_url.includes('/storage/v1/object/public/videos/')) {
      const tpath = v.thumbnail_url.split('/storage/v1/object/public/videos/')[1];
      if (tpath) await sb.storage.from('videos').remove([tpath]);
    }

    // Hapus row dari database
    const { error } = await sb.from('videos').delete().eq('id', id);
    if (error) throw error;

    STATE.videos = STATE.videos.filter(v => v.id !== id);
    clearDataCache();
    toast(`Video "${name}" dihapus`, 'info');
    render();
  } catch (err) {
    console.error('[delVid]', err);
    toast('Gagal menghapus: ' + (err.message || 'unknown error'), 'err');
  }
}
window.delVid = delVid;

init();
