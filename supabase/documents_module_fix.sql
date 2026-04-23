-- Patch module Documents:
-- 1) autoriser bon_commande dans product_documents.document_type
-- 2) autoriser select/insert pour utilisateurs authentifies sur product_documents
-- 3) autoriser insert authentifie dans les buckets catalogues (technical/safety sheets)

do $$
declare
  constraint_name text;
begin
  select c.conname
    into constraint_name
  from pg_constraint c
  where c.conrelid = 'public.product_documents'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%document_type%';

  if constraint_name is not null then
    execute format('alter table public.product_documents drop constraint %I', constraint_name);
  end if;
end
$$;

alter table public.product_documents
  add constraint product_documents_document_type_check
  check (document_type in ('fiche_technique', 'fiche_securite', 'bon_commande', 'plaquette', 'autre'));

drop policy if exists "catalog_product_documents_read_authenticated" on public.product_documents;
drop policy if exists "catalog_product_documents_admin_insert" on public.product_documents;
drop policy if exists "catalog_product_documents_insert_authenticated" on public.product_documents;

create policy "catalog_product_documents_read_authenticated"
on public.product_documents for select to authenticated
using (
  exists (select 1 from public.products p where p.id = product_documents.product_id and (p.actif = true or public.is_admin()))
);

create policy "catalog_product_documents_insert_authenticated"
on public.product_documents for insert to authenticated
with check (
  exists (select 1 from public.products p where p.id = product_documents.product_id and (p.actif = true or public.is_admin()))
);

drop policy if exists "biolaur_catalog_storage_admin_insert" on storage.objects;
drop policy if exists "biolaur_catalog_storage_insert_authenticated" on storage.objects;

create policy "biolaur_catalog_storage_insert_authenticated"
on storage.objects for insert to authenticated
with check (bucket_id in ('technical-sheets', 'safety-sheets'));
