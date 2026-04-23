-- Biolaur CRM Terrain - schema Supabase/PostgreSQL complet
-- Pret a coller dans Supabase SQL Editor.
-- Conception: mono-utilisateur au depart via owner_user_id, evolutive multi-utilisateurs.

create extension if not exists "pgcrypto";
set check_function_bodies = off;

-- ==================================================
-- Fonctions communes
-- ==================================================

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.generate_order_number()
returns trigger as $$
declare
  year_part text;
  next_number integer;
begin
  if new.order_number is not null and length(trim(new.order_number)) > 0 then
    return new;
  end if;

  year_part := to_char(coalesce(new.order_date, current_date), 'YYYY');

  select coalesce(max((regexp_match(order_number, '^CMD-' || year_part || '-([0-9]+)$'))[1]::integer), 0) + 1
  into next_number
  from public.orders
  where order_number ~ ('^CMD-' || year_part || '-[0-9]+$');

  new.order_number := 'CMD-' || year_part || '-' || lpad(next_number::text, 4, '0');
  return new;
end;
$$ language plpgsql;

create or replace function public.recalculate_order_totals(target_order_id uuid)
returns void as $$
declare
  totals record;
  order_commission_rate numeric(5,2);
begin
  select
    coalesce(sum(line_total_ht), 0) as subtotal_ht,
    coalesce(sum(line_total_ht * (coalesce(vat_rate, 20) / 100)), 0) as total_vat
  into totals
  from public.order_items
  where order_id = target_order_id;

  select coalesce(commission_rate, 20)
  into order_commission_rate
  from public.orders
  where id = target_order_id;

  update public.orders
  set
    subtotal_ht = round(totals.subtotal_ht, 2),
    total_vat = round(totals.total_vat, 2),
    total_ttc = round(totals.subtotal_ht + totals.total_vat, 2),
    estimated_commission_amount = round(totals.subtotal_ht * (coalesce(order_commission_rate, 20) / 100), 2),
    updated_at = now()
  where id = target_order_id;
end;
$$ language plpgsql security definer;

create or replace function public.recalculate_commission(target_order_id uuid)
returns void as $$
declare
  order_record record;
begin
  select id, owner_user_id, prospect_client_id, subtotal_ht, commission_rate
  into order_record
  from public.orders
  where id = target_order_id;

  if order_record.id is null then
    return;
  end if;

  insert into public.commissions (
    owner_user_id,
    order_id,
    prospect_client_id,
    commission_base_ht,
    commission_rate,
    commission_amount,
    commission_status
  )
  values (
    order_record.owner_user_id,
    order_record.id,
    order_record.prospect_client_id,
    coalesce(order_record.subtotal_ht, 0),
    coalesce(order_record.commission_rate, 20),
    round(coalesce(order_record.subtotal_ht, 0) * (coalesce(order_record.commission_rate, 20) / 100), 2),
    'a_venir'
  )
  on conflict (order_id)
  do update set
    commission_base_ht = excluded.commission_base_ht,
    commission_rate = excluded.commission_rate,
    commission_amount = excluded.commission_amount,
    updated_at = now();
end;
$$ language plpgsql security definer;

create or replace function public.prepare_order_item_line_total()
returns trigger as $$
begin
  new.line_total_ht := round(
    coalesce(new.quantity, 0) * coalesce(new.unit_price_ht, 0) * (1 - coalesce(new.discount_percent, 0) / 100),
    2
  );
  return new;
end;
$$ language plpgsql;

create or replace function public.after_order_item_change()
returns trigger as $$
declare
  target_order_id uuid;
