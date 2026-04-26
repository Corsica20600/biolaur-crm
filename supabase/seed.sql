-- Biolaur CRM Terrain - seed demo
-- Remplacer :user_id par l'id auth.users du commercial/admin avant execution.

insert into public.profiles (id, full_name, email, role)
values ('45d55b89-d87b-43ee-a477-b6cfed9caa77', 'Demo Commercial', 'commercial@biolaur.fr', 'admin')
on conflict (id) do update set full_name = excluded.full_name, email = excluded.email;

insert into public.app_settings (
  owner_user_id, company_name, sender_name, sender_email, sender_phone, company_address,
  default_commission_rate, default_vat_rate, currency
)
values (
  '45d55b89-d87b-43ee-a477-b6cfed9caa77', 'Biolaur Distribution', 'Demo Commercial', 'commercial@biolaur.fr',
  '05 56 00 00 00', '12 rue des Artisans, 33000 Bordeaux', 20, 20, 'EUR'
)
on conflict (owner_user_id) do update set
  company_name = excluded.company_name,
  sender_email = excluded.sender_email;

insert into public.email_templates (code, name, subject_template, body_template, is_active)
values
  ('send_technical_sheet', 'Envoi fiches techniques', 'Vos fiches techniques produit', 'Bonjour,\n\nSuite à notre échange, vous trouverez en pièces jointes les documents demandés.\n\nJe reste à votre disposition pour toute information complémentaire, un devis personnalisé ou un accompagnement sur vos besoins.\n\nCordialement,\nErwan Longin\nBiolaur Distribution', true),
  ('send_order', 'Envoi bon de commande', 'Bon de commande', 'Bonjour,\n\nVeuillez trouver ci-joint votre bon de commande.\n\nJe reste à votre disposition pour toute précision ou modification éventuelle.\n\nCordialement,\nErwan Longin\nBiolaur Distribution', true),
  ('send_account_opening', 'Ouverture de compte', 'Documents ouverture de compte', 'Bonjour,\n\nVeuillez trouver ci-joint les documents nécessaires à l’ouverture de compte.\n\nCordialement', true),
  ('send_sales_pack', 'Pack commercial', 'Documentation commerciale', 'Bonjour,\n\nVeuillez trouver ci-joint la documentation commerciale demandée.\n\nCordialement', true)
on conflict (code) do update set
  name = excluded.name,
  subject_template = excluded.subject_template,
  body_template = excluded.body_template,
  is_active = excluded.is_active;

insert into public.product_categories (name, slug) values
  ('Vaisselle machine', 'vaisselle_machine'),
  ('Vaisselle main', 'vaisselle_main'),
  ('Sanitaire', 'sanitaire'),
  ('Vitres', 'vitres'),
  ('Ambiance et odeurs', 'ambiance_odeurs'),
  ('Detartrants', 'detartrants'),
  ('Maintenance technique', 'maintenance_technique'),
  ('Canalisations', 'canalisations'),
  ('Surfaces', 'surfaces')
on conflict (slug) do update set name = excluded.name;

