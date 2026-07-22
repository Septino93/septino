(() => {
  "use strict";

  const SERVICE_MAP = {
    "asuransi-jiwa": "Konsultasi Asuransi Jiwa",
    "penyakit-kritis": "Konsultasi Asuransi Penyakit Kritis",
    "asuransi-kesehatan": "Konsultasi Asuransi Kesehatan",
    "review-polis": "Review Polis",
    "financial-checkup": "Financial Check Up",
    "dana-pendidikan": "Konsultasi Perencanaan Dana Pendidikan Anak",
    "dana-pensiun": "Konsultasi Perencanaan Dana Pensiun",
    "konsultasi-umum": "Konsultasi Kebutuhan Keuangan"
  };
  const SIM_KEY = "septinoConsultationSimulation";

  function rememberConsultation(result, values) {
    sessionStorage.setItem("septinoLastConsultation", JSON.stringify({
      consultationNumber: result.booking.consultationNumber,
      publicToken: result.booking.publicToken,
      email: values.email,
      whatsapp: values.whatsapp
    }));
  }

  function openSnapPayment(token, result, values) {
    return new Promise(resolve => {
      window.snap.pay(token, {
        onSuccess() {
          showAlert('Pembayaran berhasil. Status sedang diperbarui ke CRM.', 'success');
          const q = new URLSearchParams({
            consultation: result.booking.consultationNumber || '',
            email: values.email || '',
            status: 'success'
          });
          setTimeout(() => { location.href = `pembayaran-berhasil.html?${q}`; }, 900);
          resolve('success');
        },
        onPending() {
          showAlert('Transaksi dibuat dan masih menunggu pembayaran.', 'info');
          const q = new URLSearchParams({
            consultation: result.booking.consultationNumber || '',
            email: values.email || '',
            status: 'pending'
          });
          setTimeout(() => { location.href = `pembayaran-pending.html?${q}`; }, 900);
          resolve('pending');
        },
        onError() {
          showAlert('Pembayaran gagal. Anda dapat mencoba kembali.', 'error');
          const q = new URLSearchParams({
            consultation: result.booking.consultationNumber || '',
            email: values.email || '',
            status: 'failed'
          });
          setTimeout(() => { location.href = `pembayaran-pending.html?${q}`; }, 900);
          resolve('error');
        },
        onClose() {
          showAlert('Popup pembayaran ditutup. Pendaftaran tetap tersimpan.', 'info');
          const q = new URLSearchParams({
            consultation: result.booking.consultationNumber || '',
            email: values.email || '',
            status: 'closed'
          });
          setTimeout(() => { location.href = `pembayaran-pending.html?${q}`; }, 900);
          resolve('closed');
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) window.lucide.createIcons();

    const params = new URLSearchParams(location.search);
    const service = params.get("service") || "konsultasi-umum";
    const serviceName = SERVICE_MAP[service] || "Konsultasi";
    const config = window.SEPTINO_APP_CONFIG || {};
    const directPrice = Number(config.directPaidServices?.[service] || 0);

    document.getElementById("serviceName").textContent = serviceName;
    document.getElementById("bookingBack").href = service === "konsultasi-umum" ? "konsultasi.html" : `${service}.html`;

    if (directPrice > 0) {
      document.getElementById('paymentSummary').hidden = false;
      document.getElementById('servicePrice').textContent = rupiah(directPrice);
      document.getElementById('paymentTotal').textContent = rupiah(directPrice);
      document.querySelector('#submitBooking span').textContent = `Bayar ${rupiah(directPrice)}`;
    }

    const simulationSummary = readSimulation(service);
    if (simulationSummary) {
      document.getElementById("simulationText").textContent = simulationSummary;
      document.getElementById("simulationBox").classList.add("is-visible");
    }

    const form = document.getElementById("bookingForm");
    const submit = document.getElementById("submitBooking");

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const defaultButtonText = directPrice > 0 ? `Bayar ${rupiah(directPrice)}` : 'Daftar Konsultasi';
      const values = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        whatsapp: form.whatsapp.value.trim(),
        service,
        serviceName,
        simulationSummary
      };

      if (!values.name || !values.email || !values.whatsapp) {
        showAlert("Lengkapi nama, email, dan nomor WhatsApp.", "error");
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(values.email)) {
        showAlert("Format email belum benar.", "error");
        return;
      }
      if (window.SeptinoBookingService.normalizePhone(values.whatsapp).length < 10) {
        showAlert("Nomor WhatsApp belum benar.", "error");
        return;
      }

      submit.disabled = true;
      submit.querySelector("span").textContent = "Memproses...";
      try {
        const result = await window.SeptinoBookingService.createBooking(values);
        sessionStorage.removeItem(SIM_KEY);
        rememberConsultation(result, values);

        if (result.booking.method === 'paid' || Number(result.booking.amount) > 0) {
          showAlert(`Pendaftaran berhasil. Membuka instruksi transfer ${rupiah(result.booking.amount)}...`, 'info');
          const q = new URLSearchParams({
            consultation: result.booking.consultationNumber || '',
            token: result.booking.publicToken || '',
            name: values.name || '',
            service: values.serviceName || '',
            amount: String(result.booking.amount || 0)
          });
          setTimeout(() => { location.href = `pembayaran-transfer.html?${q}`; }, 700);
          return;
        }

        showAlert(`Pendaftaran berhasil. Nomor Konsultasi: ${result.booking.consultationNumber}`, "success");
        setTimeout(() => { location.href = buildWhatsApp(result, values); }, 1100);
      } catch (error) {
        showAlert(error.message || "Pendaftaran gagal disimpan. Silakan coba kembali.", "error");
        submit.disabled = false;
        submit.querySelector("span").textContent = defaultButtonText;
      }
    });
  });
})();
