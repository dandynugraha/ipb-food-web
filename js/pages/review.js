// ─── js/pages/review.js ──────────────────────────────────
// Review IPB Makan — feed TikTok-style untuk video official admin
// + Engagement (Like, Comment, Share)

let REVIEW_MUTED = true;
let REVIEW_OBSERVER = null;
let REVIEW_VIDEOS = [];
window.REVIEW_VIDEOS = REVIEW_VIDEOS;

async function init() {
  restoreSession();
  await ensureData();
  renderSidebar();
  updateCartBadge();
  await loadOfficialVideos();
  render();

  // Sync likes status dari server
  if (typeof syncLikesFromServer === 'function' && REVIEW_VIDEOS.length) {
    await syncLikesFromServer(REVIEW_VIDEOS.map(v => v.id));
    refreshLikeUI();
  }

  setTimeout(() => document.getElementById('ldr').classList.add('out'), 1200);

  const urlParams = new URLSearchParams(window.location.search);
  const targetId = urlParams.get('v');
  if (targetId) setTimeout(() => scrollToVideo(targetId), 400);
}

async function loadOfficialVideos() {
  try {
    const sb = getSB();
    const { data, error } = await sb.from('videos')
      .select('*')
      .eq('is_official', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    REVIEW_VIDEOS = data || [];
    window.REVIEW_VIDEOS = REVIEW_VIDEOS;
  } catch (e) {
    console.error('[review] loadOfficialVideos:', e);
    REVIEW_VIDEOS = [];
    window.REVIEW_VIDEOS = REVIEW_VIDEOS;
  }
}

function render() {
  const el = document.getElementById('pageContent');

  if (!REVIEW_VIDEOS.length) {
    el.innerHTML = `
      <div class="ph"><div><div class="ptit">Review IPB Makan</div><div class="psub">Konten TikTok official IPB Makan</div></div></div>
      <div class="empty" style="padding:80px 20px;text-align:center">
        <div class="ei" style="margin:0 auto 14px">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.5" style="width:36px;height:36px">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div class="etit">Belum ada review TikTok</div>
        <div style="font-size:12px;color:var(--t3);margin-top:6px">Admin IPB Makan dapat upload video review lewat panel Admin → Upload Review TikTok</div>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div class="ph">
      <div>
        <div class="ptit" style="display:flex;align-items:center;gap:10px">
          Review IPB Makan
          <span class="bx" style="background:linear-gradient(135deg,var(--gold),var(--goldl));color:#fff;font-size:10px">★ OFFICIAL</span>
        </div>
        <div class="psub">Konten TikTok official IPB Makan · Scroll untuk video berikutnya</div>
      </div>
    </div>
    <div class="rl-layout">
      <div class="rf" id="reviewFeed"></div>
      <div class="rl-side">
        <div class="stit">Review Lainnya</div>
        <div id="reviewSide"></div>
      </div>
    </div>`;

  const BG = ['#1a0408','#080814','#140c08','#080e16','#1a0408'];

  document.getElementById('reviewFeed').innerHTML = REVIEW_VIDEOS.map((v, i) => {
    const u = STATE.umkm.find(u => u.id === v.umkm_id);
    const bg = v.thumbnail_url || u?.banner_url || u?.image_url;
    const hasVideo = !!v.video_url;
    const liked = typeof isVideoLiked === 'function' && isVideoLiked(v.id);

    return `<div class="rl-r" data-vid-id="${v.id}" data-vid-idx="${i}" style="background:${BG[i % BG.length]}">
      ${bg ? `<div class="rl-bg" style="background-image:url('${bg}')"></div>` : ''}

      ${hasVideo ? `
        <video class="rl-vid" data-vid-idx="${i}" src="${v.video_url}"
          ${v.thumbnail_url ? `poster="${v.thumbnail_url}"` : ''}
          loop muted playsinline webkit-playsinline preload="metadata"></video>
      ` : ''}

      <div class="rl-gr"></div>

      ${hasVideo ? `
        <button class="rl-mute" onclick="toggleReviewMute(event)" aria-label="Toggle sound">
          ${REVIEW_MUTED ? muteIcon() : soundIcon()}
        </button>
      ` : ''}

      ${!hasVideo ? `
        <div class="rl-noVid">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1.5">
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
          <div style="color:rgba(255,255,255,.4);font-size:11px;margin-top:8px">Video belum tersedia</div>
        </div>
      ` : ''}

      <div style="position:absolute;top:14px;right:14px;z-index:3">
        <span class="bx" style="background:linear-gradient(135deg,var(--gold),var(--goldl));color:#fff;font-weight:800;border:1px solid rgba(255,255,255,.2)">★ IPB Makan Official</span>
      </div>

      <div class="rl-prog">${REVIEW_VIDEOS.map((_,j) => `<div class="rp ${j<=i?'on':''}"></div>`).join('')}</div>

      <div class="rl-ct">
        <div class="rl-me">
          <div class="rl-mav" style="background:linear-gradient(135deg,var(--m),var(--md));border-color:var(--gold)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <span class="rl-mn">@ipbmakan</span>
          <span style="color:var(--gold);font-size:11px;margin-left:auto;font-weight:700">VERIFIED</span>
        </div>
        <div class="rl-fn">${esc(v.title || v.food_name || (v.caption||'').slice(0,42))}</div>
        ${v.caption ? `<div class="rl-dc">${esc(v.caption)}</div>` : ''}
        ${u ? `
          <div style="background:rgba(255,255,255,.08);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);border-radius:var(--r12);padding:10px 12px;margin-bottom:14px">
            <div style="font-size:10px;color:rgba(255,255,255,.5);font-weight:600;margin-bottom:3px">REVIEW WARUNG</div>
            <div style="color:#fff;font-size:13px;font-weight:700">${esc(u.nama)}</div>
            ${u.kiosk_number ? `<div style="font-size:11px;color:rgba(255,255,255,.5)">Kios ${esc(u.kiosk_number)}</div>` : ''}
          </div>
        ` : ''}
        ${u ? `<button class="rl-cta" onclick="event.stopPropagation();location.href='explore.html#${v.umkm_id}'">Kunjungi Warung</button>` : ''}
      </div>

      <div class="rl-ac">
        <div class="ra">
          <button class="ra-i ra-btn ${liked ? 'liked' : ''}" onclick="event.stopPropagation();toggleLike('${v.id}', this)" aria-label="Like">
            <svg viewBox="0 0 24 24" fill="${liked ? '#ff3366' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </button>
          <div class="ra-l" data-raw="${v.likes || 0}">${fn(v.likes || 0)}</div>
        </div>
        <div class="ra">
          <button class="ra-i ra-btn" onclick="event.stopPropagation();openComments('${v.id}')" aria-label="Comment">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </button>
          <div class="ra-l" data-raw="${v.comments_count || 0}">${fn(v.comments_count || 0)}</div>
        </div>
        <div class="ra">
          <button class="ra-i ra-btn" onclick="event.stopPropagation();openShare('${v.id}')" aria-label="Share">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
          <div class="ra-l" data-raw="${v.shares || 0}">${fn(v.shares || 0)}</div>
        </div>
      </div>
    </div>`;
  }).join('');

  const side = document.getElementById('reviewSide');
  if (side) side.innerHTML = REVIEW_VIDEOS.map(v => {
    const u = STATE.umkm.find(u => u.id === v.umkm_id);
    return `<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--b);cursor:pointer"
        onclick="scrollToVideo('${v.id}')">
      <div style="width:56px;height:70px;border-radius:var(--r8);background:linear-gradient(135deg,var(--m),var(--md));flex-shrink:0;overflow:hidden;position:relative">
        ${v.thumbnail_url ? `<img src="${v.thumbnail_url}" style="width:100%;height:100%;object-fit:cover" loading="lazy">` : ''}
        <div style="position:absolute;top:4px;right:4px;width:14px;height:14px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;margin-bottom:3px;line-height:1.3">${esc(v.title || v.food_name || (v.caption||'').slice(0,28))}</div>
        ${u ? `<div style="font-size:11px;color:var(--m);font-weight:600">${esc(u.nama)}</div>` : ''}
        <div style="font-size:10px;color:var(--t3);margin-top:2px">${fn(v.views || 0)} tayangan</div>
      </div>
    </div>`;
  }).join('');

  setupReviewObserver();

  document.querySelectorAll('#reviewFeed .rl-r').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      const vid = card.querySelector('.rl-vid');
      if (!vid) return;
      if (vid.paused) vid.play().catch(() => {});
      else vid.pause();
    });
  });
}

