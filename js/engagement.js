// ─── js/engagement.js ─────────────────────────────────────
// Shared helper untuk Like, Comment, Share di reels.html & review.html
// Dipakai oleh reels.js dan review.js

// ─── Device fingerprint untuk anonymous like ──────────────
// Generate random ID sekali, simpan di localStorage, dipakai untuk track like
function getDeviceId() {
  let id = localStorage.getItem('ipbmakan_device_id');
  if (!id) {
    id = 'dev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
    localStorage.setItem('ipbmakan_device_id', id);
  }
  return id;
}
window.getDeviceId = getDeviceId;

// ─── Cache liked videos di localStorage biar UI instan ────
function getLikedVideos() {
  try {
    return JSON.parse(localStorage.getItem('ipbmakan_liked') || '[]');
  } catch(e) { return []; }
}
function setLikedVideos(arr) {
  try {
    localStorage.setItem('ipbmakan_liked', JSON.stringify(arr));
  } catch(e) {}
}
window.getLikedVideos = getLikedVideos;

function isVideoLiked(videoId) {
  return getLikedVideos().includes(videoId);
}
window.isVideoLiked = isVideoLiked;

// ─── TOGGLE LIKE ──────────────────────────────────────────
async function toggleLike(videoId, btnEl) {
  if (!videoId) return;
  const sb = getSB();
  const deviceId = getDeviceId();
  const liked = getLikedVideos();
  const isLiked = liked.includes(videoId);

  // Update UI dulu (optimistic)
  const counterEl = btnEl?.closest('.ra')?.querySelector('.ra-l');
  const heartSvg = btnEl?.querySelector('svg');
  let currentCount = parseInt(counterEl?.dataset.raw || '0') || 0;

  if (isLiked) {
    // UNLIKE
    setLikedVideos(liked.filter(id => id !== videoId));
    currentCount = Math.max(0, currentCount - 1);
    if (heartSvg) heartSvg.setAttribute('fill', 'none');
    if (btnEl) btnEl.classList.remove('liked');

    try {
      await sb.from('video_likes')
        .delete()
        .eq('video_id', videoId)
        .eq('liker_id', deviceId);
    } catch(e) {
      console.error('[unlike]', e);
    }
  } else {
    // LIKE
    setLikedVideos([...liked, videoId]);
    currentCount = currentCount + 1;
    if (heartSvg) heartSvg.setAttribute('fill', '#ff3366');
    if (btnEl) btnEl.classList.add('liked');

    // Animasi pop
    if (btnEl) {
      btnEl.classList.add('like-pop');
      setTimeout(() => btnEl.classList.remove('like-pop'), 400);
    }

    try {
      await sb.from('video_likes').insert({
        video_id: videoId,
        liker_id: deviceId,
        liker_name: STATE.user?.full_name || 'Tamu',
      });
    } catch(e) {
      // Kalau error karena UNIQUE constraint (race condition), abaikan
      if (!e.message?.includes('duplicate')) console.error('[like]', e);
    }
  }

  // Update counter UI
  if (counterEl) {
    counterEl.dataset.raw = currentCount;
    counterEl.textContent = fn(currentCount);
  }

  // Update STATE.videos juga biar konsisten
  const v = STATE.videos?.find(x => x.id === videoId);
  if (v) v.likes = currentCount;
}
window.toggleLike = toggleLike;

// ─── COMMENT MODAL ────────────────────────────────────────
let CURRENT_COMMENT_VIDEO_ID = null;

