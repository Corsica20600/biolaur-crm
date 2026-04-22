-- Biolaur CRM - verrouillage multi-utilisateur Supabase
-- Executable plusieurs fois. Adapte le schema historique owner_id en ajoutant owner_user_id.
-- Promotion admin manuelle si besoin :
-- update public.profiles set role = 'admin' where email = 'votre-email@domaine.fr';

create extension if not exists pgcrypto;

-- 1) Colonnes owner_user_id manquantes
alter table if exists public.clients add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.prospects_clients add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.client_contacts add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.companies add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.orders add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.order_items add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.commercial_actions add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.documents add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.email_logs add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.email_log_attachments add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.commissions add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade;
alter table if exists public.app_settings add column if not exists owner_user_id uuid references public.profiles(id) on delete cascade;

-- Colonnes d'audit sur catalogue. Le catalogue reste global en lecture, modifiable seulement par admin.
alter table if exists public.products add column if not exists owner_user_id uuid references public.profiles(id) on delete set null;
alter table if exists public.product_categories add column if not exists owner_user_id uuid references public.profiles(id) on delete set null;
alter table if exists public.product_documents add column if not exists owner_user_id uuid references public.profiles(id) on delete set null;
alter table if exists public.price_lists add column if not exists owner_user_id uuid references public.profiles(id) on delete set null;
alter table if exists public.price_list_items add column if not exists owner_user_id uuid references public.profiles(id) on delete set null;
alter table if exists public.email_templates add column if not exists owner_user_id uuid references public.profiles(id) on delete set null;

-- Backfill depuis le schema historique owner_id.
update public.clients set owner_user_id = owner_id where owner_user_id is null and owner_id is not null;
update public.companies set owner_user_id = owner_id where owner_user_id is null and owner_id is not null;
update public.orders set owner_user_id = owner_id where owner_user_id is null and owner_id is not null;
update public.order_items set owner_user_id = owner_id where owner_user_id is null and owner_id is not null;
update public.commercial_actions set owner_user_id = owner_id where owner_user_id is null and owner_id is not null;
update public.documents set owner_user_id = owner_id where owner_user_id is null and owner_id is not null;
update public.email_logs set owner_user_id = owner_id where owner_user_id is null and owner_id is not null;
update public.commissions set owner_user_id = owner_id where owner_user_id is null and owner_id is not null;
update public.app_settings set owner_user_id = owner_id where owner_user_id is null and owner_id is not null;
update public.products set owner_user_id = owner_id where owner_user_id is null and owner_id is not null;
update public.product_categories set owner_user_id = owner_id where owner_user_id is null and owner_id is not null;
update public.price_lists set owner_user_id = owner_id where owner_user_id is null and owner_id is not null;
update public.price_list_items set owner_user_id = owner_id where owner_user_id is null and owner_id is not null;
update public.email_templates set owner_user_id = owner_id where owner_user_id is null and owner_id is not null;

update public.email_log_attachments ela
set owner_user_id = coalesce(el.owner_user_id, el.owner_id)
from public.email_logs el
where ela.email_log_id = el.id
  and ela.owner_user_id is null;

update public.product_documents pd
set owner_user_id = coalesce(p.owner_user_id, p.owner_id)
from public.products p
where pd.product_id = p.id
  and pd.owner_user_id is null;

update public.client_contacts cc
set owner_user_id = pc.owner_user_id
from public.prospects_clients pc
where cc.prospect_client_id = pc.id
  and cc.owner_user_id is null;

-- 2) Helpers de securite
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create or replace function public.set_owner_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_user_id is null then
    new.owner_user_id := auth.uid();
  end if;

  if new.owner_id is null then
    new.owner_id := new.owner_user_id;
  end if;

  if new.owner_user_id is null then
    new.owner_user_id := new.owner_id;
  end if;

  return new;
end;
$$;

create or replace function public.set_email_attachment_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_user_id is null then
    select coalesce(el.owner_user_id, el.owner_id)
    into new.owner_user_id
    from public.email_logs el
    where el.id = new.email_log_id;
  end if;

  if new.owner_user_id is null then
    new.owner_user_id := auth.uid();
  end if;

  return new;
end;
$$;

create or replace function public.set_product_document_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_user_id is null then
    select coalesce(p.owner_user_id, p.owner_id)
    into new.owner_user_id
    from public.products p
    where p.id = new.product_id;
  end if;

  if new.owner_user_id is null then
    new.owner_user_id := auth.uid();
  end if;

  return new;
end;
$$;

