// ─── js/pages/admin.js ────────────────────────────────────

async function init() {
  if (!requireAuth(['admin'])) return;
  await ensureData();
  renderSidebar();
  updateCartBadge();
  render();
  setTimeout(() => document.getElementById('ldr').classList.add('out'), 1200);
}

function render() {
  const openUmkm     = STATE.umkm.filter(u => u.is_open).length;
  const verifiedUmkm = STATE.umkm.filter(u => u.is_verified).length;
  const availDrvs    = STATE.drivers.filter(d => d.is_available).length;

  document.getElementById('pageContent').innerHTML = `
    <div class="ph">
      <div><div class="ptit">Admin Panel</div><div class="psub">Manajemen platform IPB Makan — Jl. Babakan Raya, IPB Dramaga</div></div>
      <div style="display:flex;align-items:center;gap:6px">
        <div class="bx bx-gr">Sistem Normal</div>
        <div style="width:6px;height:6px;border-radius:50%;background:var(--green);animation:pdot 2s infinite"></div>
      </div>
    </div>

    <!-- Stats -->
    <div class="g4" style="margin-bottom:22px">
      <div class="metric mp">
        <div class="mi"><svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
        <div class="mv">${STATE.umkm.length}</div><div class="ml">Warung Terdaftar</div>
        <div class="mch">${openUmkm} buka sekarang</div>
      </div>
      <div class="metric">
        <div class="mi mi-g"><svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg></div>
        <div class="mv" style="color:var(--m)">${STATE.menu.length}</div><div class="ml">Total Menu Aktif</div>
        <div class="mch mu">Dari ${STATE.umkm.length} warung</div>
      </div>
      <div class="metric">
        <div class="mi mi-b"><svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>
        <div class="mv" style="color:var(--m)">${STATE.drivers.length}</div><div class="ml">Poki Driver</div>
        <div class="mch mu">${availDrvs} tersedia</div>
      </div>
      <div class="metric">
        <div class="mi mi-gr"><svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></div>
        <div class="mv" style="color:var(--m)">${STATE.videos.length}</div><div class="ml">Video Feed</div>
        <div class="mch mu">${STATE.videos.filter(v=>v.is_tiktok).length} dari TikTok</div>
      </div>
    </div>

    <!-- Security status -->
    <div class="card cp" style="margin-bottom:22px">
      <div class="stit">Status Keamanan Database</div>
      <div class="g2">
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--gbg);border-radius:var(--r12)">
          <div style="width:36px;height:36px;background:var(--green);border-radius:var(--r8);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div><div style="font-size:13px;font-weight:800;color:var(--green)">RLS Aktif — 11 Tabel</div><div style="font-size:12px;color:var(--t2)">Row Level Security di semua tabel publik</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--gbg);border-radius:var(--r12)">
          <div style="width:36px;height:36px;background:var(--green);border-radius:var(--r8);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div><div style="font-size:13px;font-weight:800;color:var(--green)">Gemini Edge Function</div><div style="font-size:12px;color:var(--t2)">API key server-side · Tidak terekspos browser</div></div>
        </div>
      </div>
    </div>

    <!-- Tables -->
    <div class="g2" style="margin-bottom:22px">
      <div class="card cp">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div class="stit" style="margin-bottom:0">Warung UMKM Terdaftar</div>
          <div style="display:flex;gap:6px">
            <span class="bx bx-gr">${verifiedUmkm} terverifikasi</span>
            <span class="bx bx-a">${STATE.umkm.length - verifiedUmkm} pending</span>
          </div>
        </div>
        <div id="adminUmkm"></div>
      </div>
      <div class="card cp">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div class="stit" style="margin-bottom:0">Poki Driver — Zona Dramaga</div>
          <span class="bx bx-b">${availDrvs} aktif</span>
        </div>
        <div id="adminDrvs"></div>
      </div>
    </div>

    <!-- Ulasan terbaru -->
    <div class="card cp">
      <div class="stit">Ulasan Terbaru Platform</div>
      <div id="adminRevs"></div>
    </div>`;

  // UMKM rows
  document.getElementById('adminUmkm').innerHTML = STATE.umkm.map(u => `
    <div class="ar-row">
      <div class="ar-av"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg></div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700">${esc(u.nama)}</div>
        <div style="font-size:11px;color:var(--t3)">${u.kiosk_number||'—'} · ${esc(u.address||u.lokasi||'—')}</div>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center">
        ${u.is_verified ? '<span class="bx bx-gr">Verified</span>' : '<span class="bx bx-a">Pending</span>'}
        ${u.poki_enabled ? '<span class="bx bx-b">Poki</span>' : ''}
        <span class="bx bx-n">⭐ ${u.umkm_rating||'—'}</span>
        <span class="${u.is_open?'sp sp-op':'sp sp-cl'}">${u.is_open?'Buka':'Tutup'}</span>
      </div>
    </div>`).join('') || emptyState('Tidak ada warung');

  // Driver rows
  document.getElementById('adminDrvs').innerHTML = STATE.drivers.map(d => `
    <div class="ar-row">
      <div class="ar-av ar-av-b"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg></div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700">${esc(d.name)}</div>
        <div style="font-size:11px;color:var(--t3)">${esc(d.vehicle||'Motor')} · ${esc(d.plate_number||'—')} · <a href="tel:${d.phone}" style="color:var(--blue)">${d.phone}</a></div>
      </div>
      <div style="display:flex;gap:5px;align-items:center">
        <span class="${d.is_available?'sp sp-op':'sp sp-cl'}">${d.is_available?'Tersedia':'Sibuk'}</span>
        <span class="bx bx-n">⭐ ${d.rating||'—'}</span>
        <span class="bx bx-n">${d.total_deliveries||0} antar</span>
      </div>
    </div>`).join('') || emptyState('Tidak ada driver');

  // Review rows
  document.getElementById('adminRevs').innerHTML = STATE.reviews.slice(0,6).map(r => {
    const u = STATE.umkm.find(u => u.id === r.umkm_id);
    return `<div style="display:flex;align-items:flex-start;gap:10px;padding:12px 0;border-bottom:1px solid var(--b)">
      <div style="width:28px;height:28px;border-radius:50%;background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0">
        ${String.fromCharCode(65+Math.floor(Math.random()*26))}
      </div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px">
          <span style="font-size:12px;font-weight:700">Mahasiswa IPB</span>
          <span class="bx bx-n" style="font-size:9px">${esc(u?.nama||'—')}</span>
          <span style="margin-left:auto;font-size:10px;color:var(--t3)">${fd(r.created_at)}</span>
          <span style="color:var(--gold);font-size:11px">${'★'.repeat(r.review_rating)}</span>
        </div>
        <div style="font-size:12px;color:var(--t2);line-height:1.5">${esc(r.comment||'')}</div>
      </div>
    </div>`;
  }).join('') || emptyState('Belum ada ulasan');
}

init();
