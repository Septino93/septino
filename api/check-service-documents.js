const { json, allowPost, readJson, supabaseRequest, normalizePhone, getEnv } = require("./_helpers");

function normalizeIdentity(value) {
  const text = String(value || "").trim();
  return text.includes("@") ? text.toLowerCase() : normalizePhone(text);
}
function safeMeta(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch (_) { return {}; }
}
async function signStoragePath(path) {
  const baseUrl = getEnv("SUPABASE_URL").replace(/\/$/, "");
  const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const encodedPath = String(path).split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${baseUrl}/storage/v1/object/sign/client-documents/${encodedPath}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 600 })
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.signedURL) throw new Error("Tautan dokumen tidak dapat dibuat.");
  return `${baseUrl}/storage/v1${data.signedURL}`;
}
module.exports = async function handler(req, res) {
  if (!allowPost(req, res)) return;
  try {
    const body = await readJson(req);
    const number = String(body.consultationNumber || "").trim().toUpperCase();
    const identity = normalizeIdentity(body.identity);
    if (!number || !identity) return json(res, 400, { ok:false, message:"Kode layanan dan identitas wajib diisi." });

    const rows = await supabaseRequest(
      `consultations?select=id,client_id,consultation_no,clients!inner(email,whatsapp_normalized)&consultation_no=eq.${encodeURIComponent(number)}&limit=1`
    );
    const consultation = Array.isArray(rows) ? rows[0] : null;
    if (!consultation) return json(res, 404, { ok:false, message:"Data layanan tidak ditemukan." });

    const client = consultation.clients || {};
    const matches = identity.includes("@")
      ? String(client.email || "").toLowerCase() === identity
      : normalizePhone(client.whatsapp_normalized || "") === identity;
    if (!matches) return json(res, 404, { ok:false, message:"Data layanan tidak ditemukan." });

    const logs = await supabaseRequest(
      `activity_logs?select=id,metadata,created_at&client_id=eq.${encodeURIComponent(consultation.client_id)}&consultation_id=eq.${encodeURIComponent(consultation.id)}&event_type=eq.document_uploaded&order=created_at.desc`
    );

    const documents = [];
    for (const row of Array.isArray(logs) ? logs : []) {
      const meta = safeMeta(row.metadata);
      if (meta.public_for_client !== true || !meta.path) continue;
      documents.push({
        id: row.id,
        title: meta.title || meta.filename || "Dokumen Konsultasi",
        category: meta.category || "Laporan",
        filename: meta.filename || "",
        downloadUrl: await signStoragePath(meta.path)
      });
    }
    return json(res, 200, { ok:true, documents });
  } catch (error) {
    console.error(error);
    return json(res, 500, { ok:false, message:error.message || "Dokumen gagal dimuat." });
  }
};