create or replace function public.set_owner_user_id_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_user_id is null then
    new.owner_user_id := auth.uid();
  end if;

  return new;
end;
$$;

create or replace function public.set_client_contact_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_user_id is null then
    select pc.owner_user_id
    into new.owner_user_id
    from public.prospects_clients pc
    where pc.id = new.prospect_client_id;
  end if;

  if new.owner_user_id is null then
    new.owner_user_id := auth.uid();
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    'commercial'
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

-- 3) Triggers owner
drop trigger if exists clients_set_owner on public.clients;
create trigger clients_set_owner before insert on public.clients for each row execute function public.set_owner_columns();

drop trigger if exists prospects_clients_set_owner on public.prospects_clients;
create trigger prospects_clients_set_owner before insert on public.prospects_clients for each row execute function public.set_owner_user_id_only();

drop trigger if exists client_contacts_set_owner on public.client_contacts;
create trigger client_contacts_set_owner before insert on public.client_contacts for each row execute function public.set_client_contact_owner();

drop trigger if exists companies_set_owner on public.companies;
create trigger companies_set_owner before insert on public.companies for each row execute function public.set_owner_columns();

drop trigger if exists orders_set_owner on public.orders;
create trigger orders_set_owner before insert on public.orders for each row execute function public.set_owner_columns();

drop trigger if exists order_items_set_owner on public.order_items;
create trigger order_items_set_owner before insert on public.order_items for each row execute function public.set_owner_columns();

drop trigger if exists commercial_actions_set_owner on public.commercial_actions;
create trigger commercial_actions_set_owner before insert on public.commercial_actions for each row execute function public.set_owner_columns();

drop trigger if exists documents_set_owner on public.documents;
create trigger documents_set_owner before insert on public.documents for each row execute function public.set_owner_columns();

drop trigger if exists email_logs_set_owner on public.email_logs;
create trigger email_logs_set_owner before insert on public.email_logs for each row execute function public.set_owner_columns();

drop trigger if exists commissions_set_owner on public.commissions;
create trigger commissions_set_owner before insert on public.commissions for each row execute function public.set_owner_columns();

drop trigger if exists app_settings_set_owner on public.app_settings;
create trigger app_settings_set_owner before insert on public.app_settings for each row execute function public.set_owner_columns();

drop trigger if exists products_set_owner on public.products;
create trigger products_set_owner before insert on public.products for each row execute function public.set_owner_columns();

drop trigger if exists product_categories_set_owner on public.product_categories;
create trigger product_categories_set_owner before insert on public.product_categories for each row execute function public.set_owner_columns();

drop trigger if exists price_lists_set_owner on public.price_lists;
create trigger price_lists_set_owner before insert on public.price_lists for each row execute function public.set_owner_columns();

drop trigger if exists price_list_items_set_owner on public.price_list_items;
create trigger price_list_items_set_owner before insert on public.price_list_items for each row execute function public.set_owner_columns();

drop trigger if exists email_templates_set_owner on public.email_templates;
create trigger email_templates_set_owner before insert on public.email_templates for each row execute function public.set_owner_columns();

drop trigger if exists email_log_attachments_set_owner on public.email_log_attachments;
create trigger email_log_attachments_set_owner before insert on public.email_log_attachments for each row execute function public.set_email_attachment_owner();

drop trigger if exists product_documents_set_owner on public.product_documents;
create trigger product_documents_set_owner before insert on public.product_documents for each row execute function public.set_product_document_owner();

-- 4) Index owner et parents
create index if not exists clients_owner_user_id_idx on public.clients(owner_user_id);
create index if not exists prospects_clients_owner_user_id_idx on public.prospects_clients(owner_user_id);
create index if not exists client_contacts_owner_user_id_idx on public.client_contacts(owner_user_id);
create index if not exists client_contacts_prospect_client_id_idx on public.client_contacts(prospect_client_id);
create index if not exists companies_owner_user_id_idx on public.companies(owner_user_id);
create index if not exists orders_owner_user_id_idx on public.orders(owner_user_id);
create index if not exists order_items_owner_user_id_idx on public.order_items(owner_user_id);
create index if not exists commercial_actions_owner_user_id_idx on public.commercial_actions(owner_user_id);
create index if not exists documents_owner_user_id_idx on public.documents(owner_user_id);
create index if not exists email_logs_owner_user_id_idx on public.email_logs(owner_user_id);
create index if not exists email_log_attachments_owner_user_id_idx on public.email_log_attachments(owner_user_id);
create index if not exists commissions_owner_user_id_idx on public.commissions(owner_user_id);
create index if not exists app_settings_owner_user_id_idx on public.app_settings(owner_user_id);
create index if not exists product_documents_product_id_idx on public.product_documents(product_id);
create index if not exists price_list_items_price_list_id_idx on public.price_list_items(price_list_id);
create index if not exists price_list_items_product_id_idx on public.price_list_items(product_id);

