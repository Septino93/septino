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
  const order = String(payload.order_id || '');
  const match = order.match(/^CF-(.+)-(\d{13})$/);
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

    const rows = await supabaseRequest(
      `consultations?consultation_no=eq.${encodeURIComponent(consultationNumber)}&select=id,client_id,amount,payment_status&limit=1`,
      { method: 'GET' }
    );
    const consultation = Array.isArray(rows) ? rows[0] : null;
    if (!consultation) return json(res, 404, { ok: false, message: 'Konsultasi tidak ditemukan.' });

    const expectedAmount = Math.round(Number(consultation.amount || 0));
    const notifiedAmount = Math.round(Number(payload.gross_amount || 0));
    if (!expectedAmount || expectedAmount !== notifiedAmount) {
      return json(res, 400, { ok: false, message: 'Nominal notifikasi tidak sesuai.' });
    }

    const state = paymentState(payload);
    const consultationStatus = state === 'paid' ? 'waiting_schedule' : 'waiting_payment';

    // Idempotent: notifikasi berulang tidak menurunkan transaksi yang sudah paid.
    if (consultation.payment_status !== 'paid' || state === 'paid') {
      await supabaseRequest(`consultations?id=eq.${encodeURIComponent(consultation.id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ payment_status: state, consultation_status: consultationStatus })
      });
    }

    await supabaseRequest('activity_logs', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        client_id: consultation.client_id,
        consultation_id: consultation.id,
        event_type: 'midtrans_notification',
        description: state === 'paid' ? 'Pembayaran Midtrans berhasil' : `Status pembayaran Midtrans: ${state}`,
        metadata: {
          provider: 'midtrans',
          environment: 'sandbox',
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
