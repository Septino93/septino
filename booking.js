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
  let snapLoader = null;

  const rupiah = value => `Rp${Number(value || 0).toLocaleString("id-ID")}`;

  function showAlert(message, type) {
    const alert = document.getElementById("bookingAlert");
    alert.textContent = message;
    alert.className = `booking-alert is-visible ${type || ""}`;
  }

  function readSimulation(service) {
    try {
      const payload = JSON.parse(sessionStorage.getItem(SIM_KEY) || "null");
      if (!payload) return "";
      const expectedPage = `${service}.html`;
      if (payload.page && payload.page !== expectedPage) return "";
      return payload.message || payload.summary || "";
    } catch (_) {
      return "";
    }
  }

  function buildWhatsApp(result, values) {
    const config = window.SEPTINO_APP_CONFIG || {};
    const consultation = result.booking || {};
    const paymentText = consultation.method === "paid"
      ? `\nStatus: Menunggu pembayaran ${rupiah(consultation.amount)}`
      : `\nStatus: Menunggu penjadwalan\nSisa konsultasi gratis: ${result.remainingCredit ?? "-"}`;
    const message = `Halo Septino, saya sudah mendaftar konsultasi.\n\nNama: ${values.name}\nLayanan: ${values.serviceName}${paymentText}\nNomor Konsultasi: ${consultation.consultationNumber || "-"}\n\nMohon dibantu untuk proses selanjutnya.`;
    return `https://wa.me/${config.whatsappNumber || "628116946999"}?text=${encodeURIComponent(message)}`;
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
      if (!window.snap) throw new Error('Snap Midtrans tidak tersedia.');
      return window.snap;
    })();
    return snapLoader;
  }

  async function createSnapTransaction(result, values) {
    const response = await fetch('/api/create-midtrans-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        consultationNumber: result.booking.consultationNumber,
        name: values.name,
        email: values.email,
        whatsapp: values.whatsapp
      })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.token) throw new Error(data?.message || 'Transaksi Midtrans gagal dibuat.');
    return data;
  }

  function rememberConsultation(result, values) {
    sessionStorage.setItem("septinoLastConsultation", JSON.stringify({
      consultationNumber: result.booking.consultationNumber,
      email: values.email,
      whatsapp: values.whatsapp
    }));
  }

  function openSnapPayment(token, result, values) {
    return new Promise(resolve => {
      window.snap.pay(token, {
        onSuccess() {
          showAlert('Pembayaran berhasil. Status sedang diperbarui ke CRM.', 'success');
          setTimeout(() => { location.href = 'status-konsultasi.html'; }, 1200);
          resolve('success');
        },
        onPending() {
          showAlert('Transaksi dibuat dan masih menunggu pembayaran.', 'info');
          setTimeout(() => { location.href = 'status-konsultasi.html'; }, 1500);
          resolve('pending');
        },
        onError() {
          showAlert('Pembayaran gagal. Anda dapat mencoba kembali.', 'error');
          resolve('error');
        },
        onClose() {
          showAlert('Popup pembayaran ditutup. Pendaftaran tetap tersimpan dan pembayaran dapat dicoba kembali.', 'info');
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
          showAlert(`Pendaftaran berhasil. Membuka pembayaran ${rupiah(result.booking.amount)}...`, 'info');
          await loadSnap();
          const transaction = await createSnapTransaction(result, values);
          await openSnapPayment(transaction.token, result, values);
          submit.disabled = false;
          submit.querySelector('span').textContent = `Bayar ${rupiah(result.booking.amount)}`;
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
