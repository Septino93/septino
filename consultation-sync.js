(() => {
  "use strict";
  const STORAGE_KEY = "septinoConsultationSimulation";
  const MAX_AGE_MS = 30 * 60 * 1000;

  function initializeConsultationSync() {
    const button = document.querySelector(".service-order-button");
    if (!button) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("from") !== "simulation") return;

    let payload = null;
    try { payload = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null"); }
    catch (_) { sessionStorage.removeItem(STORAGE_KEY); return; }

    if (!payload?.page) return;
    if (payload.page !== window.location.pathname.split("/").pop()) return;
    if (Date.now() - Number(payload.createdAt || 0) > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY); return;
    }

    const label = button.querySelector("span");
    if (label) label.innerHTML = "<strong>Daftar Konsultasi</strong>Ringkasan otomatis disertakan";

    const notice = document.createElement("div");
    notice.className = "simulation-sync-notice";
    notice.innerHTML = `<span class="simulation-sync-icon"><i data-lucide="circle-check-big"></i></span><div><strong>Hasil simulasi berhasil disiapkan</strong><p>Ringkasan hasil simulasi akan otomatis masuk ke formulir konsultasi dan diteruskan ke CRM.</p></div>`;
    button.closest(".service-cta-card")?.insertBefore(notice, button);
    if (window.lucide) window.lucide.createIcons();
  }
  document.addEventListener("DOMContentLoaded", initializeConsultationSync);
})();
