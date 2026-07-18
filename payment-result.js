(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem('septinoLastConsultation') || '{}'); } catch (_) {}
  const number = params.get('consultation') || saved.consultationNumber || '-';
  const email = params.get('email') || saved.email || '';
  const status = params.get('status') || document.body.dataset.status || 'pending';
  const numberEl = document.getElementById('consultationNumber');
  if (numberEl) numberEl.textContent = number;

  const config = window.SEPTINO_APP_CONFIG || {};
  const waBtn = document.getElementById('whatsappButton');
  const phone = String(config.whatsappNumber || '').replace(/\D/g, '');
  if (waBtn && phone) {
    const statusText = status === 'success' ? 'sudah menyelesaikan pembayaran' : 'sudah membuat transaksi dan pembayaran masih diproses';
    const message = `Halo Septino, saya ${statusText}.\n\nNomor Konsultasi: ${number}\nEmail: ${email || '-'}\n\nMohon dibantu untuk proses selanjutnya.`;
    waBtn.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  } else if (waBtn) {
    waBtn.hidden = true;
  }
  if (window.lucide) window.lucide.createIcons();
})();
