// ─── js/auth.js ───────────────────────────────────────────
// Autentikasi & session management
// Menggunakan localStorage agar session tidak hilang saat browser ditutup

function saveSession() {
  try {
    localStorage.setItem('ipbmakan_v2', JSON.stringify({
      role: STATE.role,
      user: STATE.user,
      umkmId: STATE.umkmId,
      cart: STATE.cart,
    }));
  } catch (e) { console.warn('saveSession error:', e); }
}

function restoreSession() {
  try {
    const s = localStorage.getItem('ipbmakan_v2');
    if (s) {
      const { role, user, umkmId, cart } = JSON.parse(s);
      STATE.role   = role   || 'general';
      STATE.user   = user   || null;
      STATE.umkmId = umkmId || null;
      STATE.cart   = cart   || {};
      return true;
    }
  } catch (e) { console.warn('restoreSession error:', e); }
  // Default ke general — halaman publik tidak perlu login
  STATE.role = 'general';
  STATE.user = null;
  return false;
}

function clearSession() {
  try { localStorage.removeItem('ipbmakan_v2'); } catch (e) {}
  STATE.role = 'general';
  STATE.user = null;
  STATE.umkmId = null;
  STATE.cart = {};
  STATE.geminiHistory = [];
}

window.saveSession  = saveSession;
window.restoreSession = restoreSession;
window.clearSession = clearSession;

// Tentukan halaman home berdasarkan role
function roleHome(role) {
  if (role === 'umkm')  return 'dashboard.html';
  if (role === 'admin') return 'admin.html';
  return 'index.html';
}
window.roleHome = roleHome;

// requireAuth: hanya untuk halaman merchant/admin
// Untuk halaman publik, cukup panggil restoreSession()
function requireAuth(allowedRoles) {
  restoreSession();
  if (allowedRoles && !allowedRoles.includes(STATE.role)) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}
window.requireAuth = requireAuth;

// Demo login — ganti dengan Supabase Auth saat production
async function doLogin(role, nim) {
  const names = {
    student: 'Rizqi Firmansyah',
    umkm:    'Pemilik Warung',
    general: 'Pengunjung',
    admin:   'Admin Platform',
  };
  STATE.role = role;
  STATE.user = {
    id:           'demo-' + Date.now(),
    full_name:    names[role] || 'Pengguna',
    email:        `${role}@ipbmakan.id`,
    role,
    nim:          role === 'student' ? (nim || 'G64190001') : null,
    nim_verified: role === 'student',
    points:       1250,
  };
  // Untuk UMKM, gunakan warung pertama dari data Supabase
  if (role === 'umkm') STATE.umkmId = STATE.umkm[0]?.id || null;
  saveSession();
  window.location.href = roleHome(role);
}
window.doLogin = doLogin;

function doLogout() {
  clearSession();
  window.location.href = 'index.html';
}
window.doLogout = doLogout;