begin
  target_order_id := coalesce(new.order_id, old.order_id);
  perform public.recalculate_order_totals(target_order_id);
  perform public.recalculate_commission(target_order_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create or replace function public.after_order_change()
returns trigger as $$
begin
  perform public.recalculate_commission(new.id);
  return new;
end;
$$ language plpgsql security definer;

-- ==================================================
-- Tables
-- ==================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text default 'admin',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  parent_id uuid references public.product_categories(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.product_categories(id) on delete set null,
  reference text not null unique,
  code text,
  name text not null,
  short_description text,
  long_description text,
  brand text,
  range_name text,
  packaging text,
  unit text,
  ean text,
  vat_rate numeric(5,2) default 20.00,
  is_active boolean default true,
  technical_sheet_url text,
  safety_sheet_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.product_documents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  document_type text check (document_type in ('fiche_technique','fiche_securite','bon_commande','plaquette','autre')),
  title text not null,
  file_name text,
  storage_path text,
  public_url text,
  mime_type text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.price_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  geographic_scope text,
  starts_at date,
  ends_at date,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.price_list_items (
  id uuid primary key default gen_random_uuid(),
  price_list_id uuid not null references public.price_lists(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  unit_price_ht numeric(12,2) not null default 0,
  discount_percent numeric(5,2) default 0,
  conditioning text,
  min_quantity numeric(12,2),
  is_available boolean default true,
  effective_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(price_list_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id) on delete cascade,
  order_number text unique not null,
  prospect_client_id uuid not null references public.prospects_clients(id) on delete restrict,
  order_status text not null check (order_status in ('brouillon','envoyee','validee','livree','payee','annulee')),
  order_date date not null default current_date,
  delivery_address_line_1 text,
  delivery_address_line_2 text,
  delivery_postal_code text,
  delivery_city text,
  delivery_country text default 'France',
  comments text,
  subtotal_ht numeric(12,2) default 0,
  total_vat numeric(12,2) default 0,
  total_ttc numeric(12,2) default 0,
  estimated_commission_amount numeric(12,2) default 0,
  commission_rate numeric(5,2) default 20.00,
  pdf_url text,
  sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_reference text,
  product_name text not null,
  quantity numeric(12,2) not null default 1,
  unit_price_ht numeric(12,2) not null default 0,
  discount_percent numeric(5,2) default 0,
  vat_rate numeric(5,2) default 20.00,
  line_total_ht numeric(12,2) not null default 0,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.commercial_actions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id) on delete cascade,
  prospect_client_id uuid not null references public.prospects_clients(id) on delete cascade,
  action_type text not null check (action_type in ('appel','visite','relance','email','rendez_vous','note')),
  action_status text check (action_status in ('a_faire','fait','annule')),
  action_date timestamptz not null default now(),
  summary text,
  details text,
  next_action_type text,
  next_action_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  subject_template text not null,
  body_template text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id) on delete cascade,
  prospect_client_id uuid references public.prospects_clients(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  email_template_id uuid references public.email_templates(id) on delete set null,
  recipient_email text not null,
  cc_email text,
  bcc_email text,
  subject text not null,
  body text,
  send_status text check (send_status in ('draft','sent','failed')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.email_log_attachments (
  id uuid primary key default gen_random_uuid(),
  email_log_id uuid not null references public.email_logs(id) on delete cascade,
  attachment_type text check (attachment_type in ('product_document','order_pdf','client_document','other')),
  product_document_id uuid references public.product_documents(id) on delete set null,
  file_name text,
  file_url text,
  created_at timestamptz default now()
);

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id) on delete cascade,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  prospect_client_id uuid references public.prospects_clients(id) on delete set null,
  commission_base_ht numeric(12,2) not null default 0,
  commission_rate numeric(5,2) not null default 20.00,
  commission_amount numeric(12,2) not null default 0,
  commission_status text check (commission_status in ('a_venir','due','payee')),
  calculated_at timestamptz default now(),
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id) on delete cascade,
  company_name text,
  sender_name text,
  sender_email text,
  sender_phone text,
  company_address text,
  logo_url text,
  default_commission_rate numeric(5,2) default 20.00,
  default_vat_rate numeric(5,2) default 20.00,
  currency text default 'EUR',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(owner_user_id)
);

-- ==================================================
-- Index
-- ==================================================

create index if not exists prospects_clients_company_name_idx on public.prospects_clients(company_name);
create index if not exists prospects_clients_record_type_idx on public.prospects_clients(record_type);
create index if not exists prospects_clients_commercial_status_idx on public.prospects_clients(commercial_status);
create index if not exists prospects_clients_client_type_idx on public.prospects_clients(client_type);
create index if not exists prospects_clients_city_idx on public.prospects_clients(city);
create index if not exists prospects_clients_owner_idx on public.prospects_clients(owner_user_id);
create index if not exists client_contacts_parent_idx on public.client_contacts(prospect_client_id);

create index if not exists products_reference_idx on public.products(reference);
create index if not exists products_name_idx on public.products(name);
create index if not exists products_ean_idx on public.products(ean);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_is_active_idx on public.products(is_active);
create index if not exists product_documents_product_idx on public.product_documents(product_id);

create index if not exists price_lists_active_idx on public.price_lists(is_active);
create index if not exists price_list_items_price_list_idx on public.price_list_items(price_list_id);
create index if not exists price_list_items_product_idx on public.price_list_items(product_id);

create index if not exists orders_order_number_idx on public.orders(order_number);
create index if not exists orders_prospect_client_id_idx on public.orders(prospect_client_id);
create index if not exists orders_order_status_idx on public.orders(order_status);
create index if not exists orders_order_date_idx on public.orders(order_date);
create index if not exists orders_owner_idx on public.orders(owner_user_id);
create index if not exists order_items_order_idx on public.order_items(order_id);

create index if not exists commercial_actions_prospect_client_id_idx on public.commercial_actions(prospect_client_id);
create index if not exists commercial_actions_action_type_idx on public.commercial_actions(action_type);
create index if not exists commercial_actions_action_date_idx on public.commercial_actions(action_date);
create index if not exists commercial_actions_next_action_date_idx on public.commercial_actions(next_action_date);

create index if not exists email_logs_owner_idx on public.email_logs(owner_user_id);
create index if not exists email_logs_prospect_client_idx on public.email_logs(prospect_client_id);
create index if not exists email_log_attachments_email_idx on public.email_log_attachments(email_log_id);
create index if not exists commissions_owner_status_idx on public.commissions(owner_user_id, commission_status);

-- ==================================================
-- Triggers updated_at
-- ==================================================

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();

drop trigger if exists prospects_clients_updated_at on public.prospects_clients;
create trigger prospects_clients_updated_at before update on public.prospects_clients for each row execute function public.update_updated_at_column();

drop trigger if exists client_contacts_updated_at on public.client_contacts;
create trigger client_contacts_updated_at before update on public.client_contacts for each row execute function public.update_updated_at_column();

drop trigger if exists product_categories_updated_at on public.product_categories;
create trigger product_categories_updated_at before update on public.product_categories for each row execute function public.update_updated_at_column();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products for each row execute function public.update_updated_at_column();

drop trigger if exists product_documents_updated_at on public.product_documents;
create trigger product_documents_updated_at before update on public.product_documents for each row execute function public.update_updated_at_column();

drop trigger if exists price_lists_updated_at on public.price_lists;
create trigger price_lists_updated_at before update on public.price_lists for each row execute function public.update_updated_at_column();

drop trigger if exists price_list_items_updated_at on public.price_list_items;
create trigger price_list_items_updated_at before update on public.price_list_items for each row execute function public.update_updated_at_column();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders for each row execute function public.update_updated_at_column();

drop trigger if exists order_items_updated_at on public.order_items;
create trigger order_items_updated_at before update on public.order_items for each row execute function public.update_updated_at_column();

drop trigger if exists commercial_actions_updated_at on public.commercial_actions;
create trigger commercial_actions_updated_at before update on public.commercial_actions for each row execute function public.update_updated_at_column();

drop trigger if exists email_templates_updated_at on public.email_templates;
create trigger email_templates_updated_at before update on public.email_templates for each row execute function public.update_updated_at_column();

drop trigger if exists email_logs_updated_at on public.email_logs;
create trigger email_logs_updated_at before update on public.email_logs for each row execute function public.update_updated_at_column();

drop trigger if exists commissions_updated_at on public.commissions;
create trigger commissions_updated_at before update on public.commissions for each row execute function public.update_updated_at_column();

drop trigger if exists app_settings_updated_at on public.app_settings;
create trigger app_settings_updated_at before update on public.app_settings for each row execute function public.update_updated_at_column();

-- ==================================================
-- Triggers metier commandes
-- ==================================================

drop trigger if exists orders_generate_number on public.orders;
create trigger orders_generate_number before insert on public.orders for each row execute function public.generate_order_number();

drop trigger if exists order_items_prepare_total on public.order_items;
create trigger order_items_prepare_total before insert or update on public.order_items for each row execute function public.prepare_order_item_line_total();

drop trigger if exists order_items_after_change on public.order_items;
create trigger order_items_after_change after insert or update or delete on public.order_items for each row execute function public.after_order_item_change();

drop trigger if exists orders_after_change_commission on public.orders;
create trigger orders_after_change_commission after insert or update of subtotal_ht, commission_rate, order_status on public.orders for each row execute function public.after_order_change();

-- ==================================================
-- RLS
-- ==================================================

alter table public.profiles enable row level security;
alter table public.prospects_clients enable row level security;
alter table public.client_contacts enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_documents enable row level security;
alter table public.price_lists enable row level security;
alter table public.price_list_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.commercial_actions enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_logs enable row level security;
alter table public.email_log_attachments enable row level security;
alter table public.commissions enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "profiles own access" on public.profiles;
create policy "profiles own access" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

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

drop policy if exists "commissions owner access" on public.commissions;
create policy "commissions owner access" on public.commissions
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

drop policy if exists "app settings owner access" on public.app_settings;
create policy "app settings owner access" on public.app_settings
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

drop policy if exists "client contacts parent owner access" on public.client_contacts;
create policy "client contacts parent owner access" on public.client_contacts
  for all using (
    exists (
      select 1 from public.prospects_clients pc
      where pc.id = client_contacts.prospect_client_id
      and pc.owner_user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.prospects_clients pc
      where pc.id = client_contacts.prospect_client_id
      and pc.owner_user_id = auth.uid()
    )
  );

drop policy if exists "order items parent owner access" on public.order_items;
create policy "order items parent owner access" on public.order_items
  for all using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
      and o.owner_user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
      and o.owner_user_id = auth.uid()
    )
  );

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

-- Tables catalogue/tarifs: accessibles aux utilisateurs connectes.
-- En mono-utilisateur c'est simple; en multi-utilisateurs, ajouter owner_user_id si chaque commercial a un catalogue distinct.
drop policy if exists "authenticated product categories access" on public.product_categories;
create policy "authenticated product categories access" on public.product_categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated products access" on public.products;
create policy "authenticated products access" on public.products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated product documents access" on public.product_documents;
create policy "authenticated product documents access" on public.product_documents
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated price lists access" on public.price_lists;
create policy "authenticated price lists access" on public.price_lists
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated price list items access" on public.price_list_items;
create policy "authenticated price list items access" on public.price_list_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated email templates access" on public.email_templates;
create policy "authenticated email templates access" on public.email_templates
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ==================================================
-- Storage buckets et policies
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

drop policy if exists "authenticated update crm storage" on storage.objects;
create policy "authenticated update crm storage" on storage.objects
  for update using (
    auth.role() = 'authenticated'
    and bucket_id in ('technical-sheets', 'safety-sheets', 'order-pdfs', 'client-documents')
  ) with check (
    auth.role() = 'authenticated'
    and bucket_id in ('technical-sheets', 'safety-sheets', 'order-pdfs', 'client-documents')
  );

