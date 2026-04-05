// ─── js/pages/menus.js ────────────────────────────────────

async function init() {
  if (!requireAuth(['umkm', 'admin'])) return;
  await loadAllData();
  renderSidebar();
  updateCartBadge();
  render();
  setTimeout(() => document.getElementById('ldr').classList.add('out'), 1200);
}

function render() {
  const uid    = getMyUmkmId();
  const myMenu = getMenu(uid);

  document.getElementById('pageContent').innerHTML = `
    <div class="ph">
      <div><div class="ptit">Kelola Menu</div><div class="psub">Tambah, edit, dan atur ketersediaan menu warung Anda</div></div>
      <button class="btn b-pri" onclick="openAdd()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Tambah Menu
      </button>
    </div>

    <!-- Stats -->
    <div class="g4" style="margin-bottom:22px">
      <div class="metric"><div class="mv" style="color:var(--m)">${myMenu.length}</div><div class="ml">Total Menu</div></div>
      <div class="metric"><div class="mv" style="color:var(--m)">${myMenu.filter(m=>m.is_available).length}</div><div class="ml">Menu Aktif</div></div>
      <div class="metric"><div class="mv" style="color:var(--m)">${myMenu.filter(m=>m.is_best_seller).length}</div><div class="ml">Best Seller</div></div>
      <div class="metric"><div class="mv" style="color:var(--m)">${[...new Set(myMenu.map(m=>m.category))].length || 0}</div><div class="ml">Kategori</div></div>
    </div>

    <!-- Filter -->
    <div class="chips" id="mChips">
      <div class="chip on" onclick="filterCat(this,'all')">Semua</div>
      <div class="chip" onclick="filterCat(this,'Makanan')">Makanan</div>
      <div class="chip" onclick="filterCat(this,'Minuman')">Minuman</div>
      <div class="chip" onclick="filterCat(this,'Paket')">Paket</div>
      <div class="chip" onclick="filterCat(this,'Tambahan')">Tambahan</div>
    </div>

    <div class="card"><div id="menuList" style="padding:0 20px"></div></div>

    <!-- Modal tambah/edit menu -->
    <div class="mbk" id="mMenu" onclick="if(event.target===this)closeModal('mMenu')">
      <div class="modal">
        <div class="mh">
          <div class="mt" id="mMenuTit">Tambah Menu Baru</div>
          <button class="mx" onclick="closeModal('mMenu')">✕</button>
        </div>
        <div class="mb">
          <div class="fg"><label class="fl">Nama Menu</label><input type="text" class="fi" id="mN" placeholder="Ayam Bakar Bumbu Rujak"></div>
          <div class="fg"><label class="fl">Deskripsi</label><textarea class="fi" id="mD" rows="2" placeholder="Deskripsi singkat bahan dan cita rasa" style="resize:none"></textarea></div>
          <div class="r2">
            <div class="fg"><label class="fl">Harga Mahasiswa (Rp)</label><input type="number" class="fi" id="mPS" placeholder="16000"></div>
            <div class="fg"><label class="fl">Harga Umum (Rp)</label><input type="number" class="fi" id="mPG" placeholder="18000"></div>
          </div>
          <div class="fg">
            <label class="fl">Kategori</label>
            <select class="fi fi-sel" id="mCat">
              <option>Makanan</option><option>Minuman</option><option>Paket</option><option>Tambahan</option>
            </select>
          </div>

          <!-- Drag & Drop Upload -->
          <div class="fg">
            <label class="fl">Foto Menu — Drag &amp; Drop atau Klik</label>
            <div class="uz" id="uzEl"
              ondragover="doDrag(event,true)"
              ondragleave="doDrag(event,false)"
              ondrop="doDrop(event)"
              onclick="document.getElementById('fiEl').click()">
              <div class="uz-i"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
              <div class="uz-t">Drag &amp; drop foto atau klik untuk memilih</div>
              <div class="uz-s">PNG, JPG, WEBP — maks. 5MB per file</div>
              <div class="upv" id="upvEl"></div>
            </div>
            <input type="file" id="fiEl" accept="image/*" multiple onchange="doFileSelect(this)">
          </div>

          <div class="fg">
            <label class="fl">Atau: URL Foto Sementara (Unsplash placeholder)</label>
            <input type="text" class="fi" id="mPU" placeholder="https://images.unsplash.com/photo-...?w=600&q=80">
            <div class="fi-h">Placeholder — ganti dengan foto asli kapan saja setelah live</div>
          </div>

          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:18px;font-size:13px;font-weight:600">
            <input type="checkbox" id="mBS"> Tandai sebagai Best Seller
          </label>
          <button class="btn b-pri b-fw" onclick="saveMenu()">Simpan Menu</button>
        </div>
      </div>
    </div>`;

  renderList(myMenu);
}

