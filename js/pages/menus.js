// ─── js/pages/menus.js ────────────────────────────────────
// CRUD beneran ke Supabase (tabel menu)

let EDITING_MENU_ID = null;

async function init() {
  if (!requireAuth(['umkm', 'admin'])) return;
  await ensureData();
  // Re-fetch menu langsung dari Supabase biar data fresh
  await reloadMenuFromDB();
  renderSidebar();
  updateCartBadge();
  render();
  setTimeout(() => document.getElementById('ldr').classList.add('out'), 1200);
}

async function reloadMenuFromDB() {
  try {
    const sb = getSB();
    const { data, error } = await sb.from('menu').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    STATE.menu = data || [];
    if (window.clearDataCache) clearDataCache();
  } catch(e) {
    console.error('[reloadMenu]', e);
  }
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

    <div class="g4" style="margin-bottom:22px">
      <div class="metric"><div class="mv" style="color:var(--m)">${myMenu.length}</div><div class="ml">Total Menu</div></div>
      <div class="metric"><div class="mv" style="color:var(--m)">${myMenu.filter(m=>m.is_available).length}</div><div class="ml">Menu Aktif</div></div>
      <div class="metric"><div class="mv" style="color:var(--m)">${myMenu.filter(m=>m.is_best_seller).length}</div><div class="ml">Best Seller</div></div>
      <div class="metric"><div class="mv" style="color:var(--m)">${[...new Set(myMenu.map(m=>m.category))].length || 0}</div><div class="ml">Kategori</div></div>
    </div>

    <div class="chips" id="mChips">
      <div class="chip on" onclick="filterCat(this,'all')">Semua</div>
      <div class="chip" onclick="filterCat(this,'Makanan')">Makanan</div>
      <div class="chip" onclick="filterCat(this,'Minuman')">Minuman</div>
      <div class="chip" onclick="filterCat(this,'Paket')">Paket</div>
      <div class="chip" onclick="filterCat(this,'Tambahan')">Tambahan</div>
    </div>

    <div class="card"><div id="menuList" style="padding:0 20px"></div></div>

    <div class="mbk" id="mMenu" onclick="if(event.target===this)closeModal('mMenu')">
      <div class="modal">
        <div class="mh">
          <div class="mt" id="mMenuTit">Tambah Menu Baru</div>
          <button class="mx" onclick="closeModal('mMenu')">✕</button>
        </div>
        <div class="mb">
          <div class="fg"><label class="fl">Nama Menu *</label><input type="text" class="fi" id="mN" placeholder="Ayam Bakar Bumbu Rujak"></div>
          <div class="fg"><label class="fl">Deskripsi</label><textarea class="fi" id="mD" rows="2" placeholder="Deskripsi singkat bahan dan cita rasa" style="resize:none"></textarea></div>
          <div class="r2">
            <div class="fg"><label class="fl">Harga Mahasiswa (Rp)</label><input type="number" class="fi" id="mPS" placeholder="16000"></div>
            <div class="fg"><label class="fl">Harga Umum (Rp) *</label><input type="number" class="fi" id="mPG" placeholder="18000"></div>
          </div>
          <div class="fg">
            <label class="fl">Kategori</label>
            <select class="fi fi-sel" id="mCat">
              <option>Makanan</option><option>Minuman</option><option>Paket</option><option>Tambahan</option>
            </select>
          </div>
          <div class="fg">
            <label class="fl">URL Foto Menu</label>
            <input type="text" class="fi" id="mPU" placeholder="https://images.unsplash.com/...">
            <div class="fi-h">Boleh kosong, akan pakai placeholder default</div>
          </div>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:18px;font-size:13px;font-weight:600">
            <input type="checkbox" id="mBS"> Tandai sebagai Best Seller
          </label>
          <button class="btn b-pri b-fw" id="mSaveBtn" onclick="saveMenu()">Simpan Menu</button>
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
        <button class="btn b-dan b-sm" onclick="delMenu('${m.id}', '${esc(m.name).replace(/'/g, "\\'")}')">Hapus</button>
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

