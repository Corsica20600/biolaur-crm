-- Patch local pour rendre tous les champs de la page Parametres persistants.
alter table if exists public.app_settings
  add column if not exists client_categories text default 'CHR, collectivite, commerce de bouche, autre',
  add column if not exists product_categories text default 'Entretien, Vaisselle, Sanitaires, Technique, Ouate';
