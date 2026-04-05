// js/pages/reels.js
// TikTok embed otomatis, autoplay saat masuk viewport

async function init() {
  restoreSession();
  await ensureData();
  renderSidebar();
  updateCartBadge();
  render();
  setTimeout(function(){ document.getElementById('ldr').classList.add('out'); }, 800);
}

function render() {
  var el = document.getElementById('pageContent');

  if (!STATE.videos.length) {
    el.innerHTML =
      '<div class="ph"><div><div class="ptit">Video Feed</div>' +
      '<div class="psub">Konten TikTok UMKM Babakan Raya</div></div></div>' +
      emptyState('Belum ada video. UMKM bisa tambah lewat menu Video & TikTok.');
    return;
  }

  el.innerHTML =
    '<div class="ph">' +
      '<div><div class="ptit">Video Feed</div>' +
      '<div class="psub">Konten TikTok & video UMKM Babakan Raya</div></div>' +
    '</div>' +
    '<div id="reelsWrap" style="display:flex;gap:20px;align-items:flex-start">' +
      '<div id="reelsFeed" style="flex:1;min-width:0;max-width:460px;margin:0 auto"></div>' +
      '<div id="reelsSide" style="width:260px;flex-shrink:0;background:var(--s);border:1px solid var(--b);border-radius:var(--r20);padding:18px;position:sticky;top:80px;max-height:calc(100vh - 110px);overflow-y:auto"></div>' +
    '</div>';

  buildFeed();
  buildSide();
  setupIntersection();
}

function buildFeed() {
  var feed = document.getElementById('reelsFeed');
  if (!feed) return;
  var html = '';

  STATE.videos.forEach(function(v, i) {
    var u = getUmkm(v.umkm_id);
    var hasTT = v.is_tiktok && v.tiktok_id;
    var bg = (u && u.banner_url) ? u.banner_url : '';
    var uNama = u ? esc(u.nama) : 'IPB Makan';
    var uId = v.umkm_id;

    html +=
      '<div class="reel-card" id="reel-' + i + '" data-idx="' + i + '" ' +
        'style="background:#0f172a;border-radius:var(--r20);overflow:hidden;margin-bottom:20px;' +
        'aspect-ratio:9/16;position:relative;width:100%">' +

        // Background
        (bg && !hasTT
          ? '<div style="position:absolute;inset:0;background-image:url(' + bg + ');background-size:cover;' +
            'background-position:center;filter:blur(4px) brightness(.4);transform:scale(1.1)"></div>'
          : '') +

        // Gradient overlay
        '<div style="position:absolute;inset:0;background:linear-gradient(to top,' +
          'rgba(0,0,0,.92) 0%,rgba(0,0,0,.05) 55%,rgba(0,0,0,.3) 100%);z-index:1;pointer-events:none"></div>' +

        // Progress dots
        '<div style="position:absolute;top:12px;left:14px;right:14px;z-index:3;display:flex;gap:3px;pointer-events:none">' +
          STATE.videos.map(function(_, j) {
            return '<div style="flex:1;height:2px;border-radius:1px;background:' +
              (j === i ? '#fff' : 'rgba(255,255,255,.22)') + '"></div>';
          }).join('') +
        '</div>' +

        // TikTok badge
        (hasTT
          ? '<div style="position:absolute;top:24px;right:14px;z-index:3;pointer-events:none">' +
            '<span style="background:rgba(0,0,0,.65);color:#fff;font-size:10px;font-weight:800;' +
            'padding:3px 8px;border-radius:10px;border:1px solid rgba(255,255,255,.2)">TikTok</span></div>'
          : '') +

        // Media area
        '<div class="reel-media" id="media-' + i + '" style="position:absolute;inset:0;z-index:2">' +
          (hasTT ? buildTTPlaceholder(v.tiktok_id) : buildPlaceholder(bg)) +
        '</div>' +

        // Bottom info
        '<div style="position:absolute;bottom:0;left:0;right:58px;z-index:4;padding:18px 16px">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
            '<div style="width:30px;height:30px;border-radius:50%;background:var(--m);' +
              'display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,.3);flex-shrink:0">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="2">' +
                '<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/>' +
              '</svg>' +
            '</div>' +
            '<span style="color:#fff;font-size:12px;font-weight:700;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + uNama + '</span>' +
            '<button onclick="location.href=\'explore.html#' + uId + '\'" ' +
              'style="background:var(--m);color:#fff;border:none;font-size:11px;font-weight:800;' +
              'padding:5px 12px;border-radius:20px;cursor:pointer;font-family:inherit;flex-shrink:0">Pesan</button>' +
          '</div>' +
          '<div style="color:#fff;font-size:16px;font-weight:800;line-height:1.3;margin-bottom:5px">' +
            esc((v.food_name || v.caption).slice(0, 45)) +
          '</div>' +
          '<div style="color:rgba(255,255,255,.55);font-size:11px;line-height:1.5;margin-bottom:10px">' +
            esc(v.caption.slice(0, 80)) + (v.caption.length > 80 ? '...' : '') +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:12px">' +
            '<div style="color:var(--gold);font-size:20px;font-weight:800">' + rp(v.food_price || v.tiktok_price || 0) + '</div>' +
            '<div style="font-size:10px;color:rgba(255,255,255,.38)">' + fn(v.likes||0) + ' suka</div>' +
          '</div>' +
        '</div>' +

        // Action buttons
        '<div style="position:absolute;bottom:18px;right:10px;z-index:4;display:flex;flex-direction:column;gap:14px;align-items:center">' +
          mkActionBtn('M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z', fn(v.likes||0)) +
          mkActionBtn('M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z', 'Komen') +
          mkActionBtn('M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98M21 5a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0zM21 19a3 3 0 11-6 0 3 3 0 016 0z', 'Bagikan') +
        '</div>' +

      '</div>';
  });

  feed.innerHTML = html;
}

