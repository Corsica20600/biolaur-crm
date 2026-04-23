-- Production patch for the currently deployed Biolaur Supabase schema.
-- It keeps existing tables/data and adds the missing production pieces.

create extension if not exists "pgcrypto";

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

create table if not exists public.email_log_attachments (
  id uuid primary key default gen_random_uuid(),
  email_log_id uuid not null references public.email_logs(id) on delete cascade,
  attachment_type text check (attachment_type in ('product_document','order_pdf','client_document','other')),
  product_document_id uuid references public.product_documents(id) on delete set null,
  file_name text,
  file_url text,
  created_at timestamptz default now()
);

alter table public.email_templates add column if not exists code text;
alter table public.email_templates add column if not exists subject_template text;
alter table public.email_templates add column if not exists body_template text;
alter table public.email_templates add column if not exists is_active boolean default true;

update public.email_templates
set
  code = coalesce(code, lower(replace(name, ' ', '_'))),
  subject_template = coalesce(subject_template, subject),
  body_template = coalesce(body_template, body),
  is_active = coalesce(is_active, true);

do $$
declare
  owner uuid;
  list_id uuid;
begin
  select id into owner from public.profiles order by created_at limit 1;
  if owner is null then
    raise exception 'Aucun profil trouve. Creez d abord un utilisateur Auth/profiles.';
  end if;

  insert into public.product_categories (owner_id, name)
  select owner, name
  from (values
    ('Vaisselle machine'), ('Vaisselle main'), ('Sanitaire'), ('Vitres'), ('Ambiance et odeurs'),
    ('Detartrants'), ('Maintenance technique'), ('Canalisations'), ('Surfaces')
  ) as c(name)
  where not exists (
    select 1 from public.product_categories pc where pc.owner_id = owner and pc.name = c.name
  );

  insert into public.products (
    owner_id, reference, code_produit, nom_produit, description_courte, gamme, categorie,
    sous_categorie, conditionnement, unite, ean, tarif_ht, tva, actif,
    fiche_technique_url, fiche_securite_url, notes
  )
  values
  (owner,'BIO-LVM-ED-20','LVMED20','LVM machine eau dure','Lessive machine professionnelle eau dure.','Vaisselle Pro','Vaisselle machine','Lavage machine','Bidon 20 L','bidon','3760000002019',54.90,20,true,'technical-sheets/lvm-machine-eau-dure.pdf','safety-sheets/lvm-machine-eau-dure.pdf','Produit prioritaire CHR.'),
  (owner,'BIO-RINC-5','RINC5','Liquide rincage machine','Produit de rincage pour brillance vaisselle.','Vaisselle Pro','Vaisselle machine','Rincage','Bidon 5 L','bidon','3760000002026',18.70,20,true,'technical-sheets/liquide-rincage-machine.pdf','safety-sheets/liquide-rincage-machine.pdf',null),
  (owner,'BIO-DET-MACH-5','DETM5','Detartrant machine','Detartrant acide pour machines et circuits.','Technique','Detartrants','Machine','Bidon 5 L','bidon','3760000002033',22.80,20,true,'technical-sheets/detartrant-machine.pdf','safety-sheets/detartrant-machine.pdf',null),
  (owner,'BIO-SDB-750','SDB750','Nettoyant salle de bain','Nettoyant sanitaire pret a l emploi.','Sanitaire','Sanitaire','Salle de bain','Pulverisateur 750 ml','pulverisateur','3760000002040',5.90,20,true,'technical-sheets/nettoyant-salle-de-bain.pdf','safety-sheets/nettoyant-salle-de-bain.pdf',null),
  (owner,'BIO-ANTI-CAL-1','ANTICAL1','Anti-calcaire','Anti-calcaire surfaces et robinetterie.','Sanitaire','Detartrants','Anti-calcaire','Flacon 1 L','flacon','3760000002057',6.40,20,true,'technical-sheets/anti-calcaire.pdf','safety-sheets/anti-calcaire.pdf',null),
  (owner,'BIO-ACTIVATOP-5','ACTIV5','Activatop bac a graisse','Activateur biologique pour bacs a graisse.','Canalisations','Canalisations','Bac a graisse','Bidon 5 L','bidon','3760000002064',38.50,20,true,'technical-sheets/activatop-bac-a-graisse.pdf',null,null),
  (owner,'BIO-VITRES-750','VIT750','Nettoyant vitres','Nettoyant vitres sans traces.','Surfaces','Vitres','Vitres','Pulverisateur 750 ml','pulverisateur','3760000002071',4.70,20,true,'technical-sheets/nettoyant-vitres.pdf',null,null),
  (owner,'BIO-LV-CIT-1','LVCIT1','Liquide vaisselle','Liquide vaisselle concentre citron.','Vaisselle main','Vaisselle main','Plonge manuelle','Flacon 1 L','flacon','3760000002088',3.80,20,true,'technical-sheets/liquide-vaisselle.pdf',null,null),
  (owner,'BIO-SPRAY-AMB-750','AMB750','Spray ambiance','Spray ambiance longue duree.','Ambiance','Ambiance et odeurs','Odeurs','Pulverisateur 750 ml','pulverisateur','3760000002095',7.20,20,true,'technical-sheets/spray-ambiance.pdf',null,null),
  (owner,'BIO-RENOV-MET-500','MET500','Renovateur metaux','Renovateur inox et metaux.','Maintenance','Maintenance technique','Metaux','Aerosol 500 ml','aerosol','3760000002101',9.90,20,true,'technical-sheets/renovateur-metaux.pdf','safety-sheets/renovateur-metaux.pdf',null),
  (owner,'BIO-SURF-5','SURF5','Nettoyant surfaces alimentaires','Nettoyant polyvalent surfaces alimentaires.','Surfaces','Surfaces','Alimentaire','Bidon 5 L','bidon','3760000002118',16.80,20,true,'technical-sheets/nettoyant-surfaces-alimentaires.pdf','safety-sheets/nettoyant-surfaces-alimentaires.pdf',null),
  (owner,'BIO-PAPIER-Z-3000','PAPZ3000','Essuie-mains Z blanc','Essuie-mains interfolies sanitaires.','Sanitaire','Sanitaire','Essuie-mains','Carton 3000 formats','carton','3760000002125',24.50,20,true,'technical-sheets/essuie-mains-z.pdf',null,null)
  on conflict (owner_id, reference) do update set
    nom_produit = excluded.nom_produit,
    tarif_ht = excluded.tarif_ht,
    fiche_technique_url = excluded.fiche_technique_url,
    fiche_securite_url = excluded.fiche_securite_url,
    updated_at = now();

  insert into public.price_lists (owner_id, name, effective_date, active)
  select owner, 'Tarif BIOLAUR SP 2026 CORSE', '2026-01-01', true
  where not exists (select 1 from public.price_lists where owner_id = owner and name = 'Tarif BIOLAUR SP 2026 CORSE');

  select id into list_id from public.price_lists where owner_id = owner and name = 'Tarif BIOLAUR SP 2026 CORSE' limit 1;

  insert into public.price_list_items (
    owner_id, price_list_id, product_id, prix_ht, remise, conditionnement, disponibilite, effective_date
  )
  select owner, list_id, p.id, p.tarif_ht,
    case when p.reference in ('BIO-LVM-ED-20','BIO-RINC-5') then 5 else 0 end,
    p.conditionnement, 'en_stock', '2026-01-01'
  from public.products p
  where p.owner_id = owner
  on conflict (price_list_id, product_id) do update set
    prix_ht = excluded.prix_ht,
    remise = excluded.remise,
    conditionnement = excluded.conditionnement,
    updated_at = now();

  insert into public.product_documents (product_id, document_type, title, file_name, storage_path, public_url, mime_type)
  select p.id, 'fiche_technique', 'FT - ' || p.nom_produit, p.reference || '-ft.pdf', p.fiche_technique_url, p.fiche_technique_url, 'application/pdf'
  from public.products p
  where p.owner_id = owner
    and p.fiche_technique_url is not null
    and not exists (
      select 1 from public.product_documents pd
      where pd.product_id = p.id and pd.document_type = 'fiche_technique'
    );

  insert into public.product_documents (product_id, document_type, title, file_name, storage_path, public_url, mime_type)
  select p.id, 'fiche_securite', 'FDS - ' || p.nom_produit, p.reference || '-fds.pdf', p.fiche_securite_url, p.fiche_securite_url, 'application/pdf'
  from public.products p
  where p.owner_id = owner
    and p.fiche_securite_url is not null
    and not exists (
      select 1 from public.product_documents pd
      where pd.product_id = p.id and pd.document_type = 'fiche_securite'
    );
end $$;

insert into public.email_templates (owner_id, code, name, subject, body, subject_template, body_template, is_active)
select p.id, t.code, t.name, t.subject, t.body, t.subject, t.body, true
from public.profiles p
cross join (values
  ('send_technical_sheet','Envoi fiches techniques','Vos fiches techniques produit','Bonjour,\n\nVeuillez trouver ci-joint les fiches techniques demandées.\n\nCordialement'),
  ('send_order','Envoi bon de commande','Bon de commande','Bonjour,\n\nVeuillez trouver ci-joint votre bon de commande.\n\nCordialement'),
  ('send_account_opening','Ouverture de compte','Documents ouverture de compte','Bonjour,\n\nVeuillez trouver ci-joint les documents nécessaires à l’ouverture de compte.\n\nCordialement'),
  ('send_sales_pack','Pack commercial','Documentation commerciale','Bonjour,\n\nVeuillez trouver ci-joint la documentation commerciale demandée.\n\nCordialement')
) as t(code,name,subject,body)
where not exists (select 1 from public.email_templates et where et.owner_id = p.id and et.code = t.code);
