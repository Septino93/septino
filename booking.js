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
  const rupiah = value => `Rp${Number(value || 0).toLocaleString("id-ID")}`;

  function showAlert(message, type) {
    const alertBox = document.getElementById("bookingAlert");
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `booking-alert is-visible ${type || ""}`;
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
    const message = `Halo Septino, saya sudah mendaftar konsultasi.\n\nNama: ${values.name}\nLayanan: ${values.serviceName}\nStatus: Menunggu penjadwalan\nNomor Konsultasi: ${consultation.consultationNumber || "-"}\n\nMohon dibantu untuk proses selanjutnya.`;
    return `https://wa.me/${config.whatsappNumber || "628116946999"}?text=${encodeURIComponent(message)}`;
  }

  function rememberConsultation(result, values) {
    sessionStorage.setItem("septinoLastConsultation", JSON.stringify({
      consultationNumber: result.booking.consultationNumber,
      publicToken: result.booking.publicToken,
      email: values.email,
      whatsapp: values.whatsapp
    }));
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) window.lucide.createIcons();

    const params = new URLSearchParams(location.search);
    const service = params.get("service") || "konsultasi-umum";
    const serviceName = SERVICE_MAP[service] || "Konsultasi";
    const config = window.SEPTINO_APP_CONFIG || window.CF_CONFIG || {};
    const directPrice = Number(config.directPaidServices?.[service] || 0);

    const serviceNameEl = document.getElementById("serviceName");
    const bookingBack = document.getElementById("bookingBack");
    const paymentSummary = document.getElementById("paymentSummary");
    const servicePrice = document.getElementById("servicePrice");
    const paymentTotal = document.getElementById("paymentTotal");
    const submitText = document.querySelector("#submitBooking span");

    if (serviceNameEl) serviceNameEl.textContent = serviceName;
    if (bookingBack) bookingBack.href = service === "konsultasi-umum" ? "konsultasi.html" : `${service}.html`;

    if (directPrice > 0) {
      paymentSummary.hidden = false;
      servicePrice.textContent = rupiah(directPrice);
      paymentTotal.textContent = rupiah(directPrice);
      submitText.textContent = `Lanjut Pembayaran ${rupiah(directPrice)}`;
    } else {
      paymentSummary.hidden = true;
      submitText.textContent = "Daftar Konsultasi";
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
      const defaultButtonText = directPrice > 0
        ? `Lanjut Pembayaran ${rupiah(directPrice)}`
        : "Daftar Konsultasi";

      const values = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        whatsapp: form.elements.whatsapp.value.trim(),
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
      if (!window.SeptinoBookingService || window.SeptinoBookingService.normalizePhone(values.whatsapp).length < 10) {
        showAlert("Nomor WhatsApp belum benar.", "error");
        return;
      }

      submit.disabled = true;
      submit.querySelector("span").textContent = "Memproses...";

      try {
        const result = await window.SeptinoBookingService.createBooking(values);

        // RPC lama dapat mengembalikan amount 0. Untuk layanan berbayar,
        // gunakan harga dari config agar alur transfer tetap berjalan.
        if (directPrice > 0 && Number(result.booking.amount || 0) <= 0) {
          result.booking.amount = directPrice;
          result.booking.method = "paid";
          result.booking.paymentStatus = result.booking.paymentStatus || "pending";
        }

        sessionStorage.removeItem(SIM_KEY);
        rememberConsultation(result, values);

        if (directPrice > 0 || result.booking.method === "paid" || Number(result.booking.amount) > 0) {
          const payableAmount = Number(result.booking.amount || directPrice || 0);
          showAlert(`Pendaftaran berhasil. Membuka instruksi transfer ${rupiah(payableAmount)}...`, "success");
          const q = new URLSearchParams({
            consultation: result.booking.consultationNumber || "",
            token: result.booking.publicToken || "",
            name: values.name,
            service: values.serviceName,
            amount: String(payableAmount)
          });
          setTimeout(() => { location.href = `pembayaran-transfer.html?${q.toString()}`; }, 600);
          return;
        }

        showAlert(`Pendaftaran berhasil. Nomor Konsultasi: ${result.booking.consultationNumber}`, "success");
        setTimeout(() => { location.href = buildWhatsApp(result, values); }, 900);
      } catch (error) {
        console.error("Booking error:", error);
        showAlert(error?.message || "Pendaftaran gagal disimpan. Silakan coba kembali.", "error");
        submit.disabled = false;
        submit.querySelector("span").textContent = defaultButtonText;
      }
    });
  });
})();
