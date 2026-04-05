// ─── js/pages/videos.js ───────────────────────────────────

async function init() {
  if (!requireAuth(['umkm', 'admin'])) return;
  await loadAllData();
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
        <div class="psub">Tempel link TikTok + harga → otomatis tampil di Video Feed publik</div>
      </div>
      <button class="btn b-pri" onclick="openModal('mVid')">
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
        <div style="color:#fff;font-size:14px;font-weight:800;margin-bottom:3px">Cara kerja TikTok Automation</div>
        <div style="color:rgba(255,255,255,.5);font-size:12px;line-height:1.5">
          Tempel link TikTok → ID video diekstrak otomatis → embed di Video Feed publik. Pelanggan bisa langsung pesan dari video.
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
      <div class="modal">
        <div class="mh"><div class="mt">Tambah Video / TikTok</div><button class="mx" onclick="closeModal('mVid')">✕</button></div>
        <div class="mb">
          <div class="atabs" style="margin-bottom:20px" id="vTabs">
            <button class="atab on" onclick="swVType('tt')">TikTok Link</button>
            <button class="atab" onclick="swVType('up')">Upload Video</button>
          </div>
          <div id="vTTF">
            <div class="fg">
              <label class="fl">Link TikTok</label>
              <input type="text" class="fi" id="vUrl"
                placeholder="https://www.tiktok.com/@username/video/7234567890123456789"
                oninput="previewTT(this.value)">
              <div class="fi-h">ID video akan diekstrak otomatis dan di-embed ke feed publik</div>
            </div>
            <div id="ttPreview" style="display:none;background:var(--gbg);border-radius:var(--r12);padding:12px;margin-bottom:14px;align-items:center;gap:10px;border-left:3px solid var(--green)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              <div>
                <div style="font-size:12px;font-weight:700;color:var(--green)">TikTok Video Terdeteksi</div>
                <div style="font-size:11px;color:var(--t3)" id="ttIdLbl">ID: —</div>
              </div>
            </div>
          </div>
          <div id="vUPF" style="display:none">
            <div class="fg">
              <label class="fl">Upload Video (MP4, MOV — maks. 100MB)</label>
              <div class="uz" style="padding:22px">
                <div class="uz-i"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></div>
                <div class="uz-t">Drag &amp; drop video atau klik</div>
                <div class="uz-s">Aktif setelah Supabase Storage dikonfigurasi</div>
              </div>
            </div>
          </div>
          <div class="fg"><label class="fl">Nama Makanan / Caption</label><input type="text" class="fi" id="vCap" placeholder="Ayam Bakar Bumbu Rahasia Bu Sari"></div>
          <div class="r2">
            <div class="fg"><label class="fl">Harga Mahasiswa (Rp)</label><input type="number" class="fi" id="vPS" placeholder="16000"></div>
            <div class="fg"><label class="fl">Harga Umum (Rp)</label><input type="number" class="fi" id="vPG" placeholder="18000"></div>
          </div>
          <button class="btn b-pri b-fw" onclick="saveVid()">Simpan &amp; Tampilkan di Feed</button>
        </div>
      </div>
    </div>`;

  renderGrid(myVids);
}

function renderGrid(vids) {
  const el = document.getElementById('vidGrid'); if (!el || !vids.length) return;
  el.innerHTML = vids.map(v => `
    <div class="card" style="overflow:hidden">
      <div style="aspect-ratio:9/16;background:linear-gradient(135deg,#0f172a,#1e293b);position:relative;display:flex;align-items:center;justify-content:center">
        <svg style="opacity:.12" width="56" height="56" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        ${v.is_tiktok
          ? `<div style="position:absolute;top:10px;left:10px"><span class="bx bx-n" style="background:rgba(0,0,0,.6);color:#fff;border:1px solid rgba(255,255,255,.15)">TikTok</span></div>`
          : `<div style="position:absolute;top:10px;left:10px"><span class="bx bx-b">Upload</span></div>`}
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
          <div style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
        ${v.tiktok_id
          ? `<div style="position:absolute;bottom:8px;left:8px;right:8px"><div style="font-size:9px;color:rgba(255,255,255,.35);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">ID: ${v.tiktok_id}</div></div>`
          : ''}
      </div>
      <div style="padding:12px 14px">
        <div style="font-size:12px;font-weight:800;margin-bottom:3px;line-height:1.3">${esc(v.food_name || v.caption.slice(0,36))}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:14px;font-weight:800;color:var(--m)">${rp(v.food_price || v.tiktok_price || 0)}</div>
          ${v.student_price ? `<div style="font-size:11px;color:var(--t3);text-decoration:line-through">${rp(v.student_price)}</div>` : ''}
        </div>
        <div style="font-size:10px;color:var(--t3);margin-bottom:10px;display:flex;gap:10px">
          <span>${fn(v.views||0)} tayangan</span><span>${fn(v.likes||0)} suka</span><span>${fd(v.created_at)}</span>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn b-gho b-sm" style="flex:1" onclick="toast('Fitur edit segera hadir','info')">Edit</button>
          <button class="btn b-dan b-sm" onclick="delVid('${v.id}','${esc(v.food_name||v.caption.slice(0,20))}')">Hapus</button>
        </div>
      </div>
    </div>`).join('');
}

// ── TikTok ────────────────────────────────────────────────
function previewTT(url) {
  const match = url.match(/video\/(\d+)/);
  const pv = document.getElementById('ttPreview');
  const lb = document.getElementById('ttIdLbl');
  if (pv) pv.style.display = match ? 'flex' : 'none';
  if (lb && match) lb.textContent = `ID: ${match[1]}`;
}

function swVType(t) {
  document.querySelectorAll('#vTabs .atab').forEach((b,i) =>
    b.classList.toggle('on', (t==='tt'&&i===0)||(t==='up'&&i===1)));
  document.getElementById('vTTF').style.display = t==='tt' ? '' : 'none';
  document.getElementById('vUPF').style.display  = t==='up' ? '' : 'none';
}

function saveVid() {
  const cap  = document.getElementById('vCap').value.trim();
  const url  = document.getElementById('vUrl')?.value.trim() || '';
  const prcG = parseInt(document.getElementById('vPG').value) || 0;
  const prcS = parseInt(document.getElementById('vPS').value) || 0;
  if (!cap) { toast('Caption wajib diisi', 'err'); return; }

  const tiktokId = url.match(/video\/(\d+)/)?.[1] || null;
  STATE.videos.unshift({
    id: 'v-' + Date.now(),
    umkm_id: getMyUmkmId(),
    caption: cap, food_name: cap,
    food_price: prcG, student_price: prcS,
    is_tiktok: !!tiktokId, tiktok_id: tiktokId,
    tiktok_embed_url: tiktokId ? `https://www.tiktok.com/embed/v2/${tiktokId}` : null,
    platform: tiktokId ? 'tiktok' : 'upload',
    tiktok_price: prcG,
    likes: 0, views: 0, created_at: new Date().toISOString(),
  });

  closeModal('mVid');
  toast(`Video "${cap}" ditambahkan ke feed!`, 'ok');
  render();
}

function delVid(id, name) {
  if (!confirm(`Hapus video "${name}"?`)) return;
  STATE.videos = STATE.videos.filter(v => v.id !== id);
  toast(`Video "${name}" dihapus`, 'info');
  render();
}

init();