function renderList(list) {
  const el = document.getElementById('menuList'); if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div style="padding:20px 0">${emptyState('Belum ada menu. Tambah menu pertama warung Anda.')}</div>`;
    return;
  }
  el.innerHTML = list.map(m => `
    <div class="mmr">
      <img src="${getPhoto(m)}" class="mm-ph" loading="lazy"
        onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=120'" alt="${esc(m.name)}">
      <div class="mm-i">
        <div class="mm-n">${esc(m.name)}${m.is_best_seller ? '&nbsp;<span class="bx bx-m">Best</span>' : ''}</div>
        <div class="mm-d">${esc(m.description || '—')}</div>
        <div class="mm-p">
          <span class="mmp-s">${rp(m.student_price || m.price)}<span style="font-size:9px;color:var(--t3);font-weight:500;margin-left:3px">(mhs)</span></span>
          <span class="mmp-g">${rp(m.general_price || m.price)}</span>
          <span class="bx bx-n">${m.category || 'Makanan'}</span>
          <span class="bx ${m.is_available ? 'bx-gr' : 'bx-r'}">${m.is_available ? 'Tersedia' : 'Habis'}</span>
        </div>
      </div>
      <div class="mm-ac">
        <label class="tg">
          <input type="checkbox" ${m.is_available ? 'checked' : ''} onchange="toggleAvail('${m.id}', this.checked)">
          <span class="tsl"></span>
        </label>
        <button class="btn b-gho b-sm" onclick="editMenu('${m.id}')">Edit</button>
        <button class="btn b-dan b-sm" onclick="delMenu('${m.id}', '${esc(m.name)}')">Hapus</button>
      </div>
    </div>`).join('');
}

function filterCat(el, cat) {
  document.querySelectorAll('#mChips .chip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  const uid = getMyUmkmId();
  const list = cat === 'all' ? getMenu(uid) : getMenu(uid).filter(m => m.category === cat);
  renderList(list);
}

// ── Upload handlers ────────────────────────────────────────
function doDrag(e, on) {
  e.preventDefault();
  document.getElementById('uzEl')?.classList.toggle('drag', on);
}
function doDrop(e) {
  e.preventDefault();
  document.getElementById('uzEl')?.classList.remove('drag');
  showPrev([...e.dataTransfer.files].filter(f => f.type.startsWith('image/')));
}
function doFileSelect(inp) { showPrev([...inp.files]); }
function showPrev(files) {
  const pv = document.getElementById('upvEl'); if (!pv) return;
  pv.innerHTML = files.map(f => `<img class="upt" src="${URL.createObjectURL(f)}" alt="${f.name}">`).join('');
  if (files.length) toast(`${files.length} foto siap diunggah`, 'info');
}

// ── CRUD ──────────────────────────────────────────────────
function openAdd() {
  document.getElementById('mMenuTit').textContent = 'Tambah Menu Baru';
  ['mN','mD','mPU'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('mPS').value = '';
  document.getElementById('mPG').value = '';
  document.getElementById('mBS').checked = false;
  document.getElementById('mCat').value = 'Makanan';
  document.getElementById('upvEl').innerHTML = '';
  openModal('mMenu');
}

function editMenu(id) {
  const m = STATE.menu.find(m => m.id === id); if (!m) return;
  document.getElementById('mMenuTit').textContent = 'Edit Menu';
  document.getElementById('mN').value  = m.name;
  document.getElementById('mD').value  = m.description || '';
  document.getElementById('mPS').value = m.student_price || '';
  document.getElementById('mPG').value = m.general_price || m.price || '';
  document.getElementById('mPU').value = m.photo_url || '';
  document.getElementById('mBS').checked = m.is_best_seller || false;
  document.getElementById('mCat').value  = m.category || 'Makanan';
  document.getElementById('upvEl').innerHTML = '';
  openModal('mMenu');
}

function saveMenu() {
  const nm = document.getElementById('mN').value.trim();
  if (!nm) { toast('Nama menu wajib diisi', 'err'); return; }
  const priceG = parseInt(document.getElementById('mPG').value) || 0;
  const priceS = parseInt(document.getElementById('mPS').value) || Math.round(priceG * 0.9);
  const photo  = document.getElementById('mPU').value.trim()
    || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80';

  STATE.menu.unshift({
    id: 'new-' + Date.now(),
    umkm_id: getMyUmkmId(),
    name: nm,
    description:  document.getElementById('mD').value.trim(),
    student_price: priceS,
    general_price: priceG,
    price: priceG,
    category:    document.getElementById('mCat').value,
    photo_url:   photo,
    is_best_seller: document.getElementById('mBS').checked,
    is_available: true,
    total_sold: 0,
    created_at: new Date().toISOString(),
  });

  closeModal('mMenu');
  toast(`Menu "${nm}" berhasil ditambahkan!`, 'ok');
  render();
}

function toggleAvail(id, val) {
  const m = STATE.menu.find(m => m.id === id); if (m) m.is_available = val;
  toast(`Menu ${val ? 'diaktifkan' : 'dinonaktifkan'}`, 'info');
}

function delMenu(id, name) {
  if (!confirm(`Hapus menu "${name}"?`)) return;
  STATE.menu = STATE.menu.filter(m => m.id !== id);
  toast(`Menu "${name}" dihapus`, 'info');
  render();
}

init();
