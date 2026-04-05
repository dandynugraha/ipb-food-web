// js/pages/videos.js — TikTok manager

async function init() {
  if (!requireAuth(['umkm', 'admin'])) return;
  await ensureData();
  renderSidebar();
  updateCartBadge();
  render();
  setTimeout(function(){ document.getElementById('ldr').classList.add('out'); }, 800);
}

function render() {
  var uid    = getMyUmkmId();
  var myVids = getMyVideos(uid);

  document.getElementById('pageContent').innerHTML =
    '<div class="ph">' +
      '<div><div class="ptit">Video & TikTok</div>' +
      '<div class="psub">Masukkan link TikTok IPB Makan — otomatis muncul di Video Feed</div></div>' +
      '<button class="btn b-pri" onclick="openModal(\'mVid\')">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
        'Tambah Video TikTok' +
      '</button>' +
    '</div>' +

    '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:var(--r16);padding:18px 20px;' +
      'display:flex;align-items:flex-start;gap:14px;margin-bottom:22px;border:1px solid rgba(255,255,255,.06)">' +
      '<div style="width:40px;height:40px;background:rgba(255,255,255,.08);border-radius:var(--r12);display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>' +
      '</div>' +
      '<div>' +
        '<div style="color:#fff;font-size:13px;font-weight:800;margin-bottom:4px">Cara menambahkan video TikTok IPB Makan</div>' +
        '<div style="color:rgba(255,255,255,.5);font-size:12px;line-height:1.7">' +
          '1. Buka TikTok &rarr; video &rarr; Bagikan &rarr; <strong style="color:rgba(255,255,255,.75)">Salin Tautan</strong><br>' +
          '2. Tempel link di form, isi nama menu &amp; harga<br>' +
          '3. Simpan &rarr; video langsung muncul di <strong style="color:rgba(255,255,255,.75)">Video Feed &amp; Beranda</strong>' +
        '</div>' +
      '</div>' +
      '<span style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.6);font-size:10px;font-weight:800;padding:3px 8px;border-radius:10px;border:1px solid rgba(255,255,255,.1);flex-shrink:0;align-self:flex-start">' + myVids.length + ' Video</span>' +
    '</div>' +

    '<div class="ga" id="vidGrid">' +
      (myVids.length ? '' : '<div style="grid-column:1/-1">' + emptyState('Belum ada video. Tambahkan link TikTok IPB Makan!') + '</div>') +
    '</div>' +

    '<div class="mbk" id="mVid" onclick="if(event.target===this)closeModal(\'mVid\')">' +
      '<div class="modal">' +
        '<div class="mh"><div class="mt">Tambah Video TikTok</div><button class="mx" onclick="closeModal(\'mVid\')">&#x2715;</button></div>' +
        '<div class="mb">' +
          '<div class="fg">' +
            '<label class="fl">Link TikTok IPB Makan</label>' +
            '<input type="text" class="fi" id="vUrl" placeholder="https://vm.tiktok.com/xxx atau https://www.tiktok.com/@.../video/..." oninput="previewTT(this.value)">' +
            '<div class="fi-h">Salin link dari TikTok: Bagikan &rarr; Salin Tautan</div>' +
          '</div>' +
          '<div id="ttPrev" style="display:none;margin-bottom:16px;border-radius:var(--r12);overflow:hidden;border:1px solid var(--b);background:var(--s2)">' +
            '<div style="padding:10px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--b)">' +
              '<span class="bx bx-gr">TikTok ID terdeteksi</span>' +
              '<span id="ttIdShow" style="font-size:11px;color:var(--t3);font-family:monospace"></span>' +
            '</div>' +
            '<div style="position:relative;padding-top:177%;overflow:hidden"><div id="ttIframeWrap" style="position:absolute;inset:0"></div></div>' +
          '</div>' +
          '<div class="fg"><label class="fl">Nama Makanan yang Ditampilkan</label><input type="text" class="fi" id="vCap" placeholder="Ayam Bakar Bumbu Rahasia Bu Sari"></div>' +
          '<div class="r2">' +
            '<div class="fg"><label class="fl">Harga Mahasiswa (Rp)</label><input type="number" class="fi" id="vPS" placeholder="16000"></div>' +
            '<div class="fg"><label class="fl">Harga Umum (Rp)</label><input type="number" class="fi" id="vPG" placeholder="18000"></div>' +
          '</div>' +
          '<button class="btn b-pri b-fw" onclick="saveVid()">Simpan &amp; Tampilkan di Feed</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  renderGrid(myVids);
}

