// ─── js/state.js ──────────────────────────────────────────
// Global state aplikasi IPB Makan

const STATE = {
  role: 'general',     // 'student' | 'umkm' | 'general' | 'admin'
  user: null,          // object user yang sedang login
  umkmId: null,        // ID umkm aktif (untuk role umkm)

  // Cache data dari Supabase
  umkm: [],
  menu: [],
  videos: [],
  reviews: [],
  drivers: [],

  // Keranjang: { [menuId]: { name, price, qty, umkmName, umkmId, umkmPhone } }
  cart: {},

  // State checkout
  delivery: 'pickup',  // 'pickup' | 'poki'
  selectedTime: '12:00',

  // Riwayat percakapan AI Gemini
  geminiHistory: [],
};

window.STATE = STATE;

// ─── Cart helpers ─────────────────────────────────────────
window.cartTotal = function () {
  const items = Object.entries(STATE.cart);
  const sub = items.reduce((s, [, i]) => s + i.price * i.qty, 0);
  const disc = STATE.role === 'student' ? Math.round(sub * 0.1) : 0;
  const poki = STATE.delivery === 'poki' ? CONFIG.app.pokiBaseFee : 0;
  return { items, sub, disc, poki, total: sub - disc + poki };
};

window.cartCount = function () {
  return Object.values(STATE.cart).reduce((s, i) => s + i.qty, 0);
};

window.updateCartBadge = function () {
  const count = window.cartCount();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? '' : 'none';
  });
};