-- 5) RLS
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table if exists public.prospects_clients enable row level security;
alter table if exists public.client_contacts enable row level security;
alter table if exists public.companies enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.commercial_actions enable row level security;
alter table public.documents enable row level security;
alter table public.email_logs enable row level security;
alter table public.email_log_attachments enable row level security;
alter table public.commissions enable row level security;
alter table public.app_settings enable row level security;
alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_documents enable row level security;
alter table public.price_lists enable row level security;
alter table public.price_list_items enable row level security;
alter table public.email_templates enable row level security;

-- Remise a plat des policies sur tables sensibles Biolaur.
do $$
declare
  r record;
  table_names text[] := array[
    'profiles',
    'clients',
    'prospects_clients',
    'client_contacts',
    'companies',
    'orders',
    'order_items',
    'commercial_actions',
    'documents',
    'email_logs',
    'email_log_attachments',
    'commissions',
    'app_settings',
    'products',
    'product_categories',
    'product_documents',
    'price_lists',
    'price_list_items',
    'email_templates'
  ];
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any(table_names)
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Profiles : chaque utilisateur voit/modifie sa ligne, les admins peuvent lire les profils.
create policy "profiles_select_own_or_admin"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profiles_insert_own"
on public.profiles for insert to authenticated
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Tables proprietaires : separation stricte utilisateur.
create policy "clients_owner_select" on public.clients for select to authenticated using (owner_user_id = auth.uid());
create policy "clients_owner_insert" on public.clients for insert to authenticated with check (owner_user_id = auth.uid());
create policy "clients_owner_update" on public.clients for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "clients_owner_delete" on public.clients for delete to authenticated using (owner_user_id = auth.uid());

create policy "prospects_clients_owner_select" on public.prospects_clients for select to authenticated using (owner_user_id = auth.uid());
create policy "prospects_clients_owner_insert" on public.prospects_clients for insert to authenticated with check (owner_user_id = auth.uid());
create policy "prospects_clients_owner_update" on public.prospects_clients for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "prospects_clients_owner_delete" on public.prospects_clients for delete to authenticated using (owner_user_id = auth.uid());

create policy "client_contacts_owner_select" on public.client_contacts for select to authenticated
using (
  owner_user_id = auth.uid()
  and exists (select 1 from public.prospects_clients pc where pc.id = client_contacts.prospect_client_id and pc.owner_user_id = auth.uid())
);
create policy "client_contacts_owner_insert" on public.client_contacts for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and exists (select 1 from public.prospects_clients pc where pc.id = client_contacts.prospect_client_id and pc.owner_user_id = auth.uid())
);
create policy "client_contacts_owner_update" on public.client_contacts for update to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());
create policy "client_contacts_owner_delete" on public.client_contacts for delete to authenticated using (owner_user_id = auth.uid());

create policy "companies_owner_select" on public.companies for select to authenticated using (owner_user_id = auth.uid());
create policy "companies_owner_insert" on public.companies for insert to authenticated with check (owner_user_id = auth.uid());
create policy "companies_owner_update" on public.companies for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "companies_owner_delete" on public.companies for delete to authenticated using (owner_user_id = auth.uid());

create policy "orders_owner_select" on public.orders for select to authenticated using (owner_user_id = auth.uid());
create policy "orders_owner_insert" on public.orders for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1 from public.clients c
    where c.id = orders.client_id
      and c.owner_user_id = auth.uid()
      and c.type_fiche = 'client'
  )
);
create policy "orders_owner_update" on public.orders for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "orders_owner_delete" on public.orders for delete to authenticated using (owner_user_id = auth.uid());

create policy "order_items_owner_select" on public.order_items for select to authenticated
using (
  owner_user_id = auth.uid()
  and exists (select 1 from public.orders o where o.id = order_items.order_id and o.owner_user_id = auth.uid())
);
create policy "order_items_owner_insert" on public.order_items for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and exists (select 1 from public.orders o where o.id = order_items.order_id and o.owner_user_id = auth.uid())
);
create policy "order_items_owner_update" on public.order_items for update to authenticated
using (
  owner_user_id = auth.uid()
  and exists (select 1 from public.orders o where o.id = order_items.order_id and o.owner_user_id = auth.uid())
)
with check (
  owner_user_id = auth.uid()
  and exists (select 1 from public.orders o where o.id = order_items.order_id and o.owner_user_id = auth.uid())
);
create policy "order_items_owner_delete" on public.order_items for delete to authenticated
using (
  owner_user_id = auth.uid()
  and exists (select 1 from public.orders o where o.id = order_items.order_id and o.owner_user_id = auth.uid())
);