insert into public.prospects_clients (
  owner_user_id, record_type, company_name, trade_name, client_type, commercial_status, siret,
  contact_first_name, contact_last_name, contact_job_title, phone, mobile, email,
  address_line_1, postal_code, city, geographic_sector, notes, source, last_interaction_at, next_follow_up_at
) values
(:user_id, 'client', 'SARL Restaurant Atlantic', 'L''Atlantic', 'CHR', 'actif', '81234567800019', 'Sophie', 'Martin', 'Gerante', '05 57 21 45 10', '06 21 45 78 11', 's.martin@atlantic-restaurant.fr', '18 quai Richelieu', '33000', 'Bordeaux', 'Bordeaux centre', 'Gros potentiel vaisselle machine et hygiene cuisine.', 'Terrain', now() - interval '3 days', now() + interval '5 days'),
(:user_id, 'client', 'Mairie de Lormont', 'Services techniques Lormont', 'collectivite', 'actif', '21330249400012', 'Karim', 'Benali', 'Responsable achats', '05 56 74 32 00', '06 11 25 60 90', 'achats@lormont.fr', '1 rue Andre Dupin', '33310', 'Lormont', 'Rive droite', 'Besoin de documents administratifs complets.', 'Recommandation', now() - interval '8 days', now() + interval '13 days'),
(:user_id, 'client', 'Hotel des Pins SAS', 'Hotel des Pins', 'CHR', 'actif', '82345678900013', 'Claire', 'Renaud', 'Directrice', '05 56 12 78 40', '06 18 22 91 54', 'direction@hoteldespins.fr', '7 avenue de la Plage', '33120', 'Arcachon', 'Bassin', 'Besoin sanitaire, odeurs et entretien chambres.', 'Reseau', now() - interval '2 days', now() + interval '9 days'),
(:user_id, 'client', 'Boulangerie Saint-Pierre', 'Boulangerie Saint-Pierre', 'commerce_de_bouche', '51278945600022', 'Julien', 'Moreau', 'Dirigeant', '05 56 98 12 55', '06 62 18 45 10', 'contact@boulangerie-st-pierre.fr', '2 rue Saint-Pierre', '33000', 'Bordeaux', 'Bordeaux centre', 'Consommation recurrente sols, vitres et plonge.', 'Prospection terrain', now() - interval '11 days', now() + interval '4 days'),
(:user_id, 'client', 'College Jean Moulin', 'College Jean Moulin', 'collectivite', '19330012200018', 'Nadia', 'Perrin', 'Gestionnaire', '05 56 44 21 00', '06 20 44 90 12', 'gestion@college-moulin.fr', '14 rue des Ecoles', '33700', 'Merignac', 'Merignac', 'Commandes par periode scolaire.', 'Appel entrant', now() - interval '15 days', now() + interval '18 days'),
(:user_id, 'prospect', 'Boucherie Dumas SAS', 'Boucherie Dumas', 'commerce_de_bouche', 'relance', '79845612300031', 'Paul', 'Dumas', 'Dirigeant', '05 57 86 44 21', '06 48 10 22 34', 'contact@boucherie-dumas.fr', '42 avenue Thiers', '33100', 'Bordeaux', 'Bordeaux Bastide', 'Interesse par degraissant et sacherie.', 'Prospection terrain', now() - interval '4 days', now() + interval '2 days'),
(:user_id, 'prospect', 'Cafe de la Promenade', 'La Promenade', 'CHR', 'en_cours', '82356799100027', 'Emma', 'Leroy', 'Responsable salle', '05 56 31 98 70', '06 32 14 77 08', 'emma@cafe-promenade.fr', '5 place du Marche', '33700', 'Merignac', 'Merignac', 'Demande echantillons lavage verre.', 'Salon CHR', now() - interval '6 days', now() + interval '7 days'),
(:user_id, 'prospect', 'Traiteur Garonne', 'Traiteur Garonne', 'CHR', 'a_prospecter', '84512378900015', 'Lucie', 'Vidal', 'Acheteuse', '05 56 70 11 22', '06 44 12 88 31', 'achats@traiteur-garonne.fr', '22 rue du Port', '33130', 'Begles', 'Sud Bordeaux', 'Gros volume potentiel reception.', 'LinkedIn', null, now() + interval '6 days'),
(:user_id, 'prospect', 'EHPAD Les Acacias', 'Les Acacias', 'collectivite', 'relance', '26330089200041', 'Michel', 'Andre', 'Responsable maintenance', '05 56 12 31 66', '06 28 91 70 30', 'maintenance@acacias.fr', '9 chemin des Pins', '33600', 'Pessac', 'Pessac', 'Besoin canalisations et sanitaires.', 'Recommandation', now() - interval '1 days', now() + interval '3 days'),
(:user_id, 'prospect', 'Fromagerie du Marche', 'Fromagerie du Marche', 'commerce_de_bouche', 'en_cours', '90122214500012', 'Anne', 'Roche', 'Gerante', '05 56 80 64 10', '06 12 98 54 20', 'contact@fromagerie-marche.fr', '11 halle centrale', '33000', 'Bordeaux', 'Bordeaux centre', 'Compare prix liquides vaisselle et vitres.', 'Terrain', now() - interval '5 days', now() + interval '8 days');

