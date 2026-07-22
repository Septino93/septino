-- Jalankan sekali di Supabase SQL Editor
-- Membuat bucket private untuk bukti pembayaran dan dokumen client.

insert into storage.buckets (id, name, public, file_size_limit)
values ('client-documents', 'client-documents', false, 10485760)
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit;

-- Admin/authenticated user dapat melihat file.
drop policy if exists "Authenticated can read client documents" on storage.objects;
create policy "Authenticated can read client documents"
on storage.objects for select
to authenticated
using (bucket_id = 'client-documents');

-- Admin/authenticated user dapat upload/update/delete dokumen dari CRM.
drop policy if exists "Authenticated can insert client documents" on storage.objects;
create policy "Authenticated can insert client documents"
on storage.objects for insert
to authenticated
with check (bucket_id = 'client-documents');

drop policy if exists "Authenticated can update client documents" on storage.objects;
create policy "Authenticated can update client documents"
on storage.objects for update
to authenticated
using (bucket_id = 'client-documents')
with check (bucket_id = 'client-documents');

drop policy if exists "Authenticated can delete client documents" on storage.objects;
create policy "Authenticated can delete client documents"
on storage.objects for delete
to authenticated
using (bucket_id = 'client-documents');

select id, name, public, file_size_limit
from storage.buckets
where id = 'client-documents';