create policy "commercial_actions_owner_select" on public.commercial_actions for select to authenticated
using (
  owner_user_id = auth.uid()
  and exists (select 1 from public.clients c where c.id = commercial_actions.client_id and c.owner_user_id = auth.uid())
);
create policy "commercial_actions_owner_insert" on public.commercial_actions for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and exists (select 1 from public.clients c where c.id = commercial_actions.client_id and c.owner_user_id = auth.uid())
);
create policy "commercial_actions_owner_update" on public.commercial_actions for update to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());
create policy "commercial_actions_owner_delete" on public.commercial_actions for delete to authenticated using (owner_user_id = auth.uid());

create policy "documents_owner_select" on public.documents for select to authenticated
using (
  owner_user_id = auth.uid()
  and (client_id is null or exists (select 1 from public.clients c where c.id = documents.client_id and c.owner_user_id = auth.uid()))
  and (order_id is null or exists (select 1 from public.orders o where o.id = documents.order_id and o.owner_user_id = auth.uid()))
);
create policy "documents_owner_insert" on public.documents for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and (client_id is null or exists (select 1 from public.clients c where c.id = documents.client_id and c.owner_user_id = auth.uid()))
  and (order_id is null or exists (select 1 from public.orders o where o.id = documents.order_id and o.owner_user_id = auth.uid()))
);
create policy "documents_owner_update" on public.documents for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "documents_owner_delete" on public.documents for delete to authenticated using (owner_user_id = auth.uid());

create policy "email_logs_owner_select" on public.email_logs for select to authenticated using (owner_user_id = auth.uid());
create policy "email_logs_owner_insert" on public.email_logs for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and (client_id is null or exists (select 1 from public.clients c where c.id = email_logs.client_id and c.owner_user_id = auth.uid()))
  and (order_id is null or exists (select 1 from public.orders o where o.id = email_logs.order_id and o.owner_user_id = auth.uid()))
);
create policy "email_logs_owner_update" on public.email_logs for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "email_logs_owner_delete" on public.email_logs for delete to authenticated using (owner_user_id = auth.uid());

create policy "email_log_attachments_owner_select" on public.email_log_attachments for select to authenticated
using (
  owner_user_id = auth.uid()
  and exists (select 1 from public.email_logs el where el.id = email_log_attachments.email_log_id and el.owner_user_id = auth.uid())
);
create policy "email_log_attachments_owner_insert" on public.email_log_attachments for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and exists (select 1 from public.email_logs el where el.id = email_log_attachments.email_log_id and el.owner_user_id = auth.uid())
);
create policy "email_log_attachments_owner_delete" on public.email_log_attachments for delete to authenticated
using (
  owner_user_id = auth.uid()
  and exists (select 1 from public.email_logs el where el.id = email_log_attachments.email_log_id and el.owner_user_id = auth.uid())
);

create policy "commissions_owner_select" on public.commissions for select to authenticated using (owner_user_id = auth.uid());
create policy "commissions_owner_insert" on public.commissions for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and exists (select 1 from public.orders o where o.id = commissions.order_id and o.owner_user_id = auth.uid())
);
create policy "commissions_owner_update" on public.commissions for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "commissions_owner_delete" on public.commissions for delete to authenticated using (owner_user_id = auth.uid());

create policy "app_settings_owner_select" on public.app_settings for select to authenticated using (owner_user_id = auth.uid());
create policy "app_settings_owner_insert" on public.app_settings for insert to authenticated with check (owner_user_id = auth.uid());
create policy "app_settings_owner_update" on public.app_settings for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "app_settings_owner_delete" on public.app_settings for delete to authenticated using (owner_user_id = auth.uid());

-- Catalogue : lecture pour utilisateurs authentifies, modification par admin uniquement.
create policy "catalog_categories_read_authenticated" on public.product_categories for select to authenticated using (true);
create policy "catalog_categories_admin_insert" on public.product_categories for insert to authenticated with check (public.is_admin());
create policy "catalog_categories_admin_update" on public.product_categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "catalog_categories_admin_delete" on public.product_categories for delete to authenticated using (public.is_admin());

