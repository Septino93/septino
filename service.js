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
    const basePayload = {
      p_full_name: String(payload.name || "").trim(),
      p_email: String(payload.email || "").trim().toLowerCase(),
      p_whatsapp: normalizePhone(payload.whatsapp),
      p_service_slug: String(payload.service || "konsultasi-umum").trim()
    };

    const simulationSummary = String(payload.simulationSummary || "").trim();

    // Phase 2: kirim snapshot hasil simulasi ke RPC baru.
    // Fallback ke RPC v1 menjaga website tetap dapat menerima pendaftaran
    // apabila SQL Phase 2 belum dijalankan.
    if (simulationSummary) {
      try {
        return toBookingResult(await callRpc("register_consultation_v2", {
          ...basePayload,
          p_simulation_summary: simulationSummary
        }));
      } catch (error) {
        const message = String(error?.message || "");
        const functionMissing =
          message.includes("register_consultation_v2") ||
          message.includes("schema cache") ||
          message.includes("Could not find the function");
        if (!functionMissing) throw error;
      }
    }

    return toBookingResult(await callRpc("register_consultation", basePayload));
  }

  async function findConsultation(consultationNumberValue, identityValue) {
    const number = String(consultationNumberValue || "").trim().toUpperCase();
    const identity = String(identityValue || "").trim();
    if (!number || !identity) return null;

    const data = await callRpc("check_consultation_status", {
      p_consultation_no: number,
      p_identity: identity.includes("@") ? identity.toLowerCase() : normalizePhone(identity)
    });
    if (!data || data.found === false) return null;

    const item = data.consultation || data;
    return {
      consultation: {
        id: item.id,
        consultationNumber: item.consultationNumber || item.consultation_number || item.consultation_no,
        clientName: item.clientName || item.client_name,
        serviceName: item.serviceName || item.service_name,
        status: item.status || item.consultation_status,
        paymentStatus: item.paymentStatus || item.payment_status,
        amount: Number(item.amount || 0),
        createdAt: item.createdAt || item.created_at
      },
      payment: data.payment || null
    };
  }

  window.SeptinoBookingService = { createBooking, findConsultation, normalizePhone };
})();
