// ─── js/pages/checkout.js ─────────────────────────────────

async function init() {
  restoreSession();
  await ensureData();
  renderSidebar();
  updateCartBadge();
  render();
  setTimeout(() => document.getElementById('ldr').classList.add('out'), 1200);
}

function render() {
  const { items, sub, disc, poki, total } = cartTotal();
  const drv = getDriver();
  const umkmPhone = items[0]?.[1]?.umkmPhone || '—';

  const drvCard = STATE.delivery === 'poki' && drv ? `
    <div class="seller-box">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
      <span><strong>No. HP Penjual:</strong>&nbsp;
        <a href="tel:${umkmPhone}" style="color:var(--m);font-weight:700">${umkmPhone}</a>
        &nbsp;<span style="color:var(--t3);font-size:11px">(hubungi jika ada pertanyaan)</span>
      </span>
    </div>
    <div class="pdc">
      <div class="pdc-av">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/>
        </svg>
      </div>
      <div style="flex:1">
        <div class="pdc-n">${drv.name}</div>
        <div class="pdc-m">${drv.vehicle||'Motor'} · ${drv.plate_number||'—'} · ⭐ ${drv.rating||'—'}</div>
        <div class="pdc-ph">
          <a href="tel:${drv.phone}" class="phlink">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.67 19.79 19.79 0 01.1 4.09 2 2 0 012.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.72 6.72l1.08-1.08a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
            </svg>
            Hubungi Driver
          </a>
          <span style="font-size:11px;color:var(--t3)">${drv.phone}</span>
        </div>
      </div>
      <div style="text-align:right">
        <div class="bx bx-gr">Tersedia</div>
        <div style="font-size:10px;color:var(--t3);margin-top:4px">~25 menit</div>
      </div>
    </div>`
  : STATE.delivery === 'poki'
    ? '<div class="bx bx-r" style="margin-top:10px">Tidak ada driver tersedia saat ini</div>'
    : '';

  document.getElementById('pageContent').innerHTML = `
    <div class="ph">
      <div><div class="ptit">Pre-Order</div><div class="psub">Konfirmasi pesanan & pilih metode pengambilan</div></div>
    </div>

    <div class="steps">
      <div class="step dn"><div class="sd">✓</div><div class="sl">Pilih Menu</div></div>
      <div class="step ac"><div class="sd">2</div><div class="sl">Waktu & Metode</div></div>
      <div class="step"><div class="sd">3</div><div class="sl">Konfirmasi</div></div>
      <div class="step"><div class="sd">4</div><div class="sl">Antrean</div></div>
    </div>

    <div class="col">
      <div>
        <!-- Nomor antrean -->
        <div class="card cp" style="margin-bottom:16px">
          <div class="ssm">Nomor Antrean Digital Anda</div>
          <div class="qb-box">
            <div class="qnum">#A47</div>
            <div class="ql">Estimasi persiapan</div>
            <div class="qeta">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              15 menit · 6 pesanan sebelum Anda
            </div>
          </div>
        </div>

        <!-- Metode pengiriman -->
        <div class="card cp" style="margin-bottom:16px">
          <div class="ssm">Metode Pengambilan</div>
          <div class="dtg">
            <div class="dt ${STATE.delivery==='pickup'?'on':''}" onclick="setDel('pickup')">
              <div class="dt-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg></div>
              <div class="dt-n">Ambil Sendiri</div>
              <div class="dt-s">Gratis · Di kios warung</div>
            </div>
            <div class="dt ${STATE.delivery==='poki'?'on':''}" onclick="setDel('poki')">
              <div class="dt-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>
              <div class="dt-n">Poki Food Delivery</div>
              <div class="dt-s">Area Dramaga · +Rp 5.000</div>
            </div>
          </div>
          ${drvCard}
          ${STATE.delivery === 'poki' ? `
            <div class="fg" style="margin-top:14px;margin-bottom:0">
              <label class="fl">Alamat Pengiriman</label>
              <input type="text" class="fi" placeholder="Gedung, Fakultas, Asrama, atau nama kos">
            </div>` : ''}
        </div>

        <!-- Waktu -->
        <div class="card cp" style="margin-bottom:16px">
          <div class="ssm">Pilih Waktu Pengambilan</div>
          <div class="tsg">
            ${['11:30','11:45','12:00','12:15','12:30','12:45','13:00','13:30'].map((t,i) => `
              <div class="ts ${t===STATE.selectedTime?'tsa':''} ${i===3?'tsf':''}"
                onclick="${i!==3?`pickT(this,'${t}')`:''}">${t}
                <div class="ts-s">${i===3?'Penuh':i%2?'Tersedia':'4 slot'}</div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Ringkasan -->
        <div class="card cp">
          <div class="ssm">Ringkasan Pesanan</div>
          ${items.length
            ? items.map(([,i]) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--b)">
                  <div>
                    <div style="font-size:13px;font-weight:700">${i.name}</div>
                    <div style="font-size:11px;color:var(--t3)">×${i.qty} · ${i.umkmName}</div>
                  </div>
                  <div style="font-size:13px;font-weight:800;color:var(--m)">${rp(i.price*i.qty)}</div>
                </div>`).join('')
            : `<div class="empty" style="padding:16px 0">
                <div class="etit">Keranjang kosong</div>
                <a href="explore.html" style="color:var(--m);font-size:13px;font-weight:700">Pilih menu →</a>
              </div>`}
        </div>
      </div>

      <!-- Panel kanan -->
      <div>
        <div class="card cp" style="position:sticky;top:80px">
          <div class="ssm">Konfirmasi Pembayaran</div>
          ${items.map(([,i]) => `
            <div class="op-it">
              <div><div class="op-in">${i.name}</div><div class="op-iq">×${i.qty}</div></div>
              <div class="op-ip">${rp(i.price*i.qty)}</div>
            </div>`).join('')}
          <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--b)">
            <div class="or"><span>Subtotal</span><span>${rp(sub)}</span></div>
            ${disc ? `<div class="or dc"><span>Diskon Mahasiswa</span><span>−${rp(disc)}</span></div>` : ''}
            ${poki ? `<div class="or"><span>Ongkir Poki</span><span>${rp(poki)}</span></div>` : ''}
            <div class="or fn"><span>Total</span><span style="color:var(--m)">${rp(total)}</span></div>
          </div>
          <button class="pbtn" style="margin-top:14px"
            ${!items.length ? 'disabled' : ''} onclick="confirm()">
            ${items.length ? `Konfirmasi & Bayar · ${rp(total)}` : 'Keranjang kosong'}
          </button>
          <div style="text-align:center;margin-top:9px;font-size:11px;color:var(--t3)">
            Poin IPB Makan ditambahkan setelah transaksi selesai
          </div>
        </div>
      </div>
    </div>`;
}

function setDel(t) { STATE.delivery = t; saveSession(); render(); }

function pickT(el, t) {
  STATE.selectedTime = t;
  document.querySelectorAll('.ts:not(.tsf)').forEach(e => e.classList.remove('tsa'));
  el.classList.add('tsa');
}

async function confirm() {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Memproses...';
  btn.style.cssText += 'background:var(--s2);color:var(--t3);box-shadow:none;';
  await new Promise(r => setTimeout(r, 1800));
  STATE.cart = {};
  updateCartBadge();
  saveSession();
  btn.style.cssText += 'background:var(--green);color:#fff;';
  btn.textContent = '✓ Dikonfirmasi! Antrean #A47';
  toast('Pesanan berhasil! Siap dalam ±15 menit. Nomor antrean #A47', 'ok');
  setTimeout(render, 300);
}

init();
