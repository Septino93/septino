const {
  json,
  allowPost,
  getEnv,
  readJson,
  supabaseRequest,
  verifyMidtransSignature
} = require('./_helpers');

function paymentState(payload) {
  const status = String(payload.transaction_status || '').toLowerCase();
  const fraud = String(payload.fraud_status || '').toLowerCase();
  if (status === 'settlement' || (status === 'capture' && fraud === 'accept')) return 'paid';
  if (['deny', 'cancel', 'expire', 'failure'].includes(status)) return 'failed';
  return 'pending';
}

function consultationNoFromPayload(payload) {
  if (payload.custom_field1) return String(payload.custom_field1).trim().toUpperCase();
  const match = String(payload.order_id || '').match(/^PAY-(.+)-(\d{13})$/);
  return match ? match[1].toUpperCase() : '';
}

module.exports = async function handler(req, res) {
  if (!allowPost(req, res)) return;

  try {
    const payload = await readJson(req);
    const serverKey = getEnv('MIDTRANS_SERVER_KEY');
    if (!verifyMidtransSignature(payload, serverKey)) {
      return json(res, 401, { ok: false, message: 'Signature Midtrans tidak valid.' });
    }

    const consultationNumber = consultationNoFromPayload(payload);
    if (!consultationNumber) return json(res, 400, { ok: false, message: 'Nomor konsultasi tidak ditemukan.' });

    const consultations = await supabaseRequest(
      `consultations?consultation_no=eq.${encodeURIComponent(consultationNumber)}&select=id,client_id,consultation_status&limit=1`,
      { method: 'GET' }
    );
    const consultation = Array.isArray(consultations) ? consultations[0] : null;
    if (!consultation) return json(res, 404, { ok: false, message: 'Konsultasi tidak ditemukan.' });

    const state = paymentState(payload);
    const consultationStatus = state === 'paid' ? 'waiting_schedule' : 'waiting_payment';
    const now = new Date().toISOString();

    await supabaseRequest(`consultations?id=eq.${encodeURIComponent(consultation.id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        payment_status: state,
        consultation_status: consultationStatus
      })
    });

    const payments = await supabaseRequest(
      `payments?consultation_id=eq.${encodeURIComponent(consultation.id)}&select=id&order=created_at.desc&limit=1`,
      { method: 'GET' }
    );
    const payment = Array.isArray(payments) ? payments[0] : null;
    if (payment) {
      await supabaseRequest(`payments?id=eq.${encodeURIComponent(payment.id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          status: state,
          paid_at: state === 'paid' ? now : null
        })
      });
    }

    await supabaseRequest('activity_logs', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        client_id: consultation.client_id,
        consultation_id: consultation.id,
        payment_id: payment?.id || null,
        event_type: 'midtrans_notification',
        description: state === 'paid' ? 'Pembayaran Midtrans berhasil' : `Status pembayaran Midtrans: ${state}`,
        metadata: {
          provider: 'midtrans',
          order_id: payload.order_id,
          transaction_id: payload.transaction_id,
          transaction_status: payload.transaction_status,
          payment_type: payload.payment_type,
          gross_amount: payload.gross_amount
        }
      })
    });

    return json(res, 200, { ok: true, state });
  } catch (error) {
    console.error('midtrans-notification:', error);
    return json(res, 500, { ok: false, message: error.message || 'Notifikasi gagal diproses.' });
  }
};
