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
    // Supabase RPC dengan RETURNS TABLE mengembalikan array.
    // Ambil baris pertama agar struktur hasil konsisten.
    const root = Array.isArray(data) ? data[0] : data;

    if (!root || root.ok === false) {
      throw new Error(root?.message || "Pendaftaran gagal disimpan.");
    }

    // Mendukung respons berbentuk objek nested maupun baris langsung dari RPC.
    const item = root.consultation || root.booking || root;
    const amount = Number(item.amount || 0);

    return {
      ok: true,
      mode: "supabase",
      client: root.client || null,
      payment: root.payment || null,
      remainingCredit:
        root.remainingCredit ??
        root.remaining_credit ??
        item.remainingCredit ??
        item.remaining_credit ??
        null,
      booking: {
        id: item.id,
        publicToken: item.publicToken || item.public_token || root.publicToken || root.public_token,
        consultationNumber:
          item.consultationNumber ||
          item.consultation_number ||
          item.consultation_no,
        clientId: item.clientId || item.client_id,
        clientName: item.clientName || item.client_name,
        service: item.service || item.service_slug,
        serviceName: item.serviceName || item.service_name,
        // RPC saat ini tidak mengembalikan method; tentukan dari nominal.
        method: item.method || (amount > 0 ? "paid" : "free"),
        amount,
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

    const responseData = await callRpc("check_consultation_status", {
      p_consultation_no: number,
      p_identity: identity.includes("@") ? identity.toLowerCase() : normalizePhone(identity)
    });

    // RETURNS TABLE dari Supabase RPC dapat mengembalikan array.
    const data = Array.isArray(responseData) ? responseData[0] : responseData;
    if (!data || data.found === false) return null;

    const item = data.consultation || data;
    return {
      consultation: {
        id: item.id || item.consultation_id,
        consultationNumber:
          item.consultationNumber ||
          item.consultation_number ||
          item.consultation_no ||
          number,
        clientName:
          item.clientName ||
          item.client_name ||
          item.full_name ||
          "-",
        serviceName:
          item.serviceName ||
          item.service_name ||
          item.service_name_snapshot ||
          "-",
        status:
          item.status ||
          item.consultation_status ||
          "waiting_schedule",
        paymentStatus:
          item.paymentStatus ||
          item.payment_status ||
          "not_required",
        amount: Number(item.amount || 0),
        createdAt:
          item.createdAt ||
          item.created_at ||
          null
      },
      payment: data.payment || null
    };
  }

  window.SeptinoBookingService = { createBooking, findConsultation, normalizePhone };
})();