function renderGrid(vids) {
  var el = document.getElementById('vidGrid');
  if (!el || !vids.length) return;
  var html = '';
  vids.forEach(function(v) {
    html += '<div class="card" style="overflow:hidden">' +
      '<div style="position:relative;padding-top:177%;background:#0f172a">' +
        '<div style="position:absolute;inset:0">' +
          (v.is_tiktok && v.tiktok_id
            ? '<iframe src="https://www.tiktok.com/embed/v2/' + v.tiktok_id + '" style="width:100%;height:100%;border:none" allow="autoplay;fullscreen" loading="lazy"></iframe>'
            : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><svg style="opacity:.15" width="48" height="48" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>') +
        '</div>' +
        (v.is_tiktok ? '<div style="position:absolute;top:8px;left:8px"><span style="background:rgba(0,0,0,.65);color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:8px;border:1px solid rgba(255,255,255,.15)">TikTok</span></div>' : '') +
      '</div>' +
      '<div style="padding:12px 14px">' +
        '<div style="font-size:12px;font-weight:800;margin-bottom:4px;line-height:1.3">' + esc(v.food_name || v.caption.slice(0, 36)) + '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
          '<div style="font-size:14px;font-weight:800;color:var(--m)">' + rp(v.food_price || v.tiktok_price || 0) + '</div>' +
          (v.student_price ? '<div style="font-size:11px;color:var(--t3);text-decoration:line-through">' + rp(v.student_price) + '</div>' : '') +
        '</div>' +
        '<div style="font-size:10px;color:var(--t3);margin-bottom:10px">' + fn(v.views||0) + ' tayangan &nbsp;·&nbsp; ' + fn(v.likes||0) + ' suka</div>' +
        '<div style="display:flex;gap:6px"><button class="btn b-gho b-sm" style="flex:1" onclick="toast(\'Fitur edit segera hadir\',\'info\')">Edit</button>' +
        '<button class="btn b-dan b-sm" onclick="delVid(\'' + v.id + '\',\'' + esc(v.food_name||v.caption.slice(0,20)) + '\')">Hapus</button></div>' +
      '</div>' +
    '</div>';
  });
  el.innerHTML = html;
}

var _ttTimer = null;
function previewTT(url) {
  clearTimeout(_ttTimer);
  _ttTimer = setTimeout(function() {
    var match = url.match(/video\/(\d+)/);
    var prev  = document.getElementById('ttPrev');
    var show  = document.getElementById('ttIdShow');
    var wrap  = document.getElementById('ttIframeWrap');
    if (!prev) return;
    if (match) {
      prev.style.display = '';
      if (show) show.textContent = 'ID: ' + match[1];
      if (wrap) wrap.innerHTML = '<iframe src="https://www.tiktok.com/embed/v2/' + match[1] + '" style="width:100%;height:100%;border:none" allow="autoplay;fullscreen" loading="lazy"></iframe>';
    } else {
      prev.style.display = 'none';
      if (wrap) wrap.innerHTML = '';
    }
  }, 700);
}

function saveVid() {
  var url  = (document.getElementById('vUrl').value || '').trim();
  var cap  = (document.getElementById('vCap').value || '').trim();
  var prcG = parseInt(document.getElementById('vPG').value) || 0;
  var prcS = parseInt(document.getElementById('vPS').value) || 0;
  if (!cap) { toast('Nama makanan wajib diisi', 'err'); return; }
  var match = url.match(/video\/(\d+)/);
  var tid   = match ? match[1] : null;
  STATE.videos.unshift({ id:'v-'+Date.now(), umkm_id:getMyUmkmId(), caption:cap, food_name:cap,
    food_price:prcG, student_price:prcS, is_tiktok:!!tid, tiktok_id:tid,
    tiktok_embed_url: tid ? 'https://www.tiktok.com/embed/v2/'+tid : null,
    platform: tid?'tiktok':'manual', tiktok_price:prcG, likes:0, views:0, created_at:new Date().toISOString() });
  try { localStorage.removeItem('ipbmakan_cache'); } catch(e) {}
  closeModal('mVid');
  toast((tid?'Video TikTok':'Video') + ' "' + cap + '" ditambahkan!', 'ok');
  render();
}

function delVid(id, name) {
  if (!confirm('Hapus video "' + name + '"?')) return;
  STATE.videos = STATE.videos.filter(function(v){ return v.id !== id; });
  try { localStorage.removeItem('ipbmakan_cache'); } catch(e) {}
  toast('Video dihapus', 'info'); render();
}

init();