insert into public.products (
  category_id, reference, code, name, short_description, long_description, brand, range_name,
  packaging, unit, ean, vat_rate, is_active, technical_sheet_url, safety_sheet_url, notes
)
select c.id, p.reference, p.code, p.name, p.short_description, p.long_description, p.brand, p.range_name,
       p.packaging, p.unit, p.ean, 20, true, p.technical_sheet_url, p.safety_sheet_url, p.notes
from (
  values
  ('vaisselle_machine','BIO-LVM-ED-20','LVMED20','LVM machine eau dure','Lessive machine professionnelle eau dure.','Lessive liquide concentree pour lave-vaisselle professionnel en eau dure.','Biolaur','Vaisselle Pro','Bidon 20 L','bidon','3760000002019','technical-sheets/lvm-machine-eau-dure.pdf','safety-sheets/lvm-machine-eau-dure.pdf','Produit prioritaire CHR.'),
  ('vaisselle_machine','BIO-RINC-5','RINC5','Liquide rincage machine','Produit de rincage pour brillance vaisselle.','Facilite le sechage et evite les traces en machine professionnelle.','Biolaur','Vaisselle Pro','Bidon 5 L','bidon','3760000002026','technical-sheets/liquide-rincage-machine.pdf','safety-sheets/liquide-rincage-machine.pdf','Associer avec LVM.'),
  ('detartrants','BIO-DET-MACH-5','DETM5','Detartrant machine','Detartrant acide pour machines et circuits.','Elimine calcaire et depots mineraux sur machines de lavage.','Biolaur','Technique','Bidon 5 L','bidon','3760000002033','technical-sheets/detartrant-machine.pdf','safety-sheets/detartrant-machine.pdf','Maintenance preventive.'),
  ('sanitaire','BIO-SDB-750','SDB750','Nettoyant salle de bain','Nettoyant sanitaire pret a l emploi.','Nettoie robinetterie, faience, lavabos et douches.','Biolaur','Sanitaire','Pulverisateur 750 ml','pulverisateur','3760000002040','technical-sheets/nettoyant-salle-de-bain.pdf','safety-sheets/nettoyant-salle-de-bain.pdf','Usage hotellerie.'),
  ('detartrants','BIO-ANTI-CAL-1','ANTICAL1','Anti-calcaire','Anti-calcaire surfaces et robinetterie.','Formule efficace contre traces blanches et tartre.','Biolaur','Sanitaire','Flacon 1 L','flacon','3760000002057','technical-sheets/anti-calcaire.pdf','safety-sheets/anti-calcaire.pdf',null),
  ('canalisations','BIO-ACTIVATOP-5','ACTIV5','Activatop bac a graisse','Activateur biologique pour bacs a graisse.','Aide a limiter odeurs et engorgements en restauration.','Biolaur','Canalisations','Bidon 5 L','bidon','3760000002064','technical-sheets/activatop-bac-a-graisse.pdf',null,'Produit conseil terrain.'),
  ('vitres','BIO-VITRES-750','VIT750','Nettoyant vitres','Nettoyant vitres sans traces.','Nettoyage rapide surfaces vitrees, miroirs et inox brillants.','Biolaur','Surfaces','Pulverisateur 750 ml','pulverisateur','3760000002071','technical-sheets/nettoyant-vitres.pdf',null,null),
  ('vaisselle_main','BIO-LV-CIT-1','LVCIT1','Liquide vaisselle','Liquide vaisselle concentre citron.','Plonge manuelle, bon pouvoir degraissant.','Biolaur','Vaisselle main','Flacon 1 L','flacon','3760000002088','technical-sheets/liquide-vaisselle.pdf',null,'Produit appel.'),
  ('ambiance_odeurs','BIO-SPRAY-AMB-750','AMB750','Spray ambiance','Spray ambiance longue duree.','Neutralise les odeurs et parfume les espaces clients.','Biolaur','Ambiance','Pulverisateur 750 ml','pulverisateur','3760000002095','technical-sheets/spray-ambiance.pdf',null,null),
  ('maintenance_technique','BIO-RENOV-MET-500','MET500','Renovateur metaux','Renovateur inox et metaux.','Renove, protege et fait briller inox, chrome et aluminium.','Biolaur','Maintenance','Aerosol 500 ml','aerosol','3760000002101','technical-sheets/renovateur-metaux.pdf','safety-sheets/renovateur-metaux.pdf','Bon complement cuisine.'),
  ('surfaces','BIO-SURF-5','SURF5','Nettoyant surfaces alimentaires','Nettoyant polyvalent surfaces alimentaires.','Nettoyage quotidien plans de travail et tables inox.','Biolaur','Surfaces','Bidon 5 L','bidon','3760000002118','technical-sheets/nettoyant-surfaces-alimentaires.pdf','safety-sheets/nettoyant-surfaces-alimentaires.pdf',null),
  ('sanitaire','BIO-PAPIER-Z-3000','PAPZ3000','Essuie-mains Z blanc','Essuie-mains interfolies sanitaires.','Carton economique pour distributeurs essuie-mains Z.','Biolaur','Sanitaire','Carton 3000 formats','carton','3760000002125','technical-sheets/essuie-mains-z.pdf',null,null)
) as p(slug, reference, code, name, short_description, long_description, brand, range_name, packaging, unit, ean, technical_sheet_url, safety_sheet_url, notes)
join public.product_categories c on c.slug = p.slug
on conflict (reference) do update set
  name = excluded.name,
  category_id = excluded.category_id,
  technical_sheet_url = excluded.technical_sheet_url,
  safety_sheet_url = excluded.safety_sheet_url;

