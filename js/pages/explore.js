// js/pages/explore.js — FIXED: search debounce, mobile layout

var TMAP = {popular:'Populer',cheap:'Murah',fast:'Cepat',healthy:'Sehat',coffee:'Kopi',night:'Malam',nasi:'Nasi',ayam:'Ayam',mie:'Mie',bakso:'Bakso',padang:'Padang'};
var TCLS = {popular:'bx-m',cheap:'bx-gr',fast:'bx-b',healthy:'bx-gr',coffee:'bx-g',night:'bx-n'};

async function init() {
  restoreSession();
  await ensureData();
  renderSidebar();
  updateCartBadge();
  renderPage();
  setTimeout(function(){ document.getElementById('ldr').classList.add('out'); }, 800);
}

function renderPage() {
  var q    = new URLSearchParams(location.search).get('q') || '';
  var hash = location.hash.replace('#', '');

  document.getElementById('pageContent').innerHTML =
    '<div class="ph"><div>' +
      '<div class="ptit">Jelajahi Warung UMKM</div>' +
      '<div class="psub" id="exSub">Warung di Jl. Babakan Raya, IPB Dramaga</div>' +
    '</div></div>' +
    '<div class="chips" id="exChips">' +
      '<div class="chip on" onclick="setF(this,\'all\')">Semua</div>' +
      '<div class="chip" onclick="setF(this,\'rating\')">Rating Tertinggi</div>' +
      '<div class="chip" onclick="setF(this,\'price\')">Termurah</div>' +
      '<div class="chip" onclick="setF(this,\'distance\')">Terdekat</div>' +
      '<div class="chip" onclick="setF(this,\'poki\')">Poki Delivery</div>' +
      '<div class="chip" onclick="setF(this,\'open\')">Buka Sekarang</div>' +
    '</div>' +
    '<div class="ugg" id="umkmG"></div>' +
    '<div id="detailPanel" style="margin-top:24px"></div>';

  var list = q
    ? STATE.umkm.filter(function(u) {
        return u.nama.toLowerCase().indexOf(q.toLowerCase()) >= 0 ||
               (u.category||'').toLowerCase().indexOf(q.toLowerCase()) >= 0;
      })
    : STATE.umkm.slice();

  renderGrid(list);
  if (hash) setTimeout(function(){ openDetail(hash); }, 300);
}

function renderGrid(list) {
  var el  = document.getElementById('umkmG'); if (!el) return;
  var sub = document.getElementById('exSub');
  if (sub) sub.textContent = list.length + ' warung di Jl. Babakan Raya, IPB Dramaga';
  if (!list.length) { el.innerHTML = emptyState('Tidak ada warung ditemukan'); return; }

  var html = '';
  list.forEach(function(u) {
    var tags = (u.tags||[]).slice(0,3).map(function(t){
      return '<span class="bx ' + (TCLS[t]||'bx-n') + '">' + (TMAP[t]||t) + '</span>';
    }).join('');
    html +=
      '<div class="uc" onclick="openDetail(\'' + u.id + '\')">' +
        '<div class="uc-ban">' +
          (u.banner_url ? '<img src="' + u.banner_url + '" loading="lazy">' : '') +
          '<div class="uc-av"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>' +
          '</svg></div>' +
        '</div>' +
        '<div class="uc-b">' +
          '<div class="uc-n">' + esc(u.nama) +
            '<div class="rp-row">' +
              '<svg class="str" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' +
              (u.umkm_rating || '-') +
            '</div>' +
          '</div>' +
          '<div class="uc-m">' +
            '<span>' + (u.distance_meters||0) + 'm</span><span>·</span>' +
            '<span>' + (u.open_time||'07:00') + '-' + (u.close_time||'21:00') + '</span>' +
            (u.kiosk_number ? '<span>·</span><span>Kios ' + u.kiosk_number + '</span>' : '') +
            (u.poki_enabled ? '<span class="bx bx-b" style="margin-left:4px">Poki</span>' : '') +
          '</div>' +
          '<div class="uc-tg">' + tags + '</div>' +
          '<div class="uc-ft">' +
            '<span class="bx bx-n">Mulai ' + rp(u.min_price||0) + '</span>' +
            '<span class="' + (u.is_open ? 'sp sp-op' : 'sp sp-cl') + '">' + (u.is_open ? 'Buka' : 'Tutup') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  });
  el.innerHTML = html;
}