function refreshLikeUI() {
  document.querySelectorAll('#reviewFeed .rl-r').forEach(card => {
    const vidId = card.dataset.vidId;
    if (!vidId) return;
    const liked = typeof isVideoLiked === 'function' && isVideoLiked(vidId);
    const likeBtn = card.querySelector('.ra-btn');
    const heartSvg = likeBtn?.querySelector('svg');
    if (heartSvg) heartSvg.setAttribute('fill', liked ? '#ff3366' : 'none');
    if (likeBtn) likeBtn.classList.toggle('liked', liked);
  });
}

function setupReviewObserver() {
  if (REVIEW_OBSERVER) REVIEW_OBSERVER.disconnect();
  REVIEW_OBSERVER = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const card = entry.target;
      const vid = card.querySelector('.rl-vid');
      if (!vid) return;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        vid.muted = REVIEW_MUTED;
        vid.play().catch(() => {});
      } else if (!vid.paused) {
        vid.pause();
        vid.currentTime = 0;
      }
    });
  }, { root: document.getElementById('reviewFeed'), threshold: [0, 0.6, 1] });
  document.querySelectorAll('#reviewFeed .rl-r').forEach(card => REVIEW_OBSERVER.observe(card));
}

function toggleReviewMute(e) {
  e.stopPropagation();
  REVIEW_MUTED = !REVIEW_MUTED;
  document.querySelectorAll('#reviewFeed .rl-vid').forEach(v => { v.muted = REVIEW_MUTED; });
  document.querySelectorAll('#reviewFeed .rl-mute').forEach(btn => {
    btn.innerHTML = REVIEW_MUTED ? muteIcon() : soundIcon();
  });
}
window.toggleReviewMute = toggleReviewMute;

function scrollToVideo(id) {
  const card = document.querySelector(`#reviewFeed .rl-r[data-vid-id="${id}"]`);
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.scrollToVideo = scrollToVideo;

function muteIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
}
function soundIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>`;
}

init();
