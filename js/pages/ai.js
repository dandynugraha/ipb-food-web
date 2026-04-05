// ─── js/pages/ai.js ───────────────────────────────────────

const SUGS = [
  'Bagaimana meningkatkan penjualan di jam sepi?',
  'Berapa harga ideal Ayam Bakar di Babakan Raya?',
  'Menu apa yang trending di kalangan mahasiswa IPB?',
  'Strategi promosi untuk meningkatkan ulasan bintang 5?',
  'Tips konten TikTok viral untuk warung makan?',
  'Cara optimalkan jam buka untuk maksimalkan omzet?',
];

let sending = false;

async function init() {
  if (!requireAuth(['umkm', 'admin'])) return;
  await ensureData();
  renderSidebar();
  updateCartBadge();
  renderPage();
  setTimeout(() => document.getElementById('ldr').classList.add('out'), 1200);
}

function renderPage() {
  document.getElementById('pageContent').innerHTML = `
    <div class="ph">
      <div>
        <div class="ptit">AI Asisten Bisnis</div>
        <div class="psub">Google Gemini 1.5 Pro — analisis data warung Babakan Raya secara real-time</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 272px;gap:20px;height:calc(100vh - 130px)">
      <!-- Chat main -->
      <div class="chatm">
        <div class="ch">
          <div class="ai-av">
            <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8zm-1-13v5l4 2-1 1.7-5-2.7V7z" fill="white"/></svg>
          </div>
          <div>
            <div class="ai-n">IPB Makan AI — Gemini 1.5 Pro</div>
            <div class="ai-st"><div class="ai-dot"></div><span id="aiStatus">Memuat...</span></div>
          </div>
          <span class="bx bx-g" style="margin-left:auto">Gemini Pro</span>
        </div>
        <div class="msgs" id="msgs">
          <div class="msg ai">
            <div class="mb-bbl">
              Halo! Saya asisten AI IPB Makan yang didukung oleh <strong>Google Gemini 1.5 Pro</strong>.<br><br>
              Saya dapat membantu Anda menganalisis harga, memahami tren menu mahasiswa di Babakan Raya, dan merumuskan strategi promosi.<br><br>
              Apa yang ingin Anda ketahui hari ini?
            </div>
            <div class="msg-t" id="aiInitT"></div>
            <div class="sgr">
              <div class="sc" onclick="quick(this.textContent)">Analisis harga optimal</div>
              <div class="sc" onclick="quick(this.textContent)">Tren menu mahasiswa IPB</div>
              <div class="sc" onclick="quick(this.textContent)">Strategi promosi Babakan Raya</div>
              <div class="sc" onclick="quick(this.textContent)">Atasi jam sepi</div>
            </div>
          </div>
        </div>
        <div class="ci-w">
          <input class="ci" id="ci" type="text"
            placeholder="Tanya tentang bisnis warung Anda di Babakan Raya..."
            onkeypress="if(event.key==='Enter')sendMsg()">
          <button class="snd" onclick="sendMsg()" id="sndBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Sidebar -->
      <div style="background:var(--s);border:1px solid var(--b);border-radius:var(--r20);padding:20px;overflow-y:auto">
        <div class="stit">Pertanyaan Populer</div>
        <div id="aiSugs"></div>
        <hr class="div">
        <div class="stit">Data Warung Anda</div>
        <div id="aiData" style="background:var(--s2);border-radius:var(--r12);padding:14px;font-size:12px;line-height:1.8"></div>
      </div>
    </div>`;

  // Init tampilan
  document.getElementById('aiInitT').textContent = nt();
  document.getElementById('aiStatus').textContent = 'Online · Terhubung ke Gemini 1.5 Pro';

  // Sidebar data warung
  const uid = getMyUmkmId();
  const u   = getUmkm(uid) || {};
  const mc  = getMenu(uid).length;
  const rc  = getReviews(uid).length;
  const ad  = document.getElementById('aiData');
  if (ad) ad.innerHTML = [
    ['Warung',     u.nama || '—'],
    ['Rating',     `${u.umkm_rating || '—'}/5.0`],
    ['Ulasan',     `${rc} ulasan`],
    ['Menu aktif', `${mc} item`],
    ['Diskon mhs', `${u.student_discount_pct || 0}%`],
    ['Poki',       u.poki_enabled ? 'Aktif' : 'Tidak aktif'],
  ].map(([k,v]) =>
    `<div style="display:flex;justify-content:space-between"><span style="color:var(--t3)">${k}</span><span style="font-weight:700">${v}</span></div>`
  ).join('');

  // Saran pertanyaan
  const as = document.getElementById('aiSugs');
  if (as) as.innerHTML = SUGS.map(s =>
    `<div style="background:var(--s2);border-radius:var(--r8);padding:10px 12px;cursor:pointer;font-size:12px;font-weight:600;color:var(--t2);border:1px solid transparent;margin-bottom:7px;transition:all .15s"
      onmouseenter="this.style.borderColor='var(--m)';this.style.color='var(--m)'"
      onmouseleave="this.style.borderColor='transparent';this.style.color='var(--t2)'"
      onclick="quick('${s.replace(/'/g,"\\'")}')">
      <span style="color:var(--t3);margin-right:5px">→</span>${s}
    </div>`
  ).join('');
}

function quick(t) {
  document.getElementById('ci').value = t;
  sendMsg();
}

async function sendMsg() {
  if (sending) return;
  const inp = document.getElementById('ci');
  const txt = inp.value.trim(); if (!txt) return;

  sending = true;
  const btn = document.getElementById('sndBtn');
  if (btn) btn.disabled = true;

  const ms = document.getElementById('msgs');
  ms.innerHTML += `<div class="msg us"><div class="mb-bbl">${esc(txt)}</div><div class="msg-t">${nt()}</div></div>`;
  inp.value = '';
  ms.scrollTop = ms.scrollHeight;

  const tid = 'th-' + Date.now();
  ms.innerHTML += `<div class="msg ai" id="${tid}"><div class="mb-bbl" style="color:var(--t3);font-style:italic">Menganalisis dengan Gemini 1.5 Pro...</div></div>`;
  ms.scrollTop = ms.scrollHeight;

  const uid = getMyUmkmId();
  const ctx = getUmkm(uid) || {};

  try {
    const resp = await askGemini(txt, ctx, STATE.geminiHistory);
    document.getElementById(tid)?.remove();

    STATE.geminiHistory.push({ role: 'user', text: txt }, { role: 'model', text: resp });
    if (STATE.geminiHistory.length > 20) STATE.geminiHistory = STATE.geminiHistory.slice(-20);

    ms.innerHTML += `<div class="msg ai"><div class="mb-bbl">${resp.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')}</div><div class="msg-t">${nt()}</div></div>`;
  } catch(e) {
    document.getElementById(tid)?.remove();
    ms.innerHTML += `<div class="msg ai"><div class="mb-bbl" style="color:var(--red)">Maaf, terjadi kesalahan. Silakan coba lagi.</div></div>`;
  }

  ms.scrollTop = ms.scrollHeight;
  sending = false;
  if (btn) btn.disabled = false;
}

init();