insert into public.product_documents (product_id, document_type, title, file_name, storage_path, public_url, mime_type)
select id, 'fiche_technique', 'FT - ' || name, reference || '-ft.pdf', technical_sheet_url, technical_sheet_url, 'application/pdf'
from public.products
where technical_sheet_url is not null
on conflict do nothing;

insert into public.product_documents (product_id, document_type, title, file_name, storage_path, public_url, mime_type)
select id, 'fiche_securite', 'FDS - ' || name, reference || '-fds.pdf', safety_sheet_url, safety_sheet_url, 'application/pdf'
from public.products
where safety_sheet_url is not null
on conflict do nothing;

insert into public.price_lists (name, code, geographic_scope, starts_at, ends_at, is_active, notes)
values ('Tarif BIOLAUR SP 2026 CORSE', 'BIOLAUR-SP-2026-CORSE', 'Corse', '2026-01-01', '2026-12-31', true, 'Tarif demo commercial terrain')
on conflict do nothing;

insert into public.price_list_items (price_list_id, product_id, unit_price_ht, discount_percent, conditioning, min_quantity, is_available, effective_date, notes)
select pl.id, p.id,
  case p.reference
    when 'BIO-LVM-ED-20' then 54.90
    when 'BIO-RINC-5' then 18.70
    when 'BIO-DET-MACH-5' then 22.80
    when 'BIO-SDB-750' then 5.90
    when 'BIO-ANTI-CAL-1' then 6.40
    when 'BIO-ACTIVATOP-5' then 38.50
    when 'BIO-VITRES-750' then 4.70
    when 'BIO-LV-CIT-1' then 3.80
    when 'BIO-SPRAY-AMB-750' then 7.20
    when 'BIO-RENOV-MET-500' then 9.90
    when 'BIO-SURF-5' then 16.80
    else 24.50
  end,
  case when p.reference in ('BIO-LVM-ED-20','BIO-RINC-5') then 5 else 0 end,
  p.packaging,
  1,
  true,
  '2026-01-01',
  null
from public.price_lists pl
cross join public.products p
where pl.code = 'BIOLAUR-SP-2026-CORSE'
on conflict (price_list_id, product_id) do update set
  unit_price_ht = excluded.unit_price_ht,
  discount_percent = excluded.discount_percent,
  conditioning = excluded.conditioning;