function buildTTPlaceholder(tiktokId) {
  return '<div class="tt-ph" data-tid="' + tiktokId + '" ' +
    'style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;cursor:pointer" ' +
    'onclick="loadTT(this)">' +
      '<div style="text-align:center;padding:20px">' +
        '<div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.1);' +
          'display:flex;align-items:center;justify-content:center;margin:0 auto 12px;' +
          'border:2px solid rgba(255,255,255,.2)">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
        '</div>' +
        '<div style="color:rgba(255,255,255,.55);font-size:12px;font-weight:600">Tap untuk putar TikTok</div>' +
      '</div>' +
  '</div>';
}

function buildPlaceholder(bg) {
  return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">' +
    (bg ? '<img src="' + bg + '" style="width:100%;height:100%;object-fit:cover;opacity:.45">' : '') +
    '<div style="position:absolute;width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.12);' +
      'display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
    '</div>' +
  '</div>';
}

function mkActionBtn(d, label) {
  return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer">' +
    '<div style="width:40px;height:40px;background:rgba(255,255,255,.12);border-radius:50%;' +
      'display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);' +
      'border:1px solid rgba(255,255,255,.1)">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="2"><path d="' + d + '"/></svg>' +
    '</div>' +
    '<div style="color:rgba(255,255,255,.65);font-size:10px;font-weight:700">' + label + '</div>' +
  '</div>';
}

// Load TikTok iframe
window.loadTT = function(el) {
  var tid = el.dataset.tid;
  if (!tid) return;
  el.parentNode.innerHTML =
    '<iframe src="https://www.tiktok.com/embed/v2/' + tid + '?autoplay=1" ' +
    'style="width:100%;height:100%;border:none" ' +
    'allow="autoplay;fullscreen;encrypted-media" allowfullscreen></iframe>';
};

function buildSide() {
  var side = document.getElementById('reelsSide');
  if (!side) return;
  var html = '<div style="font-size:14px;font-weight:800;margin-bottom:14px">Video Lainnya</div>';
  STATE.videos.forEach(function(v) {
    var u = getUmkm(v.umkm_id);
    html +=
      '<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--b);cursor:pointer" ' +
        'onclick="location.href=\'explore.html#' + v.umkm_id + '\'">' +
        '<div style="width:52px;height:68px;border-radius:var(--r8);background:var(--m);flex-shrink:0;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="white" style="opacity:.6"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
          (v.is_tiktok ? '<div style="position:absolute;bottom:2px;left:2px;background:rgba(0,0,0,.6);color:#fff;font-size:7px;font-weight:800;padding:1px 4px;border-radius:3px">TT</div>' : '') +
        '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:11px;font-weight:700;margin-bottom:2px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' +
            esc(v.food_name || v.caption.slice(0, 30)) +
          '</div>' +
          '<div style="font-size:12px;font-weight:800;color:var(--m)">' + rp(v.food_price || 0) + '</div>' +
          '<div style="font-size:10px;color:var(--t3);margin-top:2px">' + fn(v.views||0) + ' tayangan</div>' +
        '</div>' +
      '</div>';
  });
  side.innerHTML = html;
}

// Auto-load TikTok saat card masuk viewport 70%
function setupIntersection() {
  if (!('IntersectionObserver' in window)) return;
  var loaded = {};
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var idx = entry.target.dataset.idx;
      if (loaded[idx]) return;
      var ph = entry.target.querySelector('.tt-ph');
      if (ph) {
        loaded[idx] = true;
        loadTT(ph);
      }
    });
  }, { threshold: 0.65 });

  document.querySelectorAll('.reel-card').forEach(function(c) { obs.observe(c); });
}

init();