function setF(el, type) {
  document.querySelectorAll('#exChips .chip').forEach(function(c){ c.classList.remove('on'); });
  el.classList.add('on');
  var list = STATE.umkm.slice();
  if (type === 'rating')   list.sort(function(a,b){ return (b.umkm_rating||0)-(a.umkm_rating||0); });
  if (type === 'price')    list.sort(function(a,b){ return (a.min_price||0)-(b.min_price||0); });
  if (type === 'distance') list.sort(function(a,b){ return (a.distance_meters||0)-(b.distance_meters||0); });
  if (type === 'poki')     list = list.filter(function(u){ return u.poki_enabled; });
  if (type === 'open')     list = list.filter(function(u){ return u.is_open; });
  renderGrid(list);
  document.getElementById('detailPanel').innerHTML = '';
}

function openDetail(umkmId) {
  var u    = getUmkm(umkmId); if (!u) return;
  var menu = getMenu(umkmId);
  var revs = getReviews(umkmId);
  var panel = document.getElementById('detailPanel');
  panel.innerHTML = '';
  panel.scrollIntoView({ behavior:'smooth', block:'start' });

  var itemsHtml = '';
  menu.forEach(function(m) {
    var isS   = STATE.role === 'student' && m.student_price;
    var price = isS ? m.student_price : (m.general_price || m.price);
    var orig  = m.general_price || m.price;
    var qty   = STATE.cart[m.id] ? STATE.cart[m.id].qty : 0;
    itemsHtml +=
      '<div class="mir">' +
        '<img src="' + getPhoto(m) + '" class="mip" loading="lazy" ' +
          'onerror="this.src=\'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=120\'" alt="' + esc(m.name) + '">' +
        '<div class="mii">' +
          '<div class="min">' + esc(m.name) + (m.is_best_seller ? '<span class="bx bx-m" style="font-size:9px">Best</span>' : '') + '</div>' +
          '<div class="mid">' + esc(m.description||'') + '</div>' +
          '<div class="mips"><span class="mips-s">' + rp(price) + '</span>' +
            (isS && price < orig ? '<span class="mips-g">' + rp(orig) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="qc">' +
          '<button class="qb" onclick="chg(\'' + m.id + '\',' + price + ',\'' + esc(m.name) + '\',\'' + esc(u.nama) + '\',\'' + umkmId + '\',\'' + (u.phone||'') + '\',-1)">-</button>' +
          '<span class="qn" id="q' + m.id + '">' + qty + '</span>' +
          '<button class="qb pl" onclick="chg(\'' + m.id + '\',' + price + ',\'' + esc(m.name) + '\',\'' + esc(u.nama) + '\',\'' + umkmId + '\',\'' + (u.phone||'') + '\',1)">+</button>' +
        '</div>' +
      '</div>';
  });

  var revsHtml = '';
  revs.slice(0,4).forEach(function(r) {
    revsHtml +=
      '<div style="padding:12px 0;border-bottom:1px solid var(--b)">' +
        '<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">' +
          '<div style="width:26px;height:26px;border-radius:50%;background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800">' +
            String.fromCharCode(65+Math.floor(Math.random()*26)) +
          '</div>' +
          '<span style="font-size:12px;font-weight:700">Mahasiswa IPB</span>' +
          '<span style="font-size:10px;color:var(--t3);margin-left:auto">' + fd(r.created_at) + '</span>' +
          '<span style="color:var(--gold);font-size:11px">' + '★'.repeat(r.review_rating) + '</span>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--t2);line-height:1.5">' + esc(r.comment||'') + '</div>' +
      '</div>';
  });
  if (!revs.length) revsHtml = emptyState('Belum ada ulasan');

  panel.innerHTML =
    '<div class="dh">' +
      '<div style="position:absolute;top:-60px;right:-60px;width:200px;height:200px;background:rgba(255,255,255,.04);border-radius:50%"></div>' +
      '<div class="dh-ic"><svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.5" style="width:38px;height:38px"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg></div>' +
      '<div class="dh-inf">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">' +
          '<div>' +
            '<div class="dh-n">' + esc(u.nama) + '</div>' +
            '<div class="dh-a">' + esc(u.address||u.lokasi||'Jl. Babakan Raya, IPB Dramaga') + '</div>' +
            '<div class="dh-h">' + (u.open_time||'07:00') + '-' + (u.close_time||'21:00') + (u.kiosk_number ? ' · Kios ' + u.kiosk_number : '') + '</div>' +
          '</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;align-self:flex-start">' +
            '<span class="' + (u.is_open?'sp sp-op':'sp sp-cl') + '">' + (u.is_open?'Buka':'Tutup') + '</span>' +
            (u.poki_enabled ? '<span class="bx bx-b">Poki Delivery</span>' : '') +
            (STATE.role==='student' && u.student_discount_pct ? '<span class="bx bx-g">Diskon ' + u.student_discount_pct + '% Mahasiswa</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="dh-st">' +
          '<div class="dhs"><div class="dhs-v">' + (u.umkm_rating||'-') + '</div><div class="dhs-l">Rating</div></div>' +
          '<div class="dhs-d"></div>' +
          '<div class="dhs"><div class="dhs-v">' + (u.total_reviews||0).toLocaleString('id') + '</div><div class="dhs-l">Ulasan</div></div>' +
          '<div class="dhs-d"></div>' +
          '<div class="dhs"><div class="dhs-v">' + (u.distance_meters||0) + 'm</div><div class="dhs-l">Jarak</div></div>' +
          '<div class="dhs-d"></div>' +
          '<div class="dhs"><div class="dhs-v">' + menu.length + '</div><div class="dhs-l">Menu</div></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="dl" style="margin-top:20px">' +
      '<div>' +
        '<div class="card" style="margin-bottom:16px">' +
          '<div style="padding:16px 20px;border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between">' +
            '<div class="stit" style="margin-bottom:0">Menu</div><span class="bx bx-n">' + menu.length + ' item</span>' +
          '</div>' +
          '<div style="padding:0 20px">' + (menu.length ? itemsHtml : emptyState('Belum ada menu')) + '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div style="padding:16px 20px;border-bottom:1px solid var(--b)"><div class="stit" style="margin-bottom:0">Ulasan</div></div>' +
          '<div style="padding:0 20px">' + revsHtml + '</div>' +
        '</div>' +
      '</div>' +
      '<div><div id="opanel">' + buildOP() + '</div></div>' +
    '</div>';
}

function chg(id, price, name, umkmName, umkmId, umkmPhone, d) {
  if (!STATE.cart[id] && d > 0) STATE.cart[id] = { name:name, price:price, qty:0, umkmName:umkmName, umkmId:umkmId, umkmPhone:umkmPhone };
  if (!STATE.cart[id]) return;
  STATE.cart[id].qty = Math.max(0, STATE.cart[id].qty + d);
  if (STATE.cart[id].qty === 0) delete STATE.cart[id];
  var el = document.getElementById('q' + id); if (el) el.textContent = STATE.cart[id] ? STATE.cart[id].qty : 0;
  updateCartBadge();
  var op = document.getElementById('opanel'); if (op) op.innerHTML = buildOP();
  saveSession();
}

function buildOP() {
  var ct = cartTotal();
  if (!ct.items.length) return '<div class="op"><div class="op-h">Pesanan Anda</div><div class="empty" style="padding:24px 0"><div class="etit">Keranjang kosong</div></div><div class="op-cta" style="padding-bottom:18px"><button class="pbtn" disabled>Pre-Order</button></div></div>';
  var rows = '';
  ct.items.forEach(function(pair){ var i=pair[1]; rows += '<div class="op-it"><div><div class="op-in">'+i.name+'</div><div class="op-iq">x'+i.qty+' · '+i.umkmName+'</div></div><div class="op-ip">'+rp(i.price*i.qty)+'</div></div>'; });
  return '<div class="op"><div class="op-h">Pesanan Anda</div><div class="op-its">'+rows+'</div>' +
    '<div class="op-sm"><div class="or"><span>Subtotal</span><span>'+rp(ct.sub)+'</span></div>' +
    (ct.disc ? '<div class="or dc"><span>Diskon Mahasiswa</span><span>-'+rp(ct.disc)+'</span></div>' : '') +
    '<div class="or fn"><span>Total</span><span style="color:var(--m)">'+rp(ct.total)+'</span></div></div>' +
    '<div class="op-cta" style="padding-bottom:18px"><button class="pbtn" onclick="location.href=\'checkout.html\'">Pre-Order · '+rp(ct.total)+'</button></div></div>';
}

init();
