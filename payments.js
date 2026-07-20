let paymentRows=[];
let paymentClients=[];

const paymentEls = {};

function cachePaymentElements(){
 paymentEls.filter=document.getElementById('paymentFilter');
 paymentEls.list=document.getElementById('paymentList');
 paymentEls.openBtn=document.getElementById('openPaymentModal');
 paymentEls.modal=document.getElementById('paymentAddModal');
 paymentEls.backdrop=document.getElementById('paymentModalBackdrop');
 paymentEls.closeBtn=document.getElementById('closePaymentModal');
 paymentEls.cancelBtn=document.getElementById('cancelPaymentModal');
 paymentEls.form=document.getElementById('manualPaymentForm');
 paymentEls.client=document.getElementById('manualPaymentClient');
 paymentEls.name=document.getElementById('manualPaymentName');
 paymentEls.amount=document.getElementById('manualPaymentAmount');
 paymentEls.notes=document.getElementById('manualPaymentNotes');
 paymentEls.saveBtn=document.getElementById('saveManualPaymentBtn');
}

async function initPayments(){
 if(!(await protectPage()))return;
 cachePaymentElements();
 if(!paymentEls.openBtn||!paymentEls.modal||!paymentEls.form){
  console.error('Elemen modal pembayaran tidak lengkap.');
  return;
 }
 paymentEls.filter?.addEventListener('change',renderPayments);
 bindPaymentModal();
 await Promise.all([loadPaymentClients(),renderPayments()]);
}
async function loadPaymentClients(){
 paymentClients=await api.listClients('');
 paymentEls.client.innerHTML='<option value="">Pilih client</option>'+paymentClients.filter(c=>c.is_active!==false).map(c=>`<option value="${esc(c.id)}">${esc(c.full_name)} · ${esc(c.whatsapp||c.email||'-')}</option>`).join('');
}
function showPaymentModal(){paymentEls.modal.hidden=false;paymentEls.modal.setAttribute('aria-hidden','false');document.body.classList.add('client-modal-open');requestAnimationFrame(()=>paymentEls.modal.classList.add('is-open'));setTimeout(()=>paymentEls.client?.focus(),180)}
function hidePaymentModal(){paymentEls.modal.classList.remove('is-open');document.body.classList.remove('client-modal-open');setTimeout(()=>{paymentEls.modal.hidden=true;paymentEls.modal.setAttribute('aria-hidden','true')},240)}
function bindPaymentModal(){
 paymentEls.openBtn.addEventListener('click',showPaymentModal);
 paymentEls.closeBtn?.addEventListener('click',hidePaymentModal);
 paymentEls.cancelBtn?.addEventListener('click',hidePaymentModal);
 paymentEls.backdrop?.addEventListener('click',hidePaymentModal);
 paymentEls.form.addEventListener('submit',createManualPayment);
}
async function createManualPayment(event){
 event.preventDefault();
 const button=paymentEls.saveBtn;
 button.disabled=true;button.textContent='Membuat...';
 try{
  const result=await api.createManualPayment({clientId:paymentEls.client.value,title:paymentEls.name.value,amount:paymentEls.amount.value,notes:paymentEls.notes.value});
  paymentEls.form.reset();hidePaymentModal();await renderPayments();
  const client=result.client||{};
  const msg=`Halo ${client.full_name||''}, berikut tagihan ${result.consultation.service_name_snapshot} sebesar ${rupiah(result.consultation.amount)}.\n\nKode layanan: ${result.consultation.consultation_no}\nBuka link berikut, masukkan kode layanan serta email/WhatsApp Anda, lalu tekan Bayar Sekarang:\n${result.paymentUrl}`;
  const wa=normalizePhone(client.whatsapp||'');
  const action=confirm(`Tagihan berhasil dibuat.\n\nKode: ${result.consultation.consultation_no}\nNominal: ${rupiah(result.consultation.amount)}\n\nBuka WhatsApp client sekarang?`);
  if(action&&wa)window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`,'_blank','noopener');
  else{await navigator.clipboard?.writeText(msg);alert('Pesan tagihan sudah disiapkan. Salin link dari kartu pembayaran bila diperlukan.');}
 }catch(err){alert(err.message)}finally{button.disabled=false;button.textContent='Buat Tagihan'}
}
async function setPayment(id,status){try{await api.updatePayment(id,status);await renderPayments()}catch(err){alert(err.message)}}
function paymentDate(p){const value=p.status==='paid'?(p.paid_at||p.updated_at||p.created_at):(p.created_at||p.updated_at);return fmtDate(value)}
function getPaymentByKey(key){return paymentRows.find(p=>String(p.id)===String(key))}
function downloadInvoice(key){const p=getPaymentByKey(key);if(!p)return alert('Data pembayaran tidak ditemukan.');try{window.cfDocuments.downloadInvoice(p)}catch(err){alert(err.message)}}
function downloadReceipt(key){const p=getPaymentByKey(key);if(!p)return alert('Data pembayaran tidak ditemukan.');try{window.cfDocuments.downloadReceipt(p)}catch(err){alert(err.message)}}
async function copyPaymentLink(number){const url=`https://septino.id/status-konsultasi.html?consultation=${encodeURIComponent(number)}`;try{await navigator.clipboard.writeText(url);alert('Link pembayaran berhasil disalin.')}catch(_){prompt('Salin link pembayaran:',url)}}
async function sendPaymentWhatsApp(key){const p=getPaymentByKey(key);if(!p)return;const client=p.consultations?.clients||{};const phone=normalizePhone(client.whatsapp||'');if(!phone)return alert('Nomor WhatsApp client tidak tersedia.');const number=p.invoice_no||p.consultations?.consultation_no||'-';const service=p.consultations?.service_name_snapshot||'Tagihan';const url=`https://septino.id/status-konsultasi.html?consultation=${encodeURIComponent(number)}`;const msg=`Halo ${client.full_name||''}, berikut tagihan ${service} sebesar ${rupiah(p.amount)}.\n\nKode layanan: ${number}\nBuka link berikut, masukkan kode layanan serta email/WhatsApp Anda, lalu tekan Bayar Sekarang:\n${url}`;window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,'_blank','noopener')}
async function renderPayments(){
 try{
  paymentRows=await api.listPayments(paymentEls.filter?.value||'');
  paymentEls.list.innerHTML=paymentRows.map(p=>{
   const clientObj=p.consultations?.clients||{};const client=clientObj.full_name||'Client';const service=p.consultations?.service_name_snapshot||'Konsultasi';const number=p.invoice_no||p.consultations?.consultation_no||'-';const provider=p.provider==='midtrans'?'Midtrans':(p.provider||'-');
   const controls=p.is_virtual?'<span class="badge blue">Sinkron dari transaksi</span>':`<button class="btn btn-primary" onclick="setPayment('${p.id}','paid')">Tandai Lunas</button><button class="btn btn-danger" onclick="setPayment('${p.id}','failed')">Gagal</button>`;
   const documentButtons=`<button class="payment-action payment-action-secondary" onclick="downloadInvoice('${p.id}')"><i data-lucide="file-text"></i><span>Invoice PDF</span></button>${p.status==='paid'?`<button class="payment-action payment-action-primary" onclick="downloadReceipt('${p.id}')"><i data-lucide="badge-check"></i><span>Receipt PDF</span></button>`:''}`;
   return `<article class="list-card payment-card"><div class="row"><div><h3>${esc(number)}</h3><p>${esc(client)} · ${esc(service)}<br>${paymentDate(p)} · ${esc(provider)}</p></div><span class="badge ${badgeClass(p.status)}">${statusLabel(p.status)}</span></div><h3 style="margin-top:12px">${rupiah(p.amount)}</h3><div class="actions payment-card-actions"><a class="payment-action payment-action-secondary" href="client-detail.html?id=${encodeURIComponent(p.consultations?.client_id||'')}"><i data-lucide="user-round"></i><span>Client</span></a>${documentButtons}<button class="payment-action payment-action-secondary" onclick="copyPaymentLink('${esc(number)}')"><i data-lucide="link"></i><span>Salin Link</span></button>${clientObj.whatsapp?`<button class="payment-action payment-action-primary" onclick="sendPaymentWhatsApp('${p.id}')"><i data-lucide="message-circle"></i><span>Kirim WA</span></button>`:''}${controls}</div></article>`;
  }).join('')||'<div class="empty"><strong>Belum ada pembayaran</strong>Klik Tambah untuk membuat tagihan manual.</div>';
  if(window.lucide)lucide.createIcons();
 }catch(err){paymentEls.list.innerHTML=`<div class="empty"><strong>Gagal memuat</strong>${esc(err.message)}</div>`}
}
document.addEventListener('DOMContentLoaded',initPayments);