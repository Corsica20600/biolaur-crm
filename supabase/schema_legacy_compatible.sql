-- Biolaur CRM - Legacy compatible schema patch
-- Purpose: apply safely on an existing/legacy Supabase database without failing
-- when legacy column names are present (nom_produit, numero_commande, prix_ht, etc.).

create extension if not exists "pgcrypto";
set check_function_bodies = off;

-- ==================================================
-- Core tables (create if missing)
-- ==================================================

create table if not exists public.prospects_clients (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id) on delete cascade,
  record_type text not null check (record_type in ('prospect','client')),
  company_name text not null,
  trade_name text,
  client_type text check (client_type in ('CHR','collectivite','commerce_de_bouche','autre')),
  commercial_status text check (commercial_status in ('a_prospecter','en_cours','relance','gagne','perdu','actif','inactif')),
  siret text,
  vat_number text,
  contact_first_name text,
  contact_last_name text,
  contact_job_title text,
  phone text,
  mobile text,
  email text,
  address_line_1 text,
  address_line_2 text,
  postal_code text,
  city text,
  country text default 'France',
  geographic_sector text,
  notes text,
  source text,
  last_interaction_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  prospect_client_id uuid not null references public.prospects_clients(id) on delete cascade,
  first_name text,
  last_name text,
  job_title text,
  email text,
  phone text,
  mobile text,
  is_primary boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ==================================================
-- Compatibility columns (legacy -> canonical)
-- ==================================================

alter table if exists public.products add column if not exists name text;
alter table if exists public.products add column if not exists category_id uuid;
alter table if exists public.products add column if not exists code text;
alter table if exists public.products add column if not exists short_description text;
alter table if exists public.products add column if not exists long_description text;
alter table if exists public.products add column if not exists brand text;
alter table if exists public.products add column if not exists range_name text;
alter table if exists public.products add column if not exists packaging text;
alter table if exists public.products add column if not exists unit text;
alter table if exists public.products add column if not exists vat_rate numeric(5,2);
alter table if exists public.products add column if not exists is_active boolean;
alter table if exists public.products add column if not exists technical_sheet_url text;
alter table if exists public.products add column if not exists safety_sheet_url text;

alter table if exists public.price_lists add column if not exists is_active boolean;
alter table if exists public.price_lists add column if not exists starts_at date;
alter table if exists public.price_lists add column if not exists ends_at date;

alter table if exists public.price_list_items add column if not exists unit_price_ht numeric(12,2);
alter table if exists public.price_list_items add column if not exists discount_percent numeric(5,2);
alter table if exists public.price_list_items add column if not exists conditioning text;
alter table if exists public.price_list_items add column if not exists is_available boolean;

alter table if exists public.orders add column if not exists order_number text;
alter table if exists public.orders add column if not exists prospect_client_id uuid;
alter table if exists public.orders add column if not exists order_status text;
alter table if exists public.orders add column if not exists order_date date;
alter table if exists public.orders add column if not exists delivery_address_line_1 text;
alter table if exists public.orders add column if not exists delivery_address_line_2 text;
alter table if exists public.orders add column if not exists delivery_postal_code text;
alter table if exists public.orders add column if not exists delivery_city text;
alter table if exists public.orders add column if not exists delivery_country text;
alter table if exists public.orders add column if not exists comments text;
alter table if exists public.orders add column if not exists subtotal_ht numeric(12,2);
alter table if exists public.orders add column if not exists total_vat numeric(12,2);
alter table if exists public.orders add column if not exists total_ttc numeric(12,2);
alter table if exists public.orders add column if not exists estimated_commission_amount numeric(12,2);
alter table if exists public.orders add column if not exists commission_rate numeric(5,2);

alter table if exists public.order_items add column if not exists product_reference text;
alter table if exists public.order_items add column if not exists product_name text;
alter table if exists public.order_items add column if not exists quantity numeric(12,2);
alter table if exists public.order_items add column if not exists unit_price_ht numeric(12,2);
alter table if exists public.order_items add column if not exists discount_percent numeric(5,2);
alter table if exists public.order_items add column if not exists vat_rate numeric(5,2);
alter table if exists public.order_items add column if not exists line_total_ht numeric(12,2);

alter table if exists public.commercial_actions add column if not exists prospect_client_id uuid;
alter table if exists public.email_logs add column if not exists prospect_client_id uuid;
alter table if exists public.email_templates add column if not exists subject_template text;
alter table if exists public.email_templates add column if not exists body_template text;
alter table if exists public.email_templates add column if not exists is_active boolean default true;

-- product_documents compatibility for older draft schema
alter table if exists public.product_documents add column if not exists document_type text;
alter table if exists public.product_documents add column if not exists storage_path text;
alter table if exists public.product_documents add column if not exists public_url text;

-- ==================================================
-- Backfill from legacy columns when present
-- ==================================================

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='nom_produit') then
    execute 'update public.products set name = coalesce(name, nom_produit)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='code_produit') then
    execute 'update public.products set code = coalesce(code, code_produit)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='description_courte') then
    execute 'update public.products set short_description = coalesce(short_description, description_courte)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='gamme') then
    execute 'update public.products set brand = coalesce(brand, gamme), range_name = coalesce(range_name, gamme)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='conditionnement') then
    execute 'update public.products set packaging = coalesce(packaging, conditionnement)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='unite') then
    execute 'update public.products set unit = coalesce(unit, unite)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='tva') then
    execute 'update public.products set vat_rate = coalesce(vat_rate, tva)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='actif') then
    execute 'update public.products set is_active = coalesce(is_active, actif)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='fiche_technique_url') then
    execute 'update public.products set technical_sheet_url = coalesce(technical_sheet_url, fiche_technique_url)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='fiche_securite_url') then
    execute 'update public.products set safety_sheet_url = coalesce(safety_sheet_url, fiche_securite_url)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='price_lists' and column_name='active') then
    execute 'update public.price_lists set is_active = coalesce(is_active, active)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='price_lists' and column_name='effective_date') then
    execute 'update public.price_lists set starts_at = coalesce(starts_at, effective_date)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='price_list_items' and column_name='prix_ht') then
    execute 'update public.price_list_items set unit_price_ht = coalesce(unit_price_ht, prix_ht)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='price_list_items' and column_name='remise') then
    execute 'update public.price_list_items set discount_percent = coalesce(discount_percent, remise)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='price_list_items' and column_name='conditionnement') then
    execute 'update public.price_list_items set conditioning = coalesce(conditioning, conditionnement)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='price_list_items' and column_name='disponibilite') then
    execute 'update public.price_list_items set is_available = coalesce(is_available, disponibilite = ''en_stock'')';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='numero_commande') then
    execute 'update public.orders set order_number = coalesce(order_number, numero_commande)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='client_id') then
    execute 'update public.orders set prospect_client_id = coalesce(prospect_client_id, client_id)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='statut') then
    execute 'update public.orders set order_status = coalesce(order_status, statut)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='date_commande') then
    execute 'update public.orders set order_date = coalesce(order_date, date_commande)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='adresse_livraison') then
    execute 'update public.orders set delivery_address_line_1 = coalesce(delivery_address_line_1, adresse_livraison)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='commentaire') then
    execute 'update public.orders set comments = coalesce(comments, commentaire)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='total_ht') then
    execute 'update public.orders set subtotal_ht = coalesce(subtotal_ht, total_ht)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='total_tva') then
    execute 'update public.orders set total_vat = coalesce(total_vat, total_tva)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='commission_estimee') then
    execute 'update public.orders set estimated_commission_amount = coalesce(estimated_commission_amount, commission_estimee)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='order_items' and column_name='reference') then
    execute 'update public.order_items set product_reference = coalesce(product_reference, reference)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='order_items' and column_name='designation') then
    execute 'update public.order_items set product_name = coalesce(product_name, designation)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='order_items' and column_name='quantite') then
    execute 'update public.order_items set quantity = coalesce(quantity, quantite)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='order_items' and column_name='prix_unitaire_ht') then
    execute 'update public.order_items set unit_price_ht = coalesce(unit_price_ht, prix_unitaire_ht)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='order_items' and column_name='remise') then
    execute 'update public.order_items set discount_percent = coalesce(discount_percent, remise)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='order_items' and column_name='total_ligne_ht') then
    execute 'update public.order_items set line_total_ht = coalesce(line_total_ht, total_ligne_ht)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='commercial_actions' and column_name='client_id') then
    execute 'update public.commercial_actions set prospect_client_id = coalesce(prospect_client_id, client_id)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='email_logs' and column_name='client_id') then
    execute 'update public.email_logs set prospect_client_id = coalesce(prospect_client_id, client_id)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='email_templates' and column_name='subject') then
    execute 'update public.email_templates set subject_template = coalesce(subject_template, subject)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='email_templates' and column_name='body') then
    execute 'update public.email_templates set body_template = coalesce(body_template, body)';
  end if;
