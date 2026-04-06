// ─── js/pages/reels.js ────────────────────────────────────
// Video Feed TikTok-style:
// - Auto-play saat masuk viewport (IntersectionObserver)
// - Auto-pause saat keluar viewport
// - Tap untuk play/pause manual
// - Mute toggle (default mute supaya autoplay diizinkan browser)
// - Fallback ke background image kalau v.video_url belum ada
// - Mobile-first

async function init() {
  restoreSession();
  await ensureData();
  renderSidebar();
  updateCartBadge();
  render();
  setTimeout(() => document.getElementById('ldr').classList.add('out'), 1200);
}

// State lokal untuk mute (shared antar semua video)
let REELS_MUTED = true;
let REELS_OBSERVER = null;

function render() {
  const el = document.getElementById('pageContent');

  if (!STATE.videos.length) {
    el.innerHTML = `
      <div class="ph"><div><div class="ptit">Video Feed</div><div class="psub">Konten video UMKM Babakan Raya</div></div></div>
      ${emptyState('Belum ada video. UMKM bisa upload lewat halaman Video & TikTok.')}`;
    return;
  }

  const BG = ['#1a0408','#081008','#080814','#140c08','#080e16'];

  el.innerHTML = `
    <div class="ph"><div><div class="ptit">Video Feed</div><div class="psub">Konten video UMKM Babakan Raya · Scroll untuk video berikutnya</div></div></div>
    <div class="rl-layout">
      <div class="rf" id="reelsFeed"></div>
      <div class="rl-side">
        <div class="stit">Video Lainnya</div>
        <div id="reelsSide"></div>
      </div>
    </div>`;

  document.getElementById('reelsFeed').innerHTML = STATE.videos.map((v, i) => {
    const u   = STATE.umkm.find(u => u.id === v.umkm_id);
    const bg  = v.thumbnail_url || u?.banner_url || u?.image_url;
    const hasVideo = !!v.video_url;
    const isTT = v.is_tiktok;

    return `<div class="rl-r" data-vid-id="${v.id}" data-vid-idx="${i}" style="background:${BG[i % BG.length]}">
      ${bg ? `<div class="rl-bg" style="background-image:url('${bg}')"></div>` : ''}

      ${hasVideo ? `
        <video
          class="rl-vid"
          data-vid-idx="${i}"
          src="${v.video_url}"
          ${v.thumbnail_url ? `poster="${v.thumbnail_url}"` : ''}
          loop
          muted
          playsinline
          webkit-playsinline
          preload="metadata"
        ></video>
      ` : ''}

      <div class="rl-gr"></div>

      ${hasVideo ? `
        <button class="rl-mute" onclick="toggleMute(event)" aria-label="Toggle sound">
          ${REELS_MUTED ? muteIcon() : soundIcon()}
        </button>
      ` : ''}

      ${!hasVideo ? `
        <div class="rl-noVid">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1.5">
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
          <div style="color:rgba(255,255,255,.4);font-size:11px;margin-top:8px">Video belum diunggah</div>
        </div>
      ` : ''}

      ${isTT ? `<div style="position:absolute;top:14px;right:14px;z-index:3">
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
          <button class="rl-flw" onclick="event.stopPropagation()">Ikuti</button>
        </div>
        <div class="rl-fn">${esc(v.food_name || (v.caption||'').slice(0,42))}</div>
        ${v.caption ? `<div class="rl-dc">${esc(v.caption)}</div>` : ''}
        <div class="rl-pr">
          <div class="rl-prc">${rp(v.food_price || v.tiktok_price || 0)}</div>
          <span class="rl-lk">${fn(v.likes || 0)} suka</span>
        </div>
        <button class="rl-cta" onclick="event.stopPropagation();location.href='explore.html#${v.umkm_id}'">Pesan Sekarang</button>
      </div>

      <div class="rl-ac">
        <div class="ra">
          <div class="ra-i"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
          <div class="ra-l">${fn(v.likes || 0)}</div>
        </div>
        <div class="ra">
          <div class="ra-i"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
          <div class="ra-l">${fn(v.comments_count || 0)}</div>
        </div>
        <div class="ra">
          <div class="ra-i"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></div>
          <div class="ra-l">${fn(v.shares || 0)}</div>
        </div>
      </div>
    </div>`;
  }).join('');

  // Sidebar list video lain
  const side = document.getElementById('reelsSide');
  if (side) side.innerHTML = STATE.videos.map(v => {
    const u = STATE.umkm.find(u => u.id === v.umkm_id);
    return `<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--b);cursor:pointer"
        onclick="scrollToVideo('${v.id}')">
      <div style="width:56px;height:70px;border-radius:var(--r8);background:var(--m);flex-shrink:0;overflow:hidden;position:relative">
        ${v.thumbnail_url
          ? `<img src="${v.thumbnail_url}" style="width:100%;height:100%;object-fit:cover" loading="lazy">`
          : (u?.image_url ? `<img src="${u.image_url}" style="width:100%;height:100%;object-fit:cover;opacity:.6" loading="lazy">` : '')}
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;margin-bottom:3px;line-height:1.3">${esc(v.food_name || (v.caption||'').slice(0,28))}</div>
        <div style="font-size:13px;font-weight:800;color:var(--m)">${rp(v.food_price || v.tiktok_price || 0)}</div>
        <div style="font-size:10px;color:var(--t3);margin-top:2px">${fn(v.views || 0)} tayangan</div>
      </div>
    </div>`;
  }).join('');

  // Setup IntersectionObserver setelah DOM siap
  setupVideoObserver();

  // Tap untuk play/pause manual + tap-to-unmute pertama kali
  document.querySelectorAll('.rl-r').forEach(card => {
    card.addEventListener('click', (e) => {
      // Jangan trigger kalau klik tombol
      if (e.target.closest('button') || e.target.closest('a')) return;
      const vid = card.querySelector('.rl-vid');
      if (!vid) return;
      if (vid.paused) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  });
}

// ── IntersectionObserver: auto play/pause ────────────────
function setupVideoObserver() {
  if (REELS_OBSERVER) REELS_OBSERVER.disconnect();

  REELS_OBSERVER = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const card = entry.target;
      const vid  = card.querySelector('.rl-vid');
      if (!vid) return;

      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        // Masuk viewport >= 60% — play
        vid.muted = REELS_MUTED;
        vid.play()
          .then(() => {
            // Increment view count (fire-and-forget, hanya sekali per session per video)
            const vidId = card.dataset.vidId;
            if (vidId && !card.dataset.viewed) {
              card.dataset.viewed = '1';
              incrementVideoView(vidId);
            }
          })
          .catch(err => {
            // Browser blokir autoplay (jarang kalau muted)
            console.warn('[reels] autoplay blocked:', err.message);
          });
      } else {
        // Keluar viewport — pause + reset
        if (!vid.paused) {
          vid.pause();
          vid.currentTime = 0;
        }
      }
    });
  }, {
    root: document.getElementById('reelsFeed'),
    threshold: [0, 0.6, 1],
  });

  document.querySelectorAll('.rl-r').forEach(card => REELS_OBSERVER.observe(card));
}

// ── Mute toggle (apply ke semua video) ───────────────────
function toggleMute(e) {
  e.stopPropagation();
  REELS_MUTED = !REELS_MUTED;

  // Apply ke semua video
  document.querySelectorAll('.rl-vid').forEach(v => { v.muted = REELS_MUTED; });

  // Update icon di semua tombol
  document.querySelectorAll('.rl-mute').forEach(btn => {
    btn.innerHTML = REELS_MUTED ? muteIcon() : soundIcon();
  });
}
window.toggleMute = toggleMute;

// ── Scroll ke video tertentu (dipanggil dari sidebar) ────
function scrollToVideo(id) {
  const card = document.querySelector(`.rl-r[data-vid-id="${id}"]`);
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.scrollToVideo = scrollToVideo;

// ── Increment view count di Supabase (fire-and-forget) ───
function incrementVideoView(videoId) {
  if (!videoId || !window.getSB) return;
  // Ambil video lokal, update state + push ke DB
  const v = STATE.videos.find(x => x.id === videoId);
  if (v) v.views = (v.views || 0) + 1;

  getSB().from('videos')
    .update({ views: v?.views || 1 })
    .eq('id', videoId)
    .then(() => {})
    .catch(() => {});
}

// ── Icons ────────────────────────────────────────────────
function muteIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
  </svg>`;
}
function soundIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
  </svg>`;
}

init();