// ── CRUD ──────────────────────────────────────────────────
function openAdd() {
  EDITING_MENU_ID = null;
  document.getElementById('mMenuTit').textContent = 'Tambah Menu Baru';
  ['mN','mD','mPU'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('mPS').value = '';
  document.getElementById('mPG').value = '';
  document.getElementById('mBS').checked = false;
  document.getElementById('mCat').value = 'Makanan';
  openModal('mMenu');
}
window.openAdd = openAdd;

function editMenu(id) {
  const m = STATE.menu.find(m => m.id === id); if (!m) return;
  EDITING_MENU_ID = id;
  document.getElementById('mMenuTit').textContent = 'Edit Menu';
  document.getElementById('mN').value  = m.name;
  document.getElementById('mD').value  = m.description || '';
  document.getElementById('mPS').value = m.student_price || '';
  document.getElementById('mPG').value = m.general_price || m.price || '';
  document.getElementById('mPU').value = m.image_url || '';
  document.getElementById('mBS').checked = m.is_best_seller || false;
  document.getElementById('mCat').value  = m.category || 'Makanan';
  openModal('mMenu');
}
window.editMenu = editMenu;

async function saveMenu() {
  const nm = document.getElementById('mN').value.trim();
  if (!nm) { toast('Nama menu wajib diisi', 'err'); return; }
  const priceG = parseInt(document.getElementById('mPG').value) || 0;
  if (priceG <= 0) { toast('Harga umum wajib diisi', 'err'); return; }
  const priceS = parseInt(document.getElementById('mPS').value) || Math.round(priceG * 0.9);

  const btn = document.getElementById('mSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  try {
    const sb = getSB();
    const payload = {
      umkm_id: getMyUmkmId(),
      name: nm,
      description: document.getElementById('mD').value.trim() || null,
      student_price: priceS,
      general_price: priceG,
      price: priceG,
      category: document.getElementById('mCat').value,
      image_url: document.getElementById('mPU').value.trim() || null,
      is_best_seller: document.getElementById('mBS').checked,
      is_available: true,
    };

    if (EDITING_MENU_ID) {
      // UPDATE
      const { data, error } = await sb.from('menu').update(payload).eq('id', EDITING_MENU_ID).select().single();
      if (error) throw error;
      // Update STATE
      const idx = STATE.menu.findIndex(m => m.id === EDITING_MENU_ID);
      if (idx >= 0) STATE.menu[idx] = data;
      toast(`Menu "${nm}" diperbarui!`, 'ok');
    } else {
      // INSERT
      const { data, error } = await sb.from('menu').insert(payload).select().single();
      if (error) throw error;
      STATE.menu.unshift(data);
      toast(`Menu "${nm}" ditambahkan!`, 'ok');
    }

    if (window.clearDataCache) clearDataCache();
    closeModal('mMenu');
    EDITING_MENU_ID = null;
    render();
  } catch(e) {
    console.error('[saveMenu]', e);
    toast('Gagal simpan: ' + (e.message || 'unknown'), 'err');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan Menu';
  }
}
window.saveMenu = saveMenu;

async function toggleAvail(id, val) {
  try {
    const sb = getSB();
    const { error } = await sb.from('menu').update({ is_available: val }).eq('id', id);
    if (error) throw error;
    const m = STATE.menu.find(m => m.id === id);
    if (m) m.is_available = val;
    if (window.clearDataCache) clearDataCache();
    toast(`Menu ${val ? 'diaktifkan' : 'dinonaktifkan'}`, 'info');
  } catch(e) {
    console.error('[toggleAvail]', e);
    toast('Gagal update: ' + e.message, 'err');
  }
}
window.toggleAvail = toggleAvail;

async function delMenu(id, name) {
  if (!confirm(`Hapus menu "${name}" secara permanen?`)) return;
  try {
    const sb = getSB();
    const { error } = await sb.from('menu').delete().eq('id', id);
    if (error) throw error;
    STATE.menu = STATE.menu.filter(m => m.id !== id);
    if (window.clearDataCache) clearDataCache();
    toast(`Menu "${name}" dihapus`, 'info');
    render();
  } catch(e) {
    console.error('[delMenu]', e);
    toast('Gagal hapus: ' + e.message, 'err');
  }
}
window.delMenu = delMenu;

init();
