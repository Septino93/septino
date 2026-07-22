(() => {
  "use strict";

  const STATUS_LABELS = {
    waiting_payment: "Menunggu Pembayaran",
    waiting_whatsapp: "Menunggu Penjadwalan",
    waiting_schedule: "Menunggu Penjadwalan",
    confirmed: "Jadwal Dikonfirmasi",
    completed: "Konsultasi Selesai"
  };
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

  function pay(item) {
    const params = new URLSearchParams({
      consultation: item.consultationNumber || "",
      identity: currentIdentity || "",
      amount: String(Number(item.amount || 0)),
      name: item.clientName || "",
      service: item.serviceName || ""
    });
    window.location.href = `pembayaran-transfer.html?${params.toString()}`;
  }



  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  function formatDocumentDate(value) {
    if (!value) return "Tanggal belum tersedia";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Tanggal belum tersedia";
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }

  function showDownloadToast(message = "Dokumen sedang dipersiapkan...") {
    let toast = document.getElementById("downloadToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "downloadToast";
      toast.className = "download-toast";
      toast.innerHTML = '<i data-lucide="loader-circle"></i><span></span>';
      document.body.appendChild(toast);
    }
    toast.querySelector("span").textContent = message;
    toast.classList.add("show");
    if (window.lucide) window.lucide.createIcons();
    clearTimeout(showDownloadToast.timer);
    showDownloadToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
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
        <a class="status-document-item" href="${escapeHtml(doc.downloadUrl)}" target="_blank" rel="noopener" data-document-download>
          <span class="status-document-file"><i data-lucide="file-text"></i></span>
          <span class="status-document-copy">
            <strong>${escapeHtml(doc.title || doc.filename || "Dokumen Konsultasi")}</strong>
            <small>${escapeHtml(doc.category || "Laporan")} · PDF</small>
            <time>${escapeHtml(formatDocumentDate(doc.uploadedAt))}</time>
          </span>
          <span class="status-document-download"><i data-lucide="download"></i></span>
        </a>
      `).join("");

      list.querySelectorAll("[data-document-download]").forEach(link => {
        link.addEventListener("click", () => {
          showDownloadToast("Dokumen sedang dipersiapkan...");
        });
      });
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
    const amountRow=document.getElementById("resultAmountRow");
    const amountEl=document.getElementById("resultAmount");
    const payButton=document.getElementById("payButton");
    const payable=Number(item.amount||0)>0 && item.paymentStatus!=="paid" && item.paymentStatus!=="not_required";
    amountRow.hidden=Number(item.amount||0)<=0;
    amountEl.textContent=money(item.amount);
    payButton.hidden=!payable;
    payButton.onclick=()=>pay(item);

    badge.textContent = label;
    badge.className = `status-badge ${
      item.status === "completed"
        ? "completed"
        : item.status === "confirmed"
          ? "confirmed"
          : "processing"
    }`;

    const text =
      `Halo Septino, saya ingin menanyakan status layanan keuangan.

` +
      `Kode Layanan: ${item.consultationNumber || "-"}
` +
      `Nama: ${item.clientName || "-"}
` +
      `Layanan: ${item.serviceName || "-"}`;

    document.getElementById("whatsappButton").href =
      `https://wa.me/${config.whatsappNumber || "628116946999"}?text=${encodeURIComponent(text)}`;

    document.getElementById("statusResult").hidden = false;
    loadDocuments(item);
    if (window.lucide) window.lucide.createIcons();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) window.lucide.createIcons();
    const query=new URLSearchParams(location.search);
    const queryNumber=query.get("consultation");
    if(queryNumber)document.getElementById("consultationNumber").value=queryNumber;
    try {
      const last = JSON.parse(sessionStorage.getItem("septinoLastConsultation") || "null");
      if (last) {
        if(!queryNumber)document.getElementById("consultationNumber").value = last.consultationNumber || "";
        document.getElementById("identity").value = last.email || last.whatsapp || "";
      }
    } catch (_) {}

    document.getElementById("statusForm").addEventListener("submit", async event => {
      event.preventDefault();
      clearError();
      document.getElementById("statusResult").hidden = true;
      const number = document.getElementById("consultationNumber").value.trim();
      const identity = document.getElementById("identity").value.trim();
      if (!number || !identity) return showError("Lengkapi Kode Layanan dan email atau WhatsApp.");
      currentIdentity = identity;
      const submitButton = event.currentTarget.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;
      try {
        const found = await window.SeptinoBookingService.findConsultation(number, identity);
        if (!found) return showError("Data layanan tidak ditemukan. Periksa kembali kode layanan dan identitas yang dimasukkan.");
        render(found);
      } catch (error) {
        showError(error.message || "Status layanan gagal diperiksa. Silakan coba kembali.");
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  });
})();