drop policy if exists "authenticated delete crm storage" on storage.objects;
create policy "authenticated delete crm storage" on storage.objects
  for delete using (
    auth.role() = 'authenticated'
    and bucket_id in ('technical-sheets', 'safety-sheets', 'order-pdfs', 'client-documents')
  );

-- ==================================================
-- Templates email initiaux
-- ==================================================

insert into public.email_templates (code, name, subject_template, body_template, is_active)
values
  ('send_technical_sheet', 'Envoi fiches techniques', 'Vos fiches techniques produit', 'Bonjour,\n\nVeuillez trouver ci-joint les fiches techniques demandées.\n\nCordialement', true),
  ('send_order', 'Envoi bon de commande', 'Bon de commande', 'Bonjour,\n\nVeuillez trouver ci-joint votre bon de commande.\n\nCordialement', true),
  ('send_account_opening', 'Ouverture de compte', 'Documents ouverture de compte', 'Bonjour,\n\nVeuillez trouver ci-joint les documents nécessaires à l’ouverture de compte.\n\nCordialement', true),
  ('send_sales_pack', 'Pack commercial', 'Documentation commerciale', 'Bonjour,\n\nVeuillez trouver ci-joint la documentation commerciale demandée.\n\nCordialement', true)
on conflict (code) do update set
  name = excluded.name,
  subject_template = excluded.subject_template,
  body_template = excluded.body_template,
  is_active = excluded.is_active;

set check_function_bodies = on;