end $$;

-- ==================================================
-- Minimal safe indexes (guards to avoid "column does not exist")
-- ==================================================

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='name') then
    execute 'create index if not exists products_name_idx on public.products(name)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='order_number') then
    execute 'create index if not exists orders_order_number_idx on public.orders(order_number)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='prospect_client_id') then
    execute 'create index if not exists orders_prospect_client_id_idx on public.orders(prospect_client_id)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='commercial_actions' and column_name='prospect_client_id') then
    execute 'create index if not exists commercial_actions_prospect_client_id_idx on public.commercial_actions(prospect_client_id)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='email_logs' and column_name='prospect_client_id') then
    execute 'create index if not exists email_logs_prospect_client_idx on public.email_logs(prospect_client_id)';
  end if;
end $$;

-- ==================================================
-- RLS policies used by current app
-- ==================================================

alter table if exists public.prospects_clients enable row level security;
alter table if exists public.client_contacts enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.order_items enable row level security;
alter table if exists public.commercial_actions enable row level security;
alter table if exists public.email_logs enable row level security;
alter table if exists public.email_log_attachments enable row level security;
alter table if exists public.product_documents enable row level security;

drop policy if exists "prospects clients owner access" on public.prospects_clients;
create policy "prospects clients owner access" on public.prospects_clients
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

drop policy if exists "orders owner access" on public.orders;
create policy "orders owner access" on public.orders
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

drop policy if exists "commercial actions owner access" on public.commercial_actions;
create policy "commercial actions owner access" on public.commercial_actions
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

drop policy if exists "email logs owner access" on public.email_logs;
create policy "email logs owner access" on public.email_logs
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

drop policy if exists "email attachments parent owner access" on public.email_log_attachments;
create policy "email attachments parent owner access" on public.email_log_attachments
  for all using (
    exists (
      select 1 from public.email_logs el
      where el.id = email_log_attachments.email_log_id
        and el.owner_user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.email_logs el
      where el.id = email_log_attachments.email_log_id
        and el.owner_user_id = auth.uid()
    )
  );

drop policy if exists "authenticated product documents access" on public.product_documents;
create policy "authenticated product documents access" on public.product_documents
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ==================================================
-- Storage (safe defaults)
-- ==================================================

insert into storage.buckets (id, name, public)
values
  ('technical-sheets', 'technical-sheets', false),
  ('safety-sheets', 'safety-sheets', false),
  ('order-pdfs', 'order-pdfs', false),
  ('client-documents', 'client-documents', false)
on conflict (id) do nothing;

drop policy if exists "authenticated read crm storage" on storage.objects;
create policy "authenticated read crm storage" on storage.objects
  for select using (
    auth.role() = 'authenticated'
    and bucket_id in ('technical-sheets', 'safety-sheets', 'order-pdfs', 'client-documents')
  );

drop policy if exists "authenticated insert crm storage" on storage.objects;
create policy "authenticated insert crm storage" on storage.objects
  for insert with check (
    auth.role() = 'authenticated'
    and bucket_id in ('technical-sheets', 'safety-sheets', 'order-pdfs', 'client-documents')
  );

set check_function_bodies = on;