create policy "catalog_products_read_authenticated" on public.products for select to authenticated using (actif = true or public.is_admin());
create policy "catalog_products_admin_insert" on public.products for insert to authenticated with check (public.is_admin());
create policy "catalog_products_admin_update" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "catalog_products_admin_delete" on public.products for delete to authenticated using (public.is_admin());

create policy "catalog_product_documents_read_authenticated" on public.product_documents for select to authenticated
using (
  exists (select 1 from public.products p where p.id = product_documents.product_id and (p.actif = true or public.is_admin()))
);
create policy "catalog_product_documents_admin_insert" on public.product_documents for insert to authenticated with check (public.is_admin());
create policy "catalog_product_documents_admin_update" on public.product_documents for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "catalog_product_documents_admin_delete" on public.product_documents for delete to authenticated using (public.is_admin());

create policy "catalog_price_lists_read_authenticated" on public.price_lists for select to authenticated using (active = true or public.is_admin());
create policy "catalog_price_lists_admin_insert" on public.price_lists for insert to authenticated with check (public.is_admin());
create policy "catalog_price_lists_admin_update" on public.price_lists for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "catalog_price_lists_admin_delete" on public.price_lists for delete to authenticated using (public.is_admin());

create policy "catalog_price_items_read_authenticated" on public.price_list_items for select to authenticated
using (
  exists (select 1 from public.price_lists pl where pl.id = price_list_items.price_list_id and (pl.active = true or public.is_admin()))
);
create policy "catalog_price_items_admin_insert" on public.price_list_items for insert to authenticated with check (public.is_admin());
create policy "catalog_price_items_admin_update" on public.price_list_items for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "catalog_price_items_admin_delete" on public.price_list_items for delete to authenticated using (public.is_admin());

-- Templates email : visibles par les utilisateurs connectes, maintenus par admin.
create policy "email_templates_read_authenticated" on public.email_templates for select to authenticated using (true);
create policy "email_templates_admin_insert" on public.email_templates for insert to authenticated with check (public.is_admin());
create policy "email_templates_admin_update" on public.email_templates for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "email_templates_admin_delete" on public.email_templates for delete to authenticated using (public.is_admin());

-- 6) Storage : buckets prives, lecture catalogue pour authentifies, ecriture catalogue admin,
-- documents client/commande confines au prefixe auth.uid()/...
insert into storage.buckets (id, name, public)
values
  ('technical-sheets', 'technical-sheets', false),
  ('safety-sheets', 'safety-sheets', false),
  ('order-pdfs', 'order-pdfs', false),
  ('client-documents', 'client-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "biolaur_catalog_storage_read_authenticated" on storage.objects;
drop policy if exists "biolaur_catalog_storage_admin_insert" on storage.objects;
drop policy if exists "biolaur_catalog_storage_admin_update" on storage.objects;
drop policy if exists "biolaur_catalog_storage_admin_delete" on storage.objects;
drop policy if exists "biolaur_owned_storage_read" on storage.objects;
drop policy if exists "biolaur_owned_storage_insert" on storage.objects;
drop policy if exists "biolaur_owned_storage_update" on storage.objects;
drop policy if exists "biolaur_owned_storage_delete" on storage.objects;

create policy "biolaur_catalog_storage_read_authenticated"
on storage.objects for select to authenticated
using (bucket_id in ('technical-sheets', 'safety-sheets'));

create policy "biolaur_catalog_storage_admin_insert"
on storage.objects for insert to authenticated
with check (bucket_id in ('technical-sheets', 'safety-sheets') and public.is_admin());

create policy "biolaur_catalog_storage_admin_update"
on storage.objects for update to authenticated
using (bucket_id in ('technical-sheets', 'safety-sheets') and public.is_admin())
with check (bucket_id in ('technical-sheets', 'safety-sheets') and public.is_admin());

create policy "biolaur_catalog_storage_admin_delete"
on storage.objects for delete to authenticated
using (bucket_id in ('technical-sheets', 'safety-sheets') and public.is_admin());

create policy "biolaur_owned_storage_read"
on storage.objects for select to authenticated
using (
  bucket_id in ('order-pdfs', 'client-documents')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "biolaur_owned_storage_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('order-pdfs', 'client-documents')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "biolaur_owned_storage_update"
on storage.objects for update to authenticated
using (
  bucket_id in ('order-pdfs', 'client-documents')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('order-pdfs', 'client-documents')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "biolaur_owned_storage_delete"
on storage.objects for delete to authenticated
using (
  bucket_id in ('order-pdfs', 'client-documents')
  and (storage.foldername(name))[1] = auth.uid()::text
);