async function openComments(videoId) {
  CURRENT_COMMENT_VIDEO_ID = videoId;

  // Buat modal kalau belum ada
  let modal = document.getElementById('cmtModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cmtModal';
    modal.className = 'cmt-modal';
    modal.innerHTML = `
      <div class="cmt-backdrop" onclick="closeComments()"></div>
      <div class="cmt-sheet">
        <div class="cmt-header">
          <div class="cmt-title">Komentar</div>
          <button class="cmt-close" onclick="closeComments()">✕</button>
        </div>
        <div class="cmt-list" id="cmtList">
          <div style="text-align:center;padding:40px 0;color:var(--t3);font-size:13px">Memuat komentar...</div>
        </div>
        <div class="cmt-input-wrap" id="cmtInputWrap"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.classList.add('open');
  await loadComments(videoId);
  renderCommentInput();
}
window.openComments = openComments;

function closeComments() {
  const modal = document.getElementById('cmtModal');
  if (modal) modal.classList.remove('open');
  CURRENT_COMMENT_VIDEO_ID = null;
}
window.closeComments = closeComments;

async function loadComments(videoId) {
  const listEl = document.getElementById('cmtList');
  if (!listEl) return;

  try {
    const sb = getSB();
    const { data, error } = await sb.from('video_comments')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    if (!data || !data.length) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:60px 20px;color:var(--t3)">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 12px;display:block;opacity:.3">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <div style="font-size:13px;font-weight:600;margin-bottom:4px">Belum ada komentar</div>
          <div style="font-size:11px">Jadi yang pertama berkomentar!</div>
        </div>`;
      return;
    }

    listEl.innerHTML = data.map(c => `
      <div class="cmt-item">
        <div class="cmt-avatar">${(c.user_avatar || c.user_name || '?').charAt(0).toUpperCase()}</div>
        <div class="cmt-body">
          <div class="cmt-name">${esc(c.user_name)}</div>
          <div class="cmt-text">${esc(c.comment_text)}</div>
          <div class="cmt-time">${formatTimeAgo(c.created_at)}</div>
        </div>
      </div>
    `).join('');
  } catch(e) {
    console.error('[loadComments]', e);
    listEl.innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--red);font-size:12px">Gagal memuat komentar</div>';
  }
}
window.loadComments = loadComments;

function renderCommentInput() {
  const wrap = document.getElementById('cmtInputWrap');
  if (!wrap) return;

  const isLoggedIn = !!STATE.user;

  if (!isLoggedIn) {
    wrap.innerHTML = `
      <div style="padding:14px 16px;background:var(--s2);border-top:1px solid var(--b)">
        <div style="font-size:12px;color:var(--t3);text-align:center;margin-bottom:10px">Masuk untuk berkomentar</div>
        <button class="btn b-pri b-fw b-sm" onclick="window.location.href='index.html'">Masuk / Daftar</button>
      </div>
    `;
    return;
  }

  wrap.innerHTML = `
    <div class="cmt-input-row">
      <div class="cmt-avatar" style="width:32px;height:32px">${(STATE.user.full_name || 'U').charAt(0).toUpperCase()}</div>
      <input type="text" id="cmtInputBox" class="cmt-input" placeholder="Tulis komentar..." maxlength="500"
        onkeypress="if(event.key==='Enter')submitComment()">
      <button class="cmt-send" onclick="submitComment()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
        </svg>
      </button>
    </div>
  `;
}

async function submitComment() {
  const input = document.getElementById('cmtInputBox');
  if (!input) return;
  const text = input.value.trim();
  if (!text || !CURRENT_COMMENT_VIDEO_ID) return;
  if (!STATE.user) {
    toast('Masuk dulu untuk berkomentar', 'err');
    return;
  }

  input.disabled = true;
  try {
    const sb = getSB();
    const { error } = await sb.from('video_comments').insert({
      video_id: CURRENT_COMMENT_VIDEO_ID,
      user_id: STATE.user.id,
      user_name: STATE.user.full_name || 'User',
      user_avatar: (STATE.user.full_name || 'U').charAt(0).toUpperCase(),
      comment_text: text,
    });
    if (error) throw error;

    input.value = '';
    await loadComments(CURRENT_COMMENT_VIDEO_ID);

    // Update counter di card video
    const card = document.querySelector(`.rl-r[data-vid-id="${CURRENT_COMMENT_VIDEO_ID}"]`);
    if (card) {
      const cmtBtn = card.querySelectorAll('.ra')[1]; // index 1 = comment button
      const counter = cmtBtn?.querySelector('.ra-l');
      if (counter) {
        const cur = parseInt(counter.dataset.raw || '0') + 1;
        counter.dataset.raw = cur;
        counter.textContent = fn(cur);
      }
    }

    toast('Komentar terkirim!', 'ok');
  } catch(e) {
    console.error('[submitComment]', e);
    toast('Gagal mengirim komentar', 'err');
  } finally {
    input.disabled = false;
    input.focus();
  }
}
window.submitComment = submitComment;