-- Commandes + lignes. Le trigger genere les numeros si vides, mais on force des numeros lisibles demo.
with client_atlantic as (
  select id from public.prospects_clients where trade_name = 'L''Atlantic' limit 1
),
client_lormont as (
  select id from public.prospects_clients where trade_name = 'Services techniques Lormont' limit 1
),
ins_orders as (
  insert into public.orders (
    owner_user_id, order_number, prospect_client_id, order_status, order_date,
    delivery_address_line_1, delivery_postal_code, delivery_city, comments, commission_rate
  )
  values
  (:user_id, 'CMD-2026-0001', (select id from client_atlantic), 'validee', current_date - 10, '18 quai Richelieu', '33000', 'Bordeaux', 'Livraison avant service du midi.', 20),
  (:user_id, 'CMD-2026-0002', (select id from client_lormont), 'envoyee', current_date - 6, 'Atelier municipal', '33310', 'Lormont', 'Joindre documents administratifs.', 20)
  on conflict (order_number) do update set order_status = excluded.order_status
  returning id, order_number
)
insert into public.order_items (
  order_id, product_id, product_reference, product_name, quantity, unit_price_ht,
  discount_percent, vat_rate, sort_order
)
select o.id, p.id, p.reference, p.name, x.quantity, x.unit_price_ht, x.discount_percent, 20, x.sort_order
from ins_orders o
join (
  values
  ('CMD-2026-0001','BIO-LVM-ED-20',2,54.90,5,1),
  ('CMD-2026-0001','BIO-RINC-5',4,18.70,5,2),
  ('CMD-2026-0001','BIO-LV-CIT-1',12,3.80,0,3),
  ('CMD-2026-0002','BIO-SDB-750',24,5.90,0,1),
  ('CMD-2026-0002','BIO-PAPIER-Z-3000',8,24.50,0,2),
  ('CMD-2026-0002','BIO-ACTIVATOP-5',3,38.50,0,3)
) as x(order_number, reference, quantity, unit_price_ht, discount_percent, sort_order)
  on x.order_number = o.order_number
join public.products p on p.reference = x.reference;

insert into public.commercial_actions (
  owner_user_id, prospect_client_id, action_type, action_status, action_date,
  summary, details, next_action_type, next_action_date
)
select :user_id, pc.id, x.action_type, x.action_status, x.action_date, x.summary, x.details, x.next_action_type, x.next_action_date
from (
  values
  ('L''Atlantic','visite','fait',now() - interval '3 days','Controle stock cuisine','Besoin recurrent LVM et rincage.','relance',now() + interval '5 days'),
  ('Boucherie Dumas','relance','a_faire',now() - interval '1 day','Relance tarif sacherie','A recu les fiches techniques.','visite',now() + interval '2 days'),
  ('Services techniques Lormont','email','fait',now() - interval '8 days','Envoi dossier administratif','Demande validation commande.','relance',now() + interval '13 days'),
  ('EHPAD Les Acacias','appel','a_faire',now(),'Qualifier maintenance','Verifier besoin canalisations.','rendez_vous',now() + interval '3 days')
) as x(trade_name, action_type, action_status, action_date, summary, details, next_action_type, next_action_date)
join public.prospects_clients pc on pc.trade_name = x.trade_name;

with inserted_email as (
insert into public.email_logs (
  owner_user_id, prospect_client_id, order_id, email_template_id, recipient_email,
  subject, body, send_status, sent_at
)
select :user_id, pc.id, o.id, et.id, pc.email, 'Bon de commande', 'Bonjour, veuillez trouver ci-joint votre bon de commande.', 'sent', now() - interval '10 days'
from public.prospects_clients pc
join public.orders o on o.prospect_client_id = pc.id and o.order_number = 'CMD-2026-0001'
join public.email_templates et on et.code = 'send_order'
where pc.trade_name = 'L''Atlantic'
returning id, order_id
)
insert into public.email_log_attachments (email_log_id, attachment_type, file_name, file_url)
select id, 'order_pdf', 'CMD-2026-0001.pdf', '/api/orders/' || order_id || '/pdf'
from inserted_email;
