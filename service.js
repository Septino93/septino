(() => {
  "use strict";

  const config = window.SEPTINO_APP_CONFIG || {};

  function normalizePhone(value) {
    let phone = String(value || "").replace(/\D/g, "");
    if (phone.startsWith("0")) phone = `62${phone.slice(1)}`;
    if (phone.startsWith("8")) phone = `62${phone}`;
    return phone;
  }

  function getSupabaseConfig() {
    const url = String(config.supabaseUrl || "").replace(/\/$/, "");
    const key = String(config.supabasePublishableKey || "").trim();
    if (!url || !key) throw new Error("Koneksi Supabase belum dikonfigurasi.");
    return { url, key };
  }

  async function callRpc(functionName, payload) {
    const { url, key } = getSupabaseConfig();
    let response;
    try {
      response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch (_) {
      throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.");
    }

    const raw = await response.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch (_) { data = raw; }

    if (!response.ok) {
      const message = data?.message || data?.hint || data?.details || "Permintaan ke server gagal.";
      throw new Error(message);
    }
    return data;
  }

  function toBookingResult(data) {
    if (!data || data.ok === false) throw new Error(data?.message || "Pendaftaran gagal disimpan.");
    const item = data.consultation || data.booking || {};
    return {
      ok: true,
      mode: "supabase",
      client: data.client || null,
      payment: data.payment || null,
      remainingCredit: data.remainingCredit ?? data.remaining_credit ?? null,
      booking: {
        id: item.id,
        consultationNumber: item.consultationNumber || item.consultation_number || item.consultation_no,
        clientId: item.clientId || item.client_id,
        clientName: item.clientName || item.client_name,
        service: item.service || item.service_slug,
        serviceName: item.serviceName || item.service_name,
        method: item.method,
        amount: Number(item.amount || 0),
        paymentStatus: item.paymentStatus || item.payment_status,
        status: item.status || item.consultation_status,
        createdAt: item.createdAt || item.created_at
      }
    };
  }

  async function createBooking(payload) {
    const cleaned = {
      p_name: String(payload.name || "").trim(),
      p_email: String(payload.email || "").trim().toLowerCase(),
      p_whatsapp: normalizePhone(payload.whatsapp),
      p_service_slug: String(payload.service || "konsultasi-umum").trim(),
      p_service_name: String(payload.serviceName || "Konsultasi").trim(),
      p_simulation_summary: String(payload.simulationSummary || "").trim()
    };
    return toBookingResult(await callRpc("register_consultation", cleaned));
  }

  async function findConsultation(consultationNumberValue, identityValue) {
    const number = String(consultationNumberValue || "").trim().toUpperCase();
    const identity = String(identityValue || "").trim();
    if (!number || !identity) return null;

    const responseData = await callRpc("check_consultation_status", {
      p_consultation_no: number,
      p_identity: identity.includes("@") ? identity.toLowerCase() : normalizePhone(identity)
    });

    // RPC PostgreSQL dapat mengembalikan object JSON atau array hasil RETURNS TABLE.
    const data = Array.isArray(responseData) ? responseData[0] : responseData;
    if (!data || data.found === false) return null;

    const nested = data.consultation || data.booking || null;
    const item = Array.isArray(nested) ? nested[0] : (nested || data);
    if (!item) return null;

    return {
      consultation: {
        id: item.id ?? item.consultation_id ?? null,
        consultationNumber:
          item.consultationNumber ??
          item.consultation_number ??
          item.consultation_no ??
          item.nomor_konsultasi ??
          number,
        clientName:
          item.clientName ??
          item.client_name ??
          item.full_name ??
          item.name ??
          item.nama ??
          "-",
        serviceName:
          item.serviceName ??
          item.service_name ??
          item.service_name_snapshot ??
          item.service ??
          item.layanan ??
          "-",
        status:
          item.status ??
          item.consultation_status ??
          item.status_konsultasi ??
          "waiting_schedule",
        paymentStatus:
          item.paymentStatus ??
          item.payment_status ??
          item.status_pembayaran ??
          "not_required",
        amount: Number(
          item.amount ??
          item.price ??
          item.biaya ??
          0
        ),
        createdAt:
          item.createdAt ??
          item.created_at ??
          item.registration_date ??
          item.tanggal_pendaftaran ??
          null
      },
      payment: data.payment || null
    };
  }

  window.SeptinoBookingService = { createBooking, findConsultation, normalizePhone };
})();
