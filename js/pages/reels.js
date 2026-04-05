// ─── js/pages/reels.js ────────────────────────────────────

async function init() {
  restoreSession();
  await ensureData();
  renderSidebar();
  updateCartBadge();
  render();
  setTimeout(() => document.getElementById('ldr').classList.add('out'), 1200);
}

function render() {
  const el = document.getElementById('pageContent');

  if (!STATE.videos.length) {
    el.innerHTML = `
      <div class="ph"><div><div class="ptit">Video Feed</div><div class="psub">Konten TikTok & video UMKM Babakan Raya</div></div></div>
      ${emptyState('Belum ada video. UMKM bisa upload lewat halaman Video & TikTok.')}`;
    return;
  }

  const BG = ['#1a0408','#081008','#080814','#140c08','#080e16'];

  el.innerHTML = `
    <div class="ph"><div><div class="ptit">Video Feed</div><div class="psub">Konten TikTok & video UMKM Babakan Raya</div></div></div>
    <div style="display:grid;grid-template-columns:1fr 280px;gap:20px">
      <div class="rf" id="reelsFeed"></div>
      <div style="background:var(--s);border:1px solid var(--b);border-radius:var(--r20);padding:20px;height:calc(100vh - 130px);overflow-y:auto">
        <div class="stit">Video Lainnya</div>
        <div id="reelsSide"></div>
      </div>
    </div>`;

  document.getElementById('reelsFeed').innerHTML = STATE.videos.map((v, i) => {
    const u = STATE.umkm.find(u => u.id === v.umkm_id);
    const bg = u?.banner_url || u?.image_url;
    return `<div class="rl-r" style="background:${BG[i % BG.length]}">
      ${bg ? `<div class="rl-bg" style="background-image:url('${bg}')"></div>` : ''}
      <div class="rl-gr"></div>
      ${v.is_tiktok ? `<div style="position:absolute;top:14px;right:14px;z-index:3">
        <span class="bx bx-n" style="background:rgba(0,0,0,.55);color:#fff;border:1px solid rgba(255,255,255,.15)">TikTok</span>
      </div>` : ''}
      <div class="rl-prog">${STATE.videos.map((_,j) => `<div class="rp ${j<=i?'on':''}"></div>`).join('')}</div>
      <div class="rl-ct">
        <div class="rl-me">
          <div class="rl-mav">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/>
            </svg>
          </div>
          <span class="rl-mn">${esc(u?.nama || 'UMKM')}</span>
          <button class="rl-flw">Ikuti</button>
        </div>
        <div class="rl-fn">${esc(v.food_name || v.caption.slice(0,42))}</div>
        <div class="rl-dc">${esc(v.caption)}</div>
        <div class="rl-pr">
          <div class="rl-prc">${rp(v.food_price || v.tiktok_price || 0)}</div>
          <span class="rl-lk">${fn(v.likes || 0)} suka</span>
        </div>
        <button class="rl-cta" onclick="location.href='explore.html#${v.umkm_id}'">Pesan Sekarang</button>
      </div>
      <div class="rl-ac">
        <div class="ra">
          <div class="ra-i"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
          <div class="ra-l">${fn(v.likes || 0)}</div>
        </div>
        <div class="ra">
          <div class="ra-i"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
          <div class="ra-l">Komentar</div>
        </div>
        <div class="ra">
          <div class="ra-i"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></div>
          <div class="ra-l">Bagikan</div>
        </div>
      </div>
    </div>`;
  }).join('');

  const side = document.getElementById('reelsSide');
  if (side) side.innerHTML = STATE.videos.map(v => {
    const u = STATE.umkm.find(u => u.id === v.umkm_id);
    return `<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--b);cursor:pointer"
        onclick="location.href='explore.html#${v.umkm_id}'">
      <div style="width:56px;height:70px;border-radius:var(--r8);background:var(--m);flex-shrink:0;overflow:hidden;position:relative">
        ${u?.image_url ? `<img src="${u.image_url}" style="width:100%;height:100%;object-fit:cover;opacity:.6" loading="lazy">` : ''}
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;margin-bottom:3px;line-height:1.3">${esc(v.food_name || v.caption.slice(0,28))}</div>
        <div style="font-size:13px;font-weight:800;color:var(--m)">${rp(v.food_price || v.tiktok_price || 0)}</div>
        <div style="font-size:10px;color:var(--t3);margin-top:2px">${fn(v.views || 0)} tayangan</div>
      </div>
    </div>`;
  }).join('');
}

init();
