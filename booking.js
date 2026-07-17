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
      ? `\nStatus: Menunggu pembayaran Rp${Number(consultation.amount || 0).toLocaleString("id-ID")}`
      : `\nStatus: Menunggu penjadwalan\nSisa konsultasi gratis: ${result.remainingCredit ?? "-"}`;
    const message = `Halo Septino, saya sudah mendaftar konsultasi.\n\nNama: ${values.name}\nLayanan: ${values.serviceName}${paymentText}\nNomor Konsultasi: ${consultation.consultationNumber || "-"}\n\nMohon dibantu untuk proses selanjutnya.`;
    return `https://wa.me/${config.whatsappNumber || "628116946999"}?text=${encodeURIComponent(message)}`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) window.lucide.createIcons();

    const params = new URLSearchParams(location.search);
    const service = params.get("service") || "konsultasi-umum";
    const serviceName = SERVICE_MAP[service] || "Konsultasi";
    document.getElementById("serviceName").textContent = serviceName;
    document.getElementById("bookingBack").href = service === "konsultasi-umum" ? "konsultasi.html" : `${service}.html`;

    const simulationSummary = readSimulation(service);
    if (simulationSummary) {
      document.getElementById("simulationText").textContent = simulationSummary;
      document.getElementById("simulationBox").classList.add("is-visible");
    }

    const form = document.getElementById("bookingForm");
    const submit = document.getElementById("submitBooking");

    form.addEventListener("submit", async event => {
      event.preventDefault();
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
      submit.querySelector("span").textContent = "Memproses Pendaftaran...";
      try {
        const result = await window.SeptinoBookingService.createBooking(values);
        sessionStorage.removeItem(SIM_KEY);
        showAlert(`Pendaftaran berhasil. Nomor Konsultasi: ${result.booking.consultationNumber}`, "success");
        sessionStorage.setItem("septinoLastConsultation", JSON.stringify({
          consultationNumber: result.booking.consultationNumber,
          email: values.email,
          whatsapp: values.whatsapp
        }));
        setTimeout(() => { location.href = buildWhatsApp(result, values); }, 1100);
      } catch (error) {
        showAlert(error.message || "Pendaftaran gagal disimpan. Silakan coba kembali.", "error");
        submit.disabled = false;
        submit.querySelector("span").textContent = "Daftar Konsultasi";
      }
    });
  });
})();