// ─── SHARE MODAL ──────────────────────────────────────────
function openShare(videoId) {
  const v = STATE.videos?.find(x => x.id === videoId)
    || (window.REVIEW_VIDEOS && REVIEW_VIDEOS.find(x => x.id === videoId));
  if (!v) return;

  const pageUrl = window.location.origin + window.location.pathname + '?v=' + videoId;
  const shareTitle = v.title || v.food_name || v.caption || 'Video IPB Makan';
  const tiktokUrl = v.tiktok_url || '';

  let modal = document.getElementById('shareModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.className = 'cmt-modal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="cmt-backdrop" onclick="closeShare()"></div>
    <div class="cmt-sheet share-sheet">
      <div class="cmt-header">
        <div class="cmt-title">Bagikan</div>
        <button class="cmt-close" onclick="closeShare()">✕</button>
      </div>
      <div style="padding:8px 16px 24px">
        <div style="font-size:13px;font-weight:700;margin-bottom:4px">${esc(shareTitle)}</div>
        <div style="font-size:11px;color:var(--t3);margin-bottom:18px;word-break:break-all">${pageUrl}</div>

        <div class="share-grid">
          <button class="share-btn" onclick="shareCopy('${pageUrl.replace(/'/g, "\\'")}')">
            <div class="share-icon" style="background:#3B82F6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            </div>
            <div class="share-label">Salin Link</div>
          </button>

          <button class="share-btn" ${tiktokUrl ? '' : 'disabled style="opacity:.4"'} onclick="${tiktokUrl ? `shareTiktok('${tiktokUrl.replace(/'/g, "\\'")}')` : ''}">
            <div class="share-icon" style="background:#000">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.8 20.1a6.34 6.34 0 0010.86-4.43V8.69a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.84-.12z"/>
              </svg>
            </div>
            <div class="share-label">${tiktokUrl ? 'TikTok' : 'TikTok (n/a)'}</div>
          </button>

          <button class="share-btn" onclick="shareWhatsapp('${pageUrl.replace(/'/g, "\\'")}', '${shareTitle.replace(/'/g, "\\'")}')">
            <div class="share-icon" style="background:#25D366">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .2.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z"/>
                <path d="M20.5 3.5C18.3 1.2 15.3 0 12 0 5.4 0 0 5.4 0 12c0 2.1.5 4.2 1.6 6L0 24l6.2-1.6c1.7.9 3.7 1.4 5.7 1.4h.1c6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.5-8.4zM12 21.8h-.1c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.7 1 1-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.2 0-5.5 4.5-10 10-10 2.7 0 5.2 1 7.1 2.9 1.9 1.9 2.9 4.4 2.9 7.1 0 5.5-4.5 9.8-10 9.8z"/>
              </svg>
            </div>
            <div class="share-label">WhatsApp</div>
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('open');
}
window.openShare = openShare;

function closeShare() {
  document.getElementById('shareModal')?.classList.remove('open');
}
window.closeShare = closeShare;

function shareCopy(url) {
  navigator.clipboard.writeText(url)
    .then(() => { toast('Link disalin!', 'ok'); closeShare(); })
    .catch(() => toast('Gagal menyalin link', 'err'));
}
window.shareCopy = shareCopy;

function shareTiktok(url) {
  window.open(url, '_blank');
  closeShare();
}
window.shareTiktok = shareTiktok;

function shareWhatsapp(url, title) {
  const text = `${title}\n${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  closeShare();
}
window.shareWhatsapp = shareWhatsapp;

// ─── Helper: format relative time ─────────────────────────
function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
  if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
  if (diff < 604800) return Math.floor(diff / 86400) + ' hari lalu';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
window.formatTimeAgo = formatTimeAgo;

// ─── Bulk fetch likes status untuk batch video ────────────
// Dipanggil sekali pas page load, biar tau video mana yang udah di-like user ini
async function syncLikesFromServer(videoIds) {
  if (!videoIds || !videoIds.length) return;
  try {
    const sb = getSB();
    const deviceId = getDeviceId();
    const { data } = await sb.from('video_likes')
      .select('video_id')
      .eq('liker_id', deviceId)
      .in('video_id', videoIds);
    if (data) {
      const serverLiked = data.map(r => r.video_id);
      // Merge dengan localStorage
      const local = getLikedVideos();
      const merged = [...new Set([...local, ...serverLiked])];
      setLikedVideos(merged);
    }
  } catch(e) {
    console.warn('[syncLikes]', e);
  }
}
window.syncLikesFromServer = syncLikesFromServer;
