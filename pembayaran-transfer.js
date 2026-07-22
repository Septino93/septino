(() => {
  "use strict";

  const q = new URLSearchParams(location.search);
  const appConfig = window.SEPTINO_APP_CONFIG || window.CF_CONFIG || {};
  const paymentConfig = appConfig.payments || {};
  const banks = Array.isArray(paymentConfig.banks)
    ? paymentConfig.banks.filter(bank => bank && bank.isActive !== false)
    : [];

  const rupiah = value => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

  const formatAccount = value => String(value || "")
    .replace(/\D/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();

  const no = q.get("consultation") || "-";
  const token = q.get("token") || "";
  const identity = q.get("identity") || "";
  const amount = Number(q.get("amount") || 0);

  consultationNo.textContent = no;
  clientName.textContent = q.get("name") || "-";
  serviceName.textContent = q.get("service") || "-";
  totalAmount.textContent = rupiah(amount);

  function renderBanks() {
    bankList.innerHTML = "";
    const validBanks = banks.filter(bank =>
      bank.bankName && bank.accountNumber && bank.accountHolder &&
      !String(bank.bankName).includes("ISI ") &&
      !String(bank.accountNumber).includes("ISI ")
    );

    configWarning.hidden = validBanks.length > 0;

    validBanks
      .sort((a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)))
      .forEach(bank => {
        const card = document.createElement("article");
        card.className = `bank-account${bank.isDefault ? " is-default" : ""}`;
        card.innerHTML = `
          <div class="bank-account-title">
            <div>
              <small>${bank.isDefault ? "REKENING UTAMA" : "REKENING TRANSFER"}</small>
              <h3>${bank.bankName}</h3>
            </div>
          </div>
          <div class="account-row">
            <div>
              <small>Nomor rekening</small>
              <strong>${formatAccount(bank.accountNumber)}</strong>
            </div>
            <button type="button" class="copy-bank" data-account="${String(bank.accountNumber).replace(/\D/g, "")}">
              <i data-lucide="copy"></i> Salin
            </button>
          </div>
          <div class="holder">
            <small>Atas nama</small>
            <strong>${bank.accountHolder}</strong>
          </div>`;
        bankList.appendChild(card);
      });

    bankList.addEventListener("click", async event => {
      const button = event.target.closest(".copy-bank");
      if (!button) return;
      try {
        await navigator.clipboard.writeText(button.dataset.account || "");
        const original = button.innerHTML;
        button.textContent = "Tersalin";
        setTimeout(() => {
          button.innerHTML = original;
          if (window.lucide) window.lucide.createIcons();
        }, 1500);
      } catch (_) {
        alertMsg("Nomor rekening gagal disalin. Silakan salin secara manual.", "error");
      }
    }, { once: true });
  }

  renderBanks();

  proofFile.onchange = () => {
    fileLabel.textContent = proofFile.files[0]?.name || "Pilih bukti pembayaran";
  };

  function alertMsg(message, type) {
    payAlert.hidden = false;
    payAlert.textContent = message;
    payAlert.className = `pay-alert ${type}`;
  }

  function fileData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(new Error("File gagal dibaca."));
      reader.readAsDataURL(file);
    });
  }

  proofForm.onsubmit = async event => {
    event.preventDefault();
    const file = proofFile.files[0];

    if (!token && !identity) return alertMsg("Identitas pembayaran tidak tersedia. Silakan buka kembali link pembayaran dari halaman status.", "error");
    if (!file) return alertMsg("Pilih bukti pembayaran terlebih dahulu.", "error");
    if (file.size > 5 * 1024 * 1024) return alertMsg("Ukuran file maksimal 5 MB.", "error");

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Mengunggah...";

    try {
      const response = await fetch("/api/upload-payment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationNumber: no,
          publicToken: token,
          identity,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          data: await fileData(file)
        })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Upload gagal.");

      alertMsg("Bukti pembayaran berhasil dikirim. Admin akan melakukan verifikasi.", "success");
      paymentStatus.textContent = "Bukti Sudah Dikirim";
      uploadBtn.textContent = "Bukti Berhasil Dikirim";
      proofFile.disabled = true;
    } catch (error) {
      alertMsg(error.message || "Upload gagal.", "error");
      uploadBtn.disabled = false;
      uploadBtn.textContent = "Kirim Bukti Pembayaran";
    }
  };

  if (window.lucide) window.lucide.createIcons();
})();
