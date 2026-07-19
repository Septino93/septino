(() => {
  "use strict";

  const STATUS_LABELS = {
    waiting_payment: "Menunggu Pembayaran",
    waiting_whatsapp: "Menunggu Penjadwalan",
    waiting_schedule: "Menunggu Penjadwalan",
    confirmed: "Jadwal Dikonfirmasi",
    completed: "Konsultasi Selesai"
  };
  let snapLoader = null;
  let currentIdentity = "";

  function money(value) {
    return Number(value || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
  }

  function showError(message) {
    const box = document.getElementById("statusAlert");
    box.textContent = message;
    box.className = "status-alert is-visible error";
  }

  function showInfo(message) {
    const box = document.getElementById("statusAlert");
    box.textContent = message;
    box.className = "status-alert is-visible";
  }

  function clearError() {
    const box = document.getElementById("statusAlert");
    box.textContent = "";
    box.className = "status-alert";
  }

  async function loadSnap() {
    if (window.snap) return window.snap;
    if (snapLoader) return snapLoader;
    snapLoader = (async () => {
      const response = await fetch('/api/midtrans-config', { headers: { Accept: 'application/json' } });
      const config = await response.json().catch(() => null);
      if (!response.ok || !config?.clientKey) throw new Error(config?.message || 'Konfigurasi Midtrans belum tersedia.');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = config.snapUrl;
        script.dataset.clientKey = config.clientKey;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Snap Midtrans gagal dimuat.'));
        document.head.appendChild(script);
      });
      return window.snap;
    })();
    return snapLoader;
  }

  async function pay(item) {
    const payButton = document.getElementById("payButton");
    payButton.disabled = true;
    showInfo('Menyiapkan pembayaran...');
    try {
      await loadSnap();
      const body = {
        consultationNumber: item.consultationNumber,
        email: currentIdentity.includes('@') ? currentIdentity : '',
        whatsapp: currentIdentity.includes('@') ? '' : currentIdentity
      };
      const response = await fetch('/api/create-midtrans-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.token) throw new Error(data?.message || 'Transaksi gagal dibuat.');
      window.snap.pay(data.token, {
        onSuccess: () => { showInfo('Pembayaran berhasil. Silakan cek status kembali dalam beberapa detik.'); },
        onPending: () => { showInfo('Transaksi menunggu pembayaran.'); },
        onError: () => { showError('Pembayaran gagal. Silakan coba kembali.'); },
        onClose: () => { showInfo('Popup pembayaran ditutup. Anda dapat menekan Bayar Sekarang lagi.'); }
      });
    } catch (error) {
      showError(error.message || 'Pembayaran tidak dapat dibuka.');
    } finally {
      payButton.disabled = false;
    }
  }


  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  async function loadDocuments(item) {
    const section = document.getElementById("documentSection");
    const list = document.getElementById("documentList");
    section.hidden = true;
    list.innerHTML = "";

    try {
      const response = await fetch("/api/check-service-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          consultationNumber: item.consultationNumber,
          identity: currentIdentity
        })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Dokumen gagal dimuat.");

      const documents = Array.isArray(data?.documents) ? data.documents : [];
      if (!documents.length) {
        if (item.status === "completed") {
          section.hidden = false;
          list.innerHTML = '<div class="status-document-empty"><i data-lucide="clock-3"></i><span>Dokumen hasil konsultasi belum tersedia. Silakan cek kembali nanti.</span></div>';
        }
        return;
      }

      section.hidden = false;
      list.innerHTML = documents.map(doc => `
        <a class="status-document-item" href="${escapeHtml(doc.downloadUrl)}" target="_blank" rel="noopener">
          <span class="status-document-file"><i data-lucide="file-text"></i></span>
          <span class="status-document-copy">
            <strong>${escapeHtml(doc.title || doc.filename || "Dokumen Konsultasi")}</strong>
            <small>${escapeHtml(doc.category || "Laporan")} · PDF</small>
          </span>
          <span class="status-document-download"><i data-lucide="download"></i></span>
        </a>
      `).join("");
    } catch (error) {
      console.warn(error);
    } finally {
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function render(found) {
    const item = found.consultation;
    const config = window.SEPTINO_APP_CONFIG || {};
    const label = STATUS_LABELS[item.status] || "Sedang Diproses";
    const badge = document.getElementById("resultStatus");

    document.getElementById("resultNumber").textContent = item.consultationNumber || "-";
    document.getElementById("resultName").textContent = item.clientName || "-";
    document.getElementById("resultService").textContent = item.serviceName || "-";
    badge.textContent = label;
    badge.className = `status-badge ${item.status === "confirmed" || item.status === "completed" ? item.status : ""}`;
    const paymentLabels = { paid: 'Lunas', pending: 'Menunggu Pembayaran', failed: 'Gagal / Kedaluwarsa', not_required: 'Tidak Diperlukan' };
    document.getElementById("resultPayment").textContent = paymentLabels[item.paymentStatus] || 'Sedang Diproses';
    document.getElementById("resultAmount").textContent = item.amount > 0 ? money(item.amount) : "Gratis";
    document.getElementById("resultDate").textContent = new Date(item.createdAt).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });

    const payButton = document.getElementById("payButton");
    payButton.hidden = !(item.amount > 0 && item.paymentStatus !== 'paid');
    payButton.onclick = () => pay(item);

    const text = `Halo Septino, saya ingin menanyakan status konsultasi.\n\nNomor Konsultasi: ${item.consultationNumber}\nNama: ${item.clientName}\nLayanan: ${item.serviceName}`;
    document.getElementById("whatsappButton").href = `https://wa.me/${config.whatsappNumber || "628116946999"}?text=${encodeURIComponent(text)}`;
    document.getElementById("statusResult").hidden = false;
    loadDocuments(item);
    if (window.lucide) window.lucide.createIcons();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) window.lucide.createIcons();
    try {
      const last = JSON.parse(sessionStorage.getItem("septinoLastConsultation") || "null");
      if (last) {
        document.getElementById("consultationNumber").value = last.consultationNumber || "";
        document.getElementById("identity").value = last.email || last.whatsapp || "";
      }
    } catch (_) {}

    document.getElementById("statusForm").addEventListener("submit", async event => {
      event.preventDefault();
      clearError();
      document.getElementById("statusResult").hidden = true;
      const number = document.getElementById("consultationNumber").value.trim();
      const identity = document.getElementById("identity").value.trim();
      if (!number || !identity) return showError("Lengkapi Nomor Konsultasi dan email atau WhatsApp.");
      currentIdentity = identity;
      const submitButton = event.currentTarget.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;
      try {
        const found = await window.SeptinoBookingService.findConsultation(number, identity);
        if (!found) return showError("Data konsultasi tidak ditemukan. Periksa kembali nomor dan identitas yang dimasukkan.");
        render(found);
      } catch (error) {
        showError(error.message || "Status konsultasi gagal diperiksa. Silakan coba kembali.");
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  });
})();
