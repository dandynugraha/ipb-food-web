// ─── js/ui.js ─────────────────────────────────────────────
// Shared UI helpers: toast, modal, sidebar, empty state

// ── Toast notifikasi ──────────────────────────────────────
function toast(msg, type = 'info') {
  let wrap = document.getElementById('toasts');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toasts';
    wrap.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:8000;display:flex;flex-direction:column;gap:8px;pointer-events:none';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = `toast t-${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
window.toast = toast;

// ── Modal ─────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
window.openModal  = openModal;
window.closeModal = closeModal;

// Tutup modal saat klik backdrop
document.addEventListener('click', e => {
  if (e.target.classList.contains('mbk') && e.target.classList.contains('open'))
    e.target.classList.remove('open');
});

// ── Empty state ───────────────────────────────────────────
window.emptyState = (title, sub = '') => `
  <div class="empty">
    <div class="ei">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
    </div>
    <div class="etit">${title}</div>
    ${sub ? `<div style="font-size:12px;color:var(--t3);margin-top:4px">${sub}</div>` : ''}
  </div>`;

// ── Sidebar nav config per role ────────────────────────────
const NAV_CFG = {
  student: [
    { grp: 'Pesan Makanan', items: [
      { p: 'index.html',    label: 'Beranda',          icon: 'home'   },
      { p: 'explore.html',  label: 'Jelajahi Warung',  icon: 'search' },
      { p: 'reels.html',    label: 'Video Feed',       icon: 'video'  },
      { p: 'checkout.html', label: 'Pre-Order',        icon: 'cart'   },
    ]},
  ],
  general: [
    { grp: 'Jelajahi', items: [
      { p: 'index.html',    label: 'Beranda',          icon: 'home'   },
      { p: 'explore.html',  label: 'Jelajahi Warung',  icon: 'search' },
      { p: 'reels.html',    label: 'Video Feed',       icon: 'video'  },
      { p: 'checkout.html', label: 'Pesanan',          icon: 'cart'   },
    ]},
  ],
  umkm: [
    { grp: 'Operasional', items: [
      { p: 'dashboard.html', label: 'Dashboard',         icon: 'grid'  },
      { p: 'menus.html',     label: 'Kelola Menu',       icon: 'edit'  },
      { p: 'videos.html',    label: 'Video & TikTok',    icon: 'video' },
    ]},
    { grp: 'Alat', items: [
      { p: 'ai.html',       label: 'AI Asisten Gemini', icon: 'ai'     },
      { p: 'explore.html',  label: 'Lihat Kompetitor',  icon: 'search' },
    ]},
  ],
  admin: [
    { grp: 'Admin', items: [
      { p: 'admin.html',   label: 'Panel Admin',    icon: 'shield' },
      { p: 'index.html',   label: 'Lihat Aplikasi', icon: 'home'   },
      { p: 'explore.html', label: 'Semua Warung',   icon: 'search' },
    ]},
  ],
};

const NAV_ICONS = {
  home:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`,
  video:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  cart:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
  grid:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  edit:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 14.66V20a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h5.34"/><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"/></svg>`,
  ai:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
};

// Render sidebar nav berdasarkan role
function renderSidebar() {
  const nav = document.getElementById('sbnav'); if (!nav) return;
  const cfg = NAV_CFG[STATE.role] || NAV_CFG.general;
  const RLBL = { student: 'Mahasiswa IPB', umkm: 'UMKM Owner', general: 'Tamu Umum', admin: 'Administrator' };

  const sbRv = document.getElementById('sbRv');
  if (sbRv) sbRv.textContent = RLBL[STATE.role] || STATE.role;

  nav.innerHTML = cfg.map(g => `
    <div class="sg">${g.grp}</div>
    ${g.items.map(it => `
      <a class="nl" data-p="${it.p}" href="${it.p}">${NAV_ICONS[it.icon] || ''}${it.label}</a>
    `).join('')}
  `).join('');

  const name = STATE.user?.full_name || (STATE.role === 'general' ? 'Tamu' : 'Pengguna');
  const sbAv = document.getElementById('sbAv');
  const sbUn = document.getElementById('sbUn');
  const sbUs = document.getElementById('sbUs');
  if (sbAv) sbAv.textContent = name.charAt(0).toUpperCase();
  if (sbUn) sbUn.textContent = name;
  if (sbUs) sbUs.textContent = STATE.user?.email || RLBL[STATE.role] || '';

  updateCartBadge();

  // Tandai nav aktif berdasarkan halaman saat ini
  const cur = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nl[data-p]').forEach(el => {
    el.classList.toggle('on', el.dataset.p === cur);
  });
}
window.renderSidebar = renderSidebar;

// ── Responsive sidebar toggle ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const ham = document.getElementById('hamBtn');
  const sb  = document.getElementById('sb');
  if (ham && sb) {
    ham.addEventListener('click', () => sb.classList.toggle('open'));
    document.getElementById('app')?.addEventListener('click', e => {
      if (window.innerWidth <= 900 && !e.target.closest('.sidebar') && !e.target.closest('#hamBtn'))
        sb.classList.remove('open');
    });
  }
  function onResize() {
    const hb = document.getElementById('hamBtn'); if (!hb) return;
    hb.style.display = window.innerWidth <= 900 ? 'block' : 'none';
    if (window.innerWidth > 900) sb?.classList.remove('open');
  }
  window.addEventListener('resize', onResize);
  onResize();
});
