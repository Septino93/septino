(() => {
  "use strict";

  const STATUS_LABELS = {
    waiting_payment: "Menunggu Pembayaran",
    waiting_whatsapp: "Menunggu Penjadwalan",
    waiting_schedule: "Menunggu Penjadwalan",
    confirmed: "Jadwal Dikonfirmasi",
    completed: "Konsultasi Selesai"
  };

  function money(value) {
    return Number(value || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
  }

  function showError(message) {
    const box = document.getElementById("statusAlert");
    box.textContent = message;
    box.className = "status-alert is-visible error";
  }

  function clearError() {
    const box = document.getElementById("statusAlert");
    box.textContent = "";
    box.className = "status-alert";
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
    document.getElementById("resultPayment").textContent = item.paymentStatus === "pending" ? "Menunggu Pembayaran" : "Tidak Diperlukan";
    document.getElementById("resultAmount").textContent = item.amount > 0 ? money(item.amount) : "Gratis";
    document.getElementById("resultDate").textContent = new Date(item.createdAt).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });

    const payButton = document.getElementById("payButton");
    payButton.hidden = item.paymentStatus !== "pending";
    payButton.onclick = () => alert("Pembayaran Midtrans akan aktif setelah backend dan akun Midtrans dihubungkan.");

    const text = `Halo Septino, saya ingin menanyakan status konsultasi.\n\nNomor Konsultasi: ${item.consultationNumber}\nNama: ${item.clientName}\nLayanan: ${item.serviceName}`;
    document.getElementById("whatsappButton").href = `https://wa.me/${config.whatsappNumber || "628116946999"}?text=${encodeURIComponent(text)}`;
    document.getElementById("statusResult").hidden = false;
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
      if (!number || !identity) {
        showError("Lengkapi Nomor Konsultasi dan email atau WhatsApp.");
        return;
      }
      const submitButton = event.currentTarget.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;
      try {
        const found = await window.SeptinoBookingService.findConsultation(number, identity);
        if (!found) {
          showError("Data konsultasi tidak ditemukan. Periksa kembali nomor dan identitas yang dimasukkan.");
          return;
        }
        render(found);
      } catch (error) {
        showError(error.message || "Status konsultasi gagal diperiksa. Silakan coba kembali.");
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  });
})();
