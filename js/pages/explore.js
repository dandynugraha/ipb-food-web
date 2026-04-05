// ─── js/pages/explore.js ──────────────────────────────────

const TMAP = { popular:'Populer',cheap:'Murah',fast:'Cepat',healthy:'Sehat',coffee:'Kopi',night:'Malam',nasi:'Nasi',ayam:'Ayam',mie:'Mie',bakso:'Bakso',padang:'Padang' };
const TCLS = { popular:'bx-m',cheap:'bx-gr',fast:'bx-b',healthy:'bx-gr',coffee:'bx-g',night:'bx-n' };
const CART_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`;

async function init() {
  restoreSession();                    // publik — tidak perlu login
  await loadAllData();
  renderSidebar();
  updateCartBadge();
  renderPage();
  setTimeout(() => document.getElementById('ldr').classList.add('out'), 1200);
}

function renderPage() {
  const q = new URLSearchParams(location.search).get('q') || '';
  const hash = location.hash.replace('#', '');

  document.getElementById('pageContent').innerHTML = `
    <div class="ph">
      <div>
        <div class="ptit">Jelajahi Warung UMKM</div>
        <div class="psub" id="exSub">${STATE.umkm.length} warung di Jl. Babakan Raya, IPB Dramaga</div>
      </div>
    </div>
    <div class="chips" id="exChips">
      <div class="chip on" onclick="setF(this,'all')">Semua</div>
      <div class="chip" onclick="setF(this,'rating')">Rating Tertinggi</div>
      <div class="chip" onclick="setF(this,'price')">Termurah</div>
      <div class="chip" onclick="setF(this,'distance')">Terdekat</div>
      <div class="chip" onclick="setF(this,'poki')">Poki Delivery</div>
      <div class="chip" onclick="setF(this,'open')">Buka Sekarang</div>
    </div>
    <div class="ugg" id="umkmG"></div>
    <div id="detailPanel" style="margin-top:24px"></div>`;

  let list = q
    ? STATE.umkm.filter(u => u.nama.toLowerCase().includes(q.toLowerCase()) || (u.category||'').toLowerCase().includes(q.toLowerCase()))
    : [...STATE.umkm];

  renderGrid(list);

  // Buka detail otomatis jika ada hash atau query
  if (hash) setTimeout(() => openDetail(hash), 300);
  else if (q && list.length === 1) setTimeout(() => openDetail(list[0].id), 300);
}

function renderGrid(list) {
  const el = document.getElementById('umkmG'); if (!el) return;
  const sub = document.getElementById('exSub');
  if (sub) sub.textContent = `${list.length} warung di Jl. Babakan Raya, IPB Dramaga`;
  if (!list.length) { el.innerHTML = emptyState('Tidak ada warung ditemukan'); return; }

  el.innerHTML = list.map(u => `
    <div class="uc" onclick="openDetail('${u.id}')">
      <div class="uc-ban">${u.banner_url ? `<img src="${u.banner_url}" loading="lazy">` : ''}
        <div class="uc-av">${CART_SVG}</div>
      </div>
      <div class="uc-b">
        <div class="uc-n">${esc(u.nama)}
          <div class="rp-row">
            <svg class="str" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ${u.umkm_rating || '—'}
          </div>
        </div>
        <div class="uc-m">
          <span>${u.distance_meters || 0}m</span><span>·</span>
          <span>${u.open_time || '07:00'}–${u.close_time || '21:00'}</span>
          ${u.kiosk_number ? `<span>·</span><span>Kios ${u.kiosk_number}</span>` : ''}
          ${u.poki_enabled ? `<span class="bx bx-b" style="margin-left:4px">Poki</span>` : ''}
        </div>
        <div class="uc-tg">
          ${(u.tags||[]).slice(0,3).map(t => `<span class="bx ${TCLS[t]||'bx-n'}">${TMAP[t]||t}</span>`).join('')}
        </div>
        <div class="uc-ft">
          <span class="bx bx-n">Mulai ${rp(u.min_price||0)}</span>
          <span class="${u.is_open ? 'sp sp-op' : 'sp sp-cl'}">${u.is_open ? 'Buka' : 'Tutup'}</span>
        </div>
      </div>
    </div>`).join('');
}

function setF(el, type) {
  document.querySelectorAll('#exChips .chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  let list = [...STATE.umkm];
  if (type === 'rating')   list.sort((a,b) => (b.umkm_rating||0) - (a.umkm_rating||0));
  else if (type === 'price')    list.sort((a,b) => (a.min_price||0) - (b.min_price||0));
  else if (type === 'distance') list.sort((a,b) => (a.distance_meters||0) - (b.distance_meters||0));
  else if (type === 'poki')     list = list.filter(u => u.poki_enabled);
  else if (type === 'open')     list = list.filter(u => u.is_open);
  renderGrid(list);
  document.getElementById('detailPanel').innerHTML = '';
}

function openDetail(umkmId) {
  const u = STATE.umkm.find(u => u.id === umkmId); if (!u) return;
  const menu = STATE.menu.filter(m => m.umkm_id === umkmId);
  const revs = STATE.reviews.filter(r => r.umkm_id === umkmId);
  const panel = document.getElementById('detailPanel');
  panel.innerHTML = '';
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const mkItem = m => {
    const isS  = STATE.role === 'student' && m.student_price;
    const price = isS ? m.student_price : (m.general_price || m.price);
    const orig  = m.general_price || m.price;
    const qty   = STATE.cart[m.id]?.qty || 0;
    return `<div class="mir">
      <img src="${getPhoto(m)}" class="mip" loading="lazy"
        onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=120'" alt="${esc(m.name)}">
      <div class="mii">
        <div class="min">${esc(m.name)}${m.is_best_seller ? '<span class="bx bx-m" style="font-size:9px">Best</span>' : ''}</div>
        <div class="mid">${esc(m.description || '')}</div>
        <div class="mips">
          <span class="mips-s">${rp(price)}</span>
          ${isS && price < orig ? `<span class="mips-g">${rp(orig)}</span>` : ''}
        </div>
      </div>
      <div class="qc">
        <button class="qb" onclick="chg('${m.id}',${price},'${esc(m.name)}','${esc(u.nama)}','${umkmId}','${u.phone||''}',-1)">−</button>
        <span class="qn" id="q${m.id}">${qty}</span>
        <button class="qb pl" onclick="chg('${m.id}',${price},'${esc(m.name)}','${esc(u.nama)}','${umkmId}','${u.phone||''}',1)">+</button>
      </div>
    </div>`;
  };

  const revsH = revs.length
    ? revs.slice(0,4).map(r => `
        <div style="padding:12px 0;border-bottom:1px solid var(--b)">
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">
            <div style="width:26px;height:26px;border-radius:50%;background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800">
              ${String.fromCharCode(65+Math.floor(Math.random()*26))}
            </div>
            <span style="font-size:12px;font-weight:700">Mahasiswa IPB</span>
            <span style="font-size:10px;color:var(--t3);margin-left:auto">${fd(r.created_at)}</span>
            <span style="color:var(--gold);font-size:11px">${'★'.repeat(r.review_rating)}</span>
          </div>
          <div style="font-size:12px;color:var(--t2);line-height:1.5">${esc(r.comment||'')}</div>
        </div>`).join('')
    : emptyState('Belum ada ulasan');

  panel.innerHTML = `
    <div class="dh">
      <div style="position:absolute;top:-60px;right:-60px;width:200px;height:200px;background:rgba(255,255,255,.04);border-radius:50%"></div>
      <div class="dh-ic">${CART_SVG}</div>
      <div class="dh-inf">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <div>
            <div class="dh-n">${esc(u.nama)}</div>
            <div class="dh-a">${esc(u.address||u.lokasi||'Jl. Babakan Raya, IPB Dramaga')}</div>
            <div class="dh-h">${u.open_time||'07:00'}–${u.close_time||'21:00'} ${u.kiosk_number?'· Kios '+u.kiosk_number:''}</div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-self:flex-start">
            <span class="${u.is_open?'sp sp-op':'sp sp-cl'}">${u.is_open?'Buka':'Tutup'}</span>
            ${u.poki_enabled ? '<span class="bx bx-b">Poki Delivery</span>' : ''}
            ${STATE.role==='student' && u.student_discount_pct ? `<span class="bx bx-g">Diskon ${u.student_discount_pct}% Mahasiswa</span>` : ''}
          </div>
        </div>
        <div class="dh-st">
          <div class="dhs"><div class="dhs-v">${u.umkm_rating||'—'}</div><div class="dhs-l">Rating</div></div>
          <div class="dhs-d"></div>
          <div class="dhs"><div class="dhs-v">${(u.total_reviews||0).toLocaleString('id')}</div><div class="dhs-l">Ulasan</div></div>
          <div class="dhs-d"></div>
          <div class="dhs"><div class="dhs-v">${u.distance_meters||0}m</div><div class="dhs-l">Jarak</div></div>
          <div class="dhs-d"></div>
          <div class="dhs"><div class="dhs-v">${menu.length}</div><div class="dhs-l">Menu</div></div>
        </div>
      </div>
    </div>

    <div class="dl" style="margin-top:20px">
      <div>
        <div class="card" style="margin-bottom:16px">
          <div style="padding:16px 20px;border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between">
            <div class="stit" style="margin-bottom:0">Menu</div>
            <span class="bx bx-n">${menu.length} item</span>
          </div>
          <div style="padding:0 20px">
            ${menu.length ? menu.map(mkItem).join('') : emptyState('Belum ada menu')}
          </div>
        </div>
        <div class="card">
          <div style="padding:16px 20px;border-bottom:1px solid var(--b)">
            <div class="stit" style="margin-bottom:0">Ulasan Pelanggan</div>
          </div>
          <div style="padding:0 20px">${revsH}</div>
        </div>
      </div>
      <div><div id="opanel">${buildOP()}</div></div>
    </div>`;
}

// ── Cart ──────────────────────────────────────────────────
function chg(id, price, name, umkmName, umkmId, umkmPhone, d) {
  if (!STATE.cart[id] && d > 0) STATE.cart[id] = { name, price, qty:0, umkmName, umkmId, umkmPhone };
  if (!STATE.cart[id]) return;
  STATE.cart[id].qty = Math.max(0, STATE.cart[id].qty + d);
  if (STATE.cart[id].qty === 0) delete STATE.cart[id];
  const el = document.getElementById('q' + id); if (el) el.textContent = STATE.cart[id]?.qty || 0;
  updateCartBadge();
  const op = document.getElementById('opanel'); if (op) op.innerHTML = buildOP();
  saveSession();
}

function buildOP() {
  const { items, sub, disc, total } = cartTotal();
  if (!items.length) return `<div class="op">
    <div class="op-h">Pesanan Anda</div>
    <div class="empty" style="padding:24px 0"><div class="etit">Keranjang kosong</div></div>
    <div class="op-cta" style="padding-bottom:18px"><button class="pbtn" disabled>Pre-Order</button></div>
  </div>`;
  return `<div class="op">
    <div class="op-h">Pesanan Anda</div>
    <div class="op-its">
      ${items.map(([,i]) => `<div class="op-it">
        <div><div class="op-in">${i.name}</div><div class="op-iq">×${i.qty} · ${i.umkmName}</div></div>
        <div class="op-ip">${rp(i.price * i.qty)}</div>
      </div>`).join('')}
    </div>
    <div class="op-sm">
      <div class="or"><span>Subtotal</span><span>${rp(sub)}</span></div>
      ${disc ? `<div class="or dc"><span>Diskon Mahasiswa</span><span>−${rp(disc)}</span></div>` : ''}
      <div class="or fn"><span>Total</span><span style="color:var(--m)">${rp(total)}</span></div>
    </div>
    <div class="op-cta" style="padding-bottom:18px">
      <button class="pbtn" onclick="location.href='checkout.html'">Pre-Order · ${rp(total)}</button>
    </div>
  </div>`;
}

init();
