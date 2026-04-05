// ─── js/pages/dashboard.js ────────────────────────────────

async function init() {
  if (!requireAuth(['umkm', 'admin'])) return;
  await ensureData();
  renderSidebar();
  updateCartBadge();
  render();
  setTimeout(() => document.getElementById('ldr').classList.add('out'), 1200);
}

function render() {
  const uid = getMyUmkmId();
  const u   = getUmkm(uid) || STATE.umkm[0] || {};
  const myMenu = getMenu(uid);
  const myRevs = getReviews(uid);

  document.getElementById('pageContent').innerHTML = `
    <div class="ph">
      <div>
        <div class="ptit">${esc(u.nama || 'Dashboard Warung')}</div>
        <div class="psub">${esc(u.address || u.lokasi || 'Jl. Babakan Raya, IPB Dramaga')}</div>
      </div>
      <button class="btn b-sec b-sm">Minggu ini ▾</button>
    </div>

    <!-- Metrics -->
    <div class="g4" style="margin-bottom:22px">
      <div class="metric mp">
        <div class="mi"><svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
        <div class="mv">Rp 1.24jt</div><div class="ml">Pendapatan Hari Ini</div>
        <div class="mch">↑ 31% vs kemarin</div>
      </div>
      <div class="metric">
        <div class="mi mi-g"><svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg></div>
        <div class="mv" style="color:var(--m)">82</div><div class="ml">Total Pesanan</div>
        <div class="mch mu">↑ 22%</div>
      </div>
      <div class="metric">
        <div class="mi mi-gr"><svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
        <div class="mv" style="color:var(--m)">${u.umkm_rating || '—'}</div><div class="ml">Rating</div>
        <div class="mch mu">↑ Stabil</div>
      </div>
      <div class="metric">
        <div class="mi mi-b"><svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>
        <div class="mv" style="color:var(--m)">${u.total_reviews || 0}</div><div class="ml">Total Ulasan</div>
        <div class="mch mu">↑ 3 baru</div>
      </div>
    </div>

    <!-- Pesanan & Jam Sibuk -->
    <div class="g2" style="margin-bottom:22px">
      <div class="card cp">
        <div class="stit">Pesanan Masuk Hari Ini</div>
        <div class="oi-wrap" id="ordersEl"></div>
      </div>
      <div class="card cp">
        <div class="stit">Jam Sibuk</div>
        <div class="bc" id="bc"></div>
        <div class="bl">
          <div><span class="bl-d" style="background:var(--m)"></span>Jam puncak</div>
          <div><span class="bl-d" style="background:var(--s3);border:1px solid var(--b)"></span>Normal</div>
        </div>
      </div>
    </div>

    <!-- Menu terlaris & Diskon -->
    <div class="g2" style="margin-bottom:22px">
      <div class="card cp">
        <div class="stit">Menu Terlaris</div>
        <div id="topMenuEl"></div>
      </div>
      <div class="card cp">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div class="stit" style="margin-bottom:0">Konfigurasi Diskon</div>
          <button class="btn b-pri b-sm" onclick="openModal('mDisc')">Atur</button>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:20px">
          <div style="background:var(--m50);border:1px solid var(--m200);border-radius:var(--r12);padding:14px;flex:1;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--m)">${u.student_discount_pct || 10}%</div>
            <div style="font-size:11px;color:var(--t3);margin-top:2px">Diskon Mahasiswa</div>
            <div class="bx bx-gr" style="margin-top:6px">Aktif</div>
          </div>
          <div style="background:var(--s2);border:1px solid var(--b);border-radius:var(--r12);padding:14px;flex:1;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--t1)">${u.general_discount_pct || 0}%</div>
            <div style="font-size:11px;color:var(--t3);margin-top:2px">Diskon Umum</div>
            <div class="bx bx-n" style="margin-top:6px">Tidak aktif</div>
          </div>
        </div>
        <div class="stit">Insight Bisnis</div>
        <div style="background:var(--gbg);border-left:3px solid var(--green);border-radius:var(--r12);padding:12px;margin-bottom:10px">
          <div style="font-size:12px;font-weight:800;color:var(--green);margin-bottom:4px">Jam Sibuk Teridentifikasi</div>
          <div style="font-size:12px;color:var(--t2);line-height:1.5">Puncak pesanan 11.00–13.00. Siapkan stok menu utama +20% untuk besok.</div>
        </div>
        <div style="background:var(--m50);border-left:3px solid var(--m);border-radius:var(--r12);padding:12px">
          <div style="font-size:12px;font-weight:800;color:var(--m);margin-bottom:4px">Peluang Minuman</div>
          <div style="font-size:12px;color:var(--t2);line-height:1.5">76% pelanggan tidak memesan minuman → potensi +Rp 150k/hari.</div>
        </div>
      </div>
    </div>

    <!-- Ulasan -->
    <div class="card cp"><div class="stit">Ulasan Pelanggan</div><div id="revsEl"></div></div>

    <!-- Modal diskon -->
    <div class="mbk" id="mDisc" onclick="if(event.target===this)closeModal('mDisc')">
      <div class="modal">
        <div class="mh"><div class="mt">Konfigurasi Diskon</div><button class="mx" onclick="closeModal('mDisc')">✕</button></div>
        <div class="mb">
          <div class="fg"><label class="fl">Diskon Mahasiswa IPB (%)</label>
            <input type="number" class="fi" id="dS" min="0" max="50" value="${u.student_discount_pct || 10}">
            <div class="fi-h">Berlaku untuk NIM IPB terverifikasi</div>
          </div>
          <div class="fg"><label class="fl">Diskon Umum (%)</label>
            <input type="number" class="fi" id="dG" min="0" max="30" value="${u.general_discount_pct || 0}">
          </div>
          <div class="fg"><label class="fl">Keterangan Promo</label>
            <input type="text" class="fi" id="dDesc" placeholder="Diskon awal semester ganjil 2025/2026">
          </div>
          <button class="btn b-pri b-fw" onclick="saveDisc()">Simpan Konfigurasi</button>
        </div>
      </div>
    </div>`;

  // Pesanan demo
  document.getElementById('ordersEl').innerHTML = `
    <div class="oi">
      <div style="padding:13px 18px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--b)">
        <div style="width:38px;height:38px;background:var(--m);color:#fff;border-radius:var(--r8);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0">A47</div>
        <div><div style="font-size:13px;font-weight:800;margin-bottom:2px">Mahasiswa IPB · G64190023</div><div style="font-size:11px;color:var(--t3)">Ayam Bakar ×1 · Es Teh ×1 · Rp 20.000</div></div>
        <div style="font-size:10px;color:var(--t3);font-weight:600;margin-left:auto;align-self:flex-start">11:42</div>
      </div>
      <div style="display:flex;gap:7px;padding:10px 18px;align-items:center">
        <button class="btn b-pri b-sm" onclick="this.textContent='Diproses ✓';this.disabled=true;toast('Pesanan A47 diproses!','ok')">Terima</button>
        <button class="btn b-gho b-sm">Tolak</button>
        <span class="bx bx-a">Menunggu</span>
        <span class="bx bx-b">Poki Delivery</span>
      </div>
    </div>
    <div class="oi">
      <div style="padding:13px 18px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--b)">
        <div style="width:38px;height:38px;background:var(--gold);color:var(--md);border-radius:var(--r8);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0">A48</div>
        <div><div style="font-size:13px;font-weight:800;margin-bottom:2px">Mahasiswa IPB · G64190041</div><div style="font-size:11px;color:var(--t3)">Nasi Uduk ×2 · Lalapan ×2 · Rp 26.000</div></div>
        <div style="font-size:10px;color:var(--t3);font-weight:600;margin-left:auto;align-self:flex-start">11:45</div>
      </div>
      <div style="display:flex;gap:7px;padding:10px 18px;align-items:center">
        <button class="btn b-pri b-sm" onclick="this.textContent='Diproses ✓';this.disabled=true;toast('Pesanan A48 diproses!','ok')">Terima</button>
        <button class="btn b-gho b-sm">Tolak</button>
        <span class="bx bx-a">Menunggu</span>
      </div>
    </div>`;

  // Bar chart jam sibuk
  const hrs = ['07','08','09','10','11','12','13','14','15','16','17','18'];
  const vals = [8,16,28,35,82,100,74,22,18,14,42,31];
  document.getElementById('bc').innerHTML = hrs.map((h,i) =>
    `<div class="bc-c">
      <div class="bc-b ${vals[i]>=82?'pk':vals[i]>=42?'hi':''}" style="height:${vals[i]}%" title="${vals[i]} pesanan jam ${h}:00"></div>
      <span class="bc-l">${h}</span>
    </div>`).join('');

  // Menu terlaris
  document.getElementById('topMenuEl').innerHTML = myMenu.length
    ? myMenu.slice(0,5).map((m,i) =>
        `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--b)">
          <div style="width:26px;height:26px;border-radius:var(--r8);background:${i===0?'var(--m)':i===1?'var(--t1)':'var(--s2)'};color:${i<2?'#fff':'var(--t3)'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0">${i+1}</div>
          <div style="flex:1"><div style="font-size:12px;font-weight:700">${esc(m.name)}</div><div style="font-size:10px;color:var(--t3)">${(m.total_sold||0).toLocaleString('id')} porsi</div></div>
          <div style="font-size:13px;font-weight:800;color:var(--green)">${rpK(m.price * (m.total_sold||0))}</div>
        </div>`).join('')
    : emptyState('Data belum tersedia');

  // Ulasan
  document.getElementById('revsEl').innerHTML = myRevs.length
    ? myRevs.slice(0,4).map(r =>
        `<div style="padding:12px 0;border-bottom:1px solid var(--b)">
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">
            <div style="width:26px;height:26px;border-radius:50%;background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800">${String.fromCharCode(65+Math.floor(Math.random()*26))}</div>
            <span style="font-size:12px;font-weight:700">Mahasiswa IPB</span>
            <span style="font-size:10px;color:var(--t3);margin-left:auto">${fd(r.created_at)}</span>
            <span style="color:var(--gold);font-size:11px">${'★'.repeat(r.review_rating)}</span>
          </div>
          <div style="font-size:12px;color:var(--t2);line-height:1.5">${esc(r.comment||'')}</div>
        </div>`).join('')
    : emptyState('Belum ada ulasan');
}

function saveDisc() {
  const s = parseInt(document.getElementById('dS').value) || 0;
  const g = parseInt(document.getElementById('dG').value) || 0;
  toast(`Diskon mahasiswa ${s}% dan umum ${g}% berhasil disimpan!`, 'ok');
  closeModal('mDisc');
  render();
}

init();
