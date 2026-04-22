-- Import BIOLAUR SP 2026 CORSE
begin;

-- 1) Catégories principales
insert into public.product_categories (name, slug, parent_id, created_at, updated_at)
values
('CORPOREL', 'corporel', null, now(), now()),
('CUISINE', 'cuisine', null, now(), now()),
('DEBOUCHEURS', 'deboucheurs', null, now(), now()),
('DROGUERIE', 'droguerie', null, now(), now()),
('GAMME NILODOR', 'gamme-nilodor', null, now(), now()),
('GEL DOUCHE', 'gel-douche', null, now(), now()),
('LINGE', 'linge', null, now(), now()),
('SAC A DECHET NETTOYANT POUBELLES', 'sac-a-dechet-nettoyant-poubelles', null, now(), now()),
('SANITAIRES', 'sanitaires', null, now(), now()),
('SHAMPOING', 'shampoing', null, now(), now()),
('SOLS & SURFACES', 'sols-surfaces', null, now(), now())
on conflict (slug) do update set name = excluded.name, updated_at = now();

-- 2) Sous-catégories
insert into public.product_categories (name, slug, parent_id, created_at, updated_at)
select v.name, v.slug, p.id, now(), now()
from (
select 'None'::text as name, 'none'::text as slug, 'corporel'::text as parent_slug
union all
select 'Désinfectants Surfaces'::text as name, 'desinfectants-surfaces'::text as slug, 'cuisine'::text as parent_slug
union all
select 'Détartrant Machine'::text as name, 'detartrant-machine'::text as slug, 'cuisine'::text as parent_slug
union all
select 'Four, Plancha, Plaque'::text as name, 'four-plancha-plaque'::text as slug, 'cuisine'::text as parent_slug
union all
select 'Liquide Lavage Machine'::text as name, 'liquide-lavage-machine'::text as slug, 'cuisine'::text as parent_slug
union all
select 'Liquide Rinçage Machine'::text as name, 'liquide-rincage-machine'::text as slug, 'cuisine'::text as parent_slug
union all
select 'Liquide vaisselle mains'::text as name, 'liquide-vaisselle-mains'::text as slug, 'cuisine'::text as parent_slug
union all
select 'Rénovateur Métaux'::text as name, 'renovateur-metaux'::text as slug, 'cuisine'::text as parent_slug
union all
select 'Surfaces'::text as name, 'surfaces'::text as slug, 'cuisine'::text as parent_slug
union all
select 'Traitement Canalisations / Bac à graisse'::text as name, 'traitement-canalisations-bac-a-graisse'::text as slug, 'cuisine'::text as parent_slug
union all
select 'Liquide'::text as name, 'liquide'::text as slug, 'deboucheurs'::text as parent_slug
union all
select 'Solide'::text as name, 'solide'::text as slug, 'deboucheurs'::text as parent_slug
union all
select 'Balances'::text as name, 'balances'::text as slug, 'droguerie'::text as parent_slug
union all
select 'Diluants'::text as name, 'diluants'::text as slug, 'droguerie'::text as parent_slug
union all
select 'Entretien'::text as name, 'entretien'::text as slug, 'droguerie'::text as parent_slug
union all
select 'Huiles'::text as name, 'huiles'::text as slug, 'droguerie'::text as parent_slug
union all
select 'Insectes Rampants'::text as name, 'insectes-rampants'::text as slug, 'droguerie'::text as parent_slug
union all
select 'Insectes Volants'::text as name, 'insectes-volants'::text as slug, 'droguerie'::text as parent_slug
union all
select 'Insectes Volants et Rampants'::text as name, 'insectes-volants-et-rampants'::text as slug, 'droguerie'::text as parent_slug
union all
select 'Javels'::text as name, 'javels'::text as slug, 'droguerie'::text as parent_slug
union all
select 'Minuteurs / Horloges'::text as name, 'minuteurs-horloges'::text as slug, 'droguerie'::text as parent_slug
union all
select 'Rongeurs'::text as name, 'rongeurs'::text as slug, 'droguerie'::text as parent_slug
union all
select 'Themomètres'::text as name, 'themometres'::text as slug, 'droguerie'::text as parent_slug
union all
select 'Absorbants NILODOR'::text as name, 'absorbants-nilodor'::text as slug, 'gamme-nilodor'::text as parent_slug
union all
select 'Neutralisants et destructeurs d''odeurs'::text as name, 'neutralisants-et-destructeurs-d-odeurs'::text as slug, 'gamme-nilodor'::text as parent_slug
union all
select 'Poubelles Locaux, Parking neutralisation très longue durée et grands surfaces'::text as name, 'poubelles-locaux-parking-neutralisation-tres-longue-duree-et-grands-surfaces'::text as slug, 'gamme-nilodor'::text as parent_slug
union all
select 'None'::text as name, 'none'::text as slug, 'gel-douche'::text as parent_slug
union all
select 'Accordéons'::text as name, 'accordeons'::text as slug, 'linge'::text as parent_slug
union all
select 'Air Sapin'::text as name, 'air-sapin'::text as slug, 'linge'::text as parent_slug
union all
select 'Clips'::text as name, 'clips'::text as slug, 'linge'::text as parent_slug
union all
select 'Détachants'::text as name, 'detachants'::text as slug, 'linge'::text as parent_slug
union all
select 'Grilles'::text as name, 'grilles'::text as slug, 'linge'::text as parent_slug
union all
select 'Lessive Liquide'::text as name, 'lessive-liquide'::text as slug, 'linge'::text as parent_slug
union all
select 'None'::text as name, 'none'::text as slug, 'sac-a-dechet-nettoyant-poubelles'::text as parent_slug
union all
select 'Fosse septique'::text as name, 'fosse-septique'::text as slug, 'sanitaires'::text as parent_slug
union all
select 'Nettoyants, Détartrants, Désinfectants'::text as name, 'nettoyants-detartrants-desinfectants'::text as slug, 'sanitaires'::text as parent_slug
union all
select 'Surfaces et Canalisations'::text as name, 'surfaces-et-canalisations'::text as slug, 'sanitaires'::text as parent_slug
union all
select 'Wc, Urinoir'::text as name, 'wc-urinoir'::text as slug, 'sanitaires'::text as parent_slug
union all
select 'None'::text as name, 'none'::text as slug, 'shampoing'::text as parent_slug
union all
select 'Désinfectants surodorants conteneurs/ poubelles très longue rémanence'::text as name, 'desinfectants-surodorants-conteneurs-poubelles-tres-longue-remanence'::text as slug, 'sols-surfaces'::text as parent_slug
union all
select 'Désodorisants et surodorants'::text as name, 'desodorisants-et-surodorants'::text as slug, 'sols-surfaces'::text as parent_slug
union all
select 'Détergents Désinfectants Surodorant 3D'::text as name, 'detergents-desinfectants-surodorant-3d'::text as slug, 'sols-surfaces'::text as parent_slug
union all
select 'Détergents Désinfectants Surodorant 3D longue durée'::text as name, 'detergents-desinfectants-surodorant-3d-longue-duree'::text as slug, 'sols-surfaces'::text as parent_slug
union all
select 'Détergents Sols parfumé 2D'::text as name, 'detergents-sols-parfume-2d'::text as slug, 'sols-surfaces'::text as parent_slug
union all
select 'Détergents Surodorant 2D'::text as name, 'detergents-surodorant-2d'::text as slug, 'sols-surfaces'::text as parent_slug
union all
select 'Détergents Surodorant 2D ECOCERT'::text as name, 'detergents-surodorant-2d-ecocert'::text as slug, 'sols-surfaces'::text as parent_slug
union all
select 'Détergents désinfectants de surfaces Multi-usage Neutre'::text as name, 'detergents-desinfectants-de-surfaces-multi-usage-neutre'::text as slug, 'sols-surfaces'::text as parent_slug
union all
select 'Nettoyants Vitres et surfaces'::text as name, 'nettoyants-vitres-et-surfaces'::text as slug, 'sols-surfaces'::text as parent_slug
union all
select 'Spécialité: Détachants surfaces Anti Graffiti'::text as name, 'specialite-detachants-surfaces-anti-graffiti'::text as slug, 'sols-surfaces'::text as parent_slug
union all
select 'Traitement TERRASSE'::text as name, 'traitement-terrasse'::text as slug, 'sols-surfaces'::text as parent_slug
union all
select 'Traitement TOITURES'::text as name, 'traitement-toitures'::text as slug, 'sols-surfaces'::text as parent_slug
) v
join public.product_categories p on p.slug = v.parent_slug
on conflict (slug) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  updated_at = now();

-- 3) Liste tarifaire
insert into public.price_lists (name, code, geographic_scope, starts_at, is_active, notes, created_at, updated_at)
values ('Tarif BIOLAUR SP 2026 CORSE', 'BIOLAUR-SP-2026-CORSE', 'Corse', date '2026-01-01', true, 'Importé depuis TARIF BIOLAUR SP 2026 - V2 CORSE.xlsx', now(), now())
on conflict (code) do update set
  name = excluded.name,
  geographic_scope = excluded.geographic_scope,
  starts_at = excluded.starts_at,
  is_active = excluded.is_active,
  notes = excluded.notes,
  updated_at = now();

-- 4) Produits
insert into public.products (
  category_id, reference, code, name, short_description, long_description,
  brand, range_name, packaging, unit, ean, vat_rate, is_active,
  technical_sheet_url, safety_sheet_url, notes, created_at, updated_at
)
select
  pc.id as category_id,
  v.reference,
  v.code,
  v.name,
  v.short_description,
  v.long_description,
  v.brand,
  v.range_name,
  v.packaging,
  v.unit,
  null as ean,
  20.00 as vat_rate,
  true as is_active,
  null as technical_sheet_url,
  null as safety_sheet_url,
  v.notes,
  now(),
  now()
from (
select 'SUP3DN750'::text as reference, 'SUP3DN750'::text as code, 'SUPER 3D NEUTRE 750 ml'::text as name, 'SUPER 3D NEUTRE 750 ml'::text as short_description, 'Détergents désinfectants de surfaces Multi-usage Neutre | SOLS & SURFACES'::text as long_description, 'SUPER 3D'::text as brand, 'SUPER 3D'::text as range_name, '750ml'::text as packaging, '750ml'::text as unit, 'detergents-desinfectants-de-surfaces-multi-usage-neutre'::text as category_slug, null::text as notes
union all
select 'SUP3DN-5'::text as reference, 'SUP3DN-5'::text as code, 'SUPER 3D NEUTRE 5L'::text as name, 'SUPER 3D NEUTRE 5L'::text as short_description, 'Détergents désinfectants de surfaces Multi-usage Neutre | SOLS & SURFACES'::text as long_description, 'SUPER 3D'::text as brand, 'SUPER 3D'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-desinfectants-de-surfaces-multi-usage-neutre'::text as category_slug, null::text as notes
union all
select 'SUP3DN2-5'::text as reference, 'SUP3DN2-5'::text as code, 'SUPER 3D NEUTRE CONCENTRE 5L'::text as name, 'SUPER 3D NEUTRE CONCENTRE 5L'::text as short_description, 'Détergents désinfectants de surfaces Multi-usage Neutre | SOLS & SURFACES'::text as long_description, 'SUPER 3D'::text as brand, 'SUPER 3D'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-desinfectants-de-surfaces-multi-usage-neutre'::text as category_slug, null::text as notes
union all
select 'SUP3DNM-5'::text as reference, 'SUP3DNM-5'::text as code, 'SUPER 3D MEDICAL NEUTRE 5L'::text as name, 'SUPER 3D MEDICAL NEUTRE 5L'::text as short_description, 'Détergents désinfectants de surfaces Multi-usage Neutre | SOLS & SURFACES'::text as long_description, 'SUPER 3D'::text as brand, 'SUPER 3D'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-desinfectants-de-surfaces-multi-usage-neutre'::text as category_slug, null::text as notes
union all
select 'SUP3DN-L100'::text as reference, 'SUP3DN-L100'::text as code, 'LINGETTES SUPER 3D NEUTRE Flowpack x100 (+ Taxe TSUU 0,12€)'::text as name, 'LINGETTES SUPER 3D NEUTRE Flowpack x100 (+ Taxe TSUU 0,12€)'::text as short_description, 'Détergents désinfectants de surfaces Multi-usage Neutre | SOLS & SURFACES'::text as long_description, 'SUPER 3D'::text as brand, 'SUPER 3D'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'detergents-desinfectants-de-surfaces-multi-usage-neutre'::text as category_slug, null::text as notes
union all
select 'SUP3DLA-5'::text as reference, 'SUP3DLA-5'::text as code, 'SUPER 3D LAVANDE 5L'::text as name, 'SUPER 3D LAVANDE 5L'::text as short_description, 'Détergents Désinfectants Surodorant 3D | SOLS & SURFACES'::text as long_description, 'SUPER 3D'::text as brand, 'SUPER 3D'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-desinfectants-surodorant-3d'::text as category_slug, null::text as notes
union all
select 'SUP3DA-5'::text as reference, 'SUP3DA-5'::text as code, 'SUPER 3D AMBIANCE 5L'::text as name, 'SUPER 3D AMBIANCE 5L'::text as short_description, 'Détergents Désinfectants Surodorant 3D | SOLS & SURFACES'::text as long_description, 'SUPER 3D'::text as brand, 'SUPER 3D'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-desinfectants-surodorant-3d'::text as category_slug, null::text as notes
union all
select 'SUP3DF-5'::text as reference, 'SUP3DF-5'::text as code, 'SUPER 3D FLEURIE 5L'::text as name, 'SUPER 3D FLEURIE 5L'::text as short_description, 'Détergents Désinfectants Surodorant 3D | SOLS & SURFACES'::text as long_description, 'SUPER 3D'::text as brand, 'SUPER 3D'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-desinfectants-surodorant-3d'::text as category_slug, null::text as notes
union all
select 'SUP3DCV-5'::text as reference, 'SUP3DCV-5'::text as code, 'SUPER 3D CITRON VERT 5L'::text as name, 'SUPER 3D CITRON VERT 5L'::text as short_description, 'Détergents Désinfectants Surodorant 3D | SOLS & SURFACES'::text as long_description, 'SUPER 3D'::text as brand, 'SUPER 3D'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-desinfectants-surodorant-3d'::text as category_slug, null::text as notes
union all
select 'SUP3DP-5'::text as reference, 'SUP3DP-5'::text as code, 'SUPER 3D PAMPLEMOUSSE'::text as name, 'SUPER 3D PAMPLEMOUSSE'::text as short_description, 'Détergents Désinfectants Surodorant 3D | SOLS & SURFACES'::text as long_description, 'SUPER 3D'::text as brand, 'SUPER 3D'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-desinfectants-surodorant-3d'::text as category_slug, null::text as notes
union all
select '60100'::text as reference, '60100'::text as code, 'PRIMODEUR 3D LAVANDE 1L'::text as name, 'PRIMODEUR 3D LAVANDE 1L'::text as short_description, 'Détergents Désinfectants Surodorant 3D longue durée | SOLS & SURFACES'::text as long_description, 'PRIMODEUR'::text as brand, 'PRIMODEUR'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'detergents-desinfectants-surodorant-3d-longue-duree'::text as category_slug, null::text as notes
union all
select '60250'::text as reference, '60250'::text as code, 'PRIMODEUR 3D AMBIANCE 1L'::text as name, 'PRIMODEUR 3D AMBIANCE 1L'::text as short_description, 'Détergents Désinfectants Surodorant 3D longue durée | SOLS & SURFACES'::text as long_description, 'PRIMODEUR'::text as brand, 'PRIMODEUR'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'detergents-desinfectants-surodorant-3d-longue-duree'::text as category_slug, null::text as notes
union all
select '60500'::text as reference, '60500'::text as code, 'PRIMODEUR 3D FLEURIE 1L'::text as name, 'PRIMODEUR 3D FLEURIE 1L'::text as short_description, 'Détergents Désinfectants Surodorant 3D longue durée | SOLS & SURFACES'::text as long_description, 'PRIMODEUR'::text as brand, 'PRIMODEUR'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'detergents-desinfectants-surodorant-3d-longue-duree'::text as category_slug, null::text as notes
union all
select '60200'::text as reference, '60200'::text as code, 'PRIMODEUR 3D CITRON VERT 1L'::text as name, 'PRIMODEUR 3D CITRON VERT 1L'::text as short_description, 'Détergents Désinfectants Surodorant 3D longue durée | SOLS & SURFACES'::text as long_description, 'PRIMODEUR'::text as brand, 'PRIMODEUR'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'detergents-desinfectants-surodorant-3d-longue-duree'::text as category_slug, null::text as notes
union all
select '60591'::text as reference, '60591'::text as code, 'PRIMODEUR 3D PAMPLEMOUSSE 1L'::text as name, 'PRIMODEUR 3D PAMPLEMOUSSE 1L'::text as short_description, 'Détergents Désinfectants Surodorant 3D longue durée | SOLS & SURFACES'::text as long_description, 'PRIMODEUR'::text as brand, 'PRIMODEUR'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'detergents-desinfectants-surodorant-3d-longue-duree'::text as category_slug, null::text as notes
union all
select '60510'::text as reference, '60510'::text as code, 'PRIMODEUR 3D LAVANDE 5L'::text as name, 'PRIMODEUR 3D LAVANDE 5L'::text as short_description, 'Détergents Désinfectants Surodorant 3D longue durée | SOLS & SURFACES'::text as long_description, 'PRIMODEUR'::text as brand, 'PRIMODEUR'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-desinfectants-surodorant-3d-longue-duree'::text as category_slug, null::text as notes
union all
select '65250'::text as reference, '65250'::text as code, 'PRIMODEUR 3D AMBIANCE 5L'::text as name, 'PRIMODEUR 3D AMBIANCE 5L'::text as short_description, 'Détergents Désinfectants Surodorant 3D longue durée | SOLS & SURFACES'::text as long_description, 'PRIMODEUR'::text as brand, 'PRIMODEUR'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-desinfectants-surodorant-3d-longue-duree'::text as category_slug, null::text as notes
union all
select '60550'::text as reference, '60550'::text as code, 'PRIMODEUR 3D FLEURIE 5L'::text as name, 'PRIMODEUR 3D FLEURIE 5L'::text as short_description, 'Détergents Désinfectants Surodorant 3D longue durée | SOLS & SURFACES'::text as long_description, 'PRIMODEUR'::text as brand, 'PRIMODEUR'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-desinfectants-surodorant-3d-longue-duree'::text as category_slug, null::text as notes
union all
select '60520'::text as reference, '60520'::text as code, 'PRIMODEUR 3D CITRON VERT 5L'::text as name, 'PRIMODEUR 3D CITRON VERT 5L'::text as short_description, 'Détergents Désinfectants Surodorant 3D longue durée | SOLS & SURFACES'::text as long_description, 'PRIMODEUR'::text as brand, 'PRIMODEUR'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-desinfectants-surodorant-3d-longue-duree'::text as category_slug, null::text as notes
union all
select '60590'::text as reference, '60590'::text as code, 'PRIMODEUR 3D PAMPLEMOUSSE 5L'::text as name, 'PRIMODEUR 3D PAMPLEMOUSSE 5L'::text as short_description, 'Détergents Désinfectants Surodorant 3D longue durée | SOLS & SURFACES'::text as long_description, 'PRIMODEUR'::text as brand, 'PRIMODEUR'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-desinfectants-surodorant-3d-longue-duree'::text as category_slug, null::text as notes
union all
select 'CL01-1'::text as reference, 'CL01-1'::text as code, 'CleanBin 3D 1L (Sur demande)'::text as name, 'CleanBin 3D 1L (Sur demande)'::text as short_description, 'Désinfectants surodorants conteneurs/ poubelles très longue rémanence | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'desinfectants-surodorants-conteneurs-poubelles-tres-longue-remanence'::text as category_slug, null::text as notes
union all
select 'CL01'::text as reference, 'CL01'::text as code, 'CleanBin 3D 5 L'::text as name, 'CleanBin 3D 5 L'::text as short_description, 'Désinfectants surodorants conteneurs/ poubelles très longue rémanence | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'desinfectants-surodorants-conteneurs-poubelles-tres-longue-remanence'::text as category_slug, null::text as notes
union all
select 'PLAN2DN-5'::text as reference, 'PLAN2DN-5'::text as code, 'PLANETE 2D NEUTRE  ECOCERT 5L'::text as name, 'PLANETE 2D NEUTRE  ECOCERT 5L'::text as short_description, 'Détergents Surodorant 2D ECOCERT | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-surodorant-2d-ecocert'::text as category_slug, null::text as notes
union all
select 'PLAN2DCV-5'::text as reference, 'PLAN2DCV-5'::text as code, 'PLANETE 2D CITRON VERT ECOCERT 5L'::text as name, 'PLANETE 2D CITRON VERT ECOCERT 5L'::text as short_description, 'Détergents Surodorant 2D ECOCERT | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-surodorant-2d-ecocert'::text as category_slug, null::text as notes
union all
select 'SUP2DN'::text as reference, 'SUP2DN'::text as code, 'SUPER 2D NEUTRE 1L'::text as name, 'SUPER 2D NEUTRE 1L'::text as short_description, 'Détergents Surodorant 2D | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'detergents-surodorant-2d'::text as category_slug, null::text as notes
union all
select 'SUP2DCV'::text as reference, 'SUP2DCV'::text as code, 'SUPER 2D CITRON VERT 1L'::text as name, 'SUPER 2D CITRON VERT 1L'::text as short_description, 'Détergents Surodorant 2D | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'detergents-surodorant-2d'::text as category_slug, null::text as notes
union all
select 'SUP2DLA'::text as reference, 'SUP2DLA'::text as code, 'SUPER 2D LAVANDE 1L'::text as name, 'SUPER 2D LAVANDE 1L'::text as short_description, 'Détergents Surodorant 2D | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'detergents-surodorant-2d'::text as category_slug, null::text as notes
union all
select 'SUP2DA'::text as reference, 'SUP2DA'::text as code, 'SUPER 2D AMBIANCE 1L'::text as name, 'SUPER 2D AMBIANCE 1L'::text as short_description, 'Détergents Surodorant 2D | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'detergents-surodorant-2d'::text as category_slug, null::text as notes
union all
select 'SUP2DF'::text as reference, 'SUP2DF'::text as code, 'SUPER 2D FLEURIE 1L'::text as name, 'SUPER 2D FLEURIE 1L'::text as short_description, 'Détergents Surodorant 2D | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'detergents-surodorant-2d'::text as category_slug, null::text as notes
union all
select 'SUP2DP'::text as reference, 'SUP2DP'::text as code, 'SUPER 2D PAMPLEMOUSSE 1L'::text as name, 'SUPER 2D PAMPLEMOUSSE 1L'::text as short_description, 'Détergents Surodorant 2D | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'detergents-surodorant-2d'::text as category_slug, null::text as notes
union all
select 'SUP2DN-5'::text as reference, 'SUP2DN-5'::text as code, 'SUPER 2D NEUTRE 5L'::text as name, 'SUPER 2D NEUTRE 5L'::text as short_description, 'Détergents Surodorant 2D | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-surodorant-2d'::text as category_slug, null::text as notes
union all
select 'SUP2DCV-5'::text as reference, 'SUP2DCV-5'::text as code, 'SUPER 2D CITRON VERT 5L'::text as name, 'SUPER 2D CITRON VERT 5L'::text as short_description, 'Détergents Surodorant 2D | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-surodorant-2d'::text as category_slug, null::text as notes
union all
select 'SUP2DLA-5'::text as reference, 'SUP2DLA-5'::text as code, 'SUPER 2D LAVANDE 5L'::text as name, 'SUPER 2D LAVANDE 5L'::text as short_description, 'Détergents Surodorant 2D | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-surodorant-2d'::text as category_slug, null::text as notes
union all
select 'SUP2DA-5'::text as reference, 'SUP2DA-5'::text as code, 'SUPER 2D AMBIANCE 5L'::text as name, 'SUPER 2D AMBIANCE 5L'::text as short_description, 'Détergents Surodorant 2D | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-surodorant-2d'::text as category_slug, null::text as notes
union all
select 'SUP2DF-5'::text as reference, 'SUP2DF-5'::text as code, 'SUPER 2D FLEURIE 5L'::text as name, 'SUPER 2D FLEURIE 5L'::text as short_description, 'Détergents Surodorant 2D | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-surodorant-2d'::text as category_slug, null::text as notes
union all
select 'SUP2DP-5'::text as reference, 'SUP2DP-5'::text as code, 'SUPER 2D PAMPLEMOUSSE 5L'::text as name, 'SUPER 2D PAMPLEMOUSSE 5L'::text as short_description, 'Détergents Surodorant 2D | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detergents-surodorant-2d'::text as category_slug, null::text as notes
union all
select 'ACTTOI-5'::text as reference, 'ACTTOI-5'::text as code, 'ACTIVATOP TOITURE CONCENTRE 5L (Nouveauté)'::text as name, 'ACTIVATOP TOITURE CONCENTRE 5L (Nouveauté)'::text as short_description, 'Traitement TOITURES | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'traitement-toitures'::text as category_slug, null::text as notes
union all
select 'ACTTOI'::text as reference, 'ACTTOI'::text as code, 'ACTIVATOP TOITURE CONCENTRE 1L (Nouveauté)'::text as name, 'ACTIVATOP TOITURE CONCENTRE 1L (Nouveauté)'::text as short_description, 'Traitement TOITURES | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'traitement-toitures'::text as category_slug, null::text as notes
union all
select 'ACTTER-5'::text as reference, 'ACTTER-5'::text as code, 'ACTIVATOP TERRASSE CONCENTRE 5L (Nouveauté)'::text as name, 'ACTIVATOP TERRASSE CONCENTRE 5L (Nouveauté)'::text as short_description, 'Traitement TERRASSE | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'traitement-terrasse'::text as category_slug, null::text as notes
union all
select 'ACTTER'::text as reference, 'ACTTER'::text as code, 'ACTIVATOP TERRASSE CONCENTRE 1L (Nouveauté)'::text as name, 'ACTIVATOP TERRASSE CONCENTRE 1L (Nouveauté)'::text as short_description, 'Traitement TERRASSE | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'traitement-terrasse'::text as category_slug, null::text as notes
union all
select 'IO009'::text as reference, 'IO009'::text as code, 'NETTOYANT SOLS PARQUETS LAVANDE 1L'::text as name, 'NETTOYANT SOLS PARQUETS LAVANDE 1L'::text as short_description, 'Détergents Sols parfumé 2D | SOLS & SURFACES'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'detergents-sols-parfume-2d'::text as category_slug, null::text as notes
union all
select 'IO010'::text as reference, 'IO010'::text as code, 'NETTOYANT SOLS PLASTIFIÉS AGRUMES 1L'::text as name, 'NETTOYANT SOLS PLASTIFIÉS AGRUMES 1L'::text as short_description, 'Détergents Sols parfumé 2D | SOLS & SURFACES'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'detergents-sols-parfume-2d'::text as category_slug, null::text as notes
union all
select 'IO023'::text as reference, 'IO023'::text as code, 'NETTOYANT UNIVERSEL 625 ml'::text as name, 'NETTOYANT UNIVERSEL 625 ml'::text as short_description, 'Nettoyants Vitres et surfaces | SOLS & SURFACES'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '625ml'::text as packaging, '625ml'::text as unit, 'nettoyants-vitres-et-surfaces'::text as category_slug, null::text as notes
union all
select 'IO045'::text as reference, 'IO045'::text as code, 'NETTOYANT VITRES 625 ml'::text as name, 'NETTOYANT VITRES 625 ml'::text as short_description, 'Nettoyants Vitres et surfaces | SOLS & SURFACES'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '625ml'::text as packaging, '625ml'::text as unit, 'nettoyants-vitres-et-surfaces'::text as category_slug, null::text as notes
union all
select 'IOPRO033'::text as reference, 'IOPRO033'::text as code, 'NET VITRES ULTRA 750 ml'::text as name, 'NET VITRES ULTRA 750 ml'::text as short_description, 'Nettoyants Vitres et surfaces | SOLS & SURFACES'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '750ml'::text as packaging, '750ml'::text as unit, 'nettoyants-vitres-et-surfaces'::text as category_slug, null::text as notes
union all
select 'IOPRO033-5'::text as reference, 'IOPRO033-5'::text as code, 'NET VITRES ULTRA 5L'::text as name, 'NET VITRES ULTRA 5L'::text as short_description, 'Nettoyants Vitres et surfaces | SOLS & SURFACES'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'nettoyants-vitres-et-surfaces'::text as category_slug, null::text as notes
union all
select 'CIM03'::text as reference, 'CIM03'::text as code, 'BIOCIME DÉTACHANT  TOUS SUPPORTS PAE 500 ml'::text as name, 'BIOCIME DÉTACHANT  TOUS SUPPORTS PAE 500 ml'::text as short_description, 'Spécialité: Détachants surfaces Anti Graffiti | SOLS & SURFACES'::text as long_description, 'BIOCIME'::text as brand, 'BIOCIME'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'specialite-detachants-surfaces-anti-graffiti'::text as category_slug, null::text as notes
union all
select 'CIM04'::text as reference, 'CIM04'::text as code, 'BIOCIME DÉTACHANT CONCENTRÉ TOUS SUPPORTS 500 ml'::text as name, 'BIOCIME DÉTACHANT CONCENTRÉ TOUS SUPPORTS 500 ml'::text as short_description, 'Spécialité: Détachants surfaces Anti Graffiti | SOLS & SURFACES'::text as long_description, 'BIOCIME'::text as brand, 'BIOCIME'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'specialite-detachants-surfaces-anti-graffiti'::text as category_slug, null::text as notes
union all
select 'C517'::text as reference, 'C517'::text as code, 'ANTI GRAFFITI 500 ml'::text as name, 'ANTI GRAFFITI 500 ml'::text as short_description, 'Spécialité: Détachants surfaces Anti Graffiti | SOLS & SURFACES'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'specialite-detachants-surfaces-anti-graffiti'::text as category_slug, null::text as notes
union all
select 'C517-5'::text as reference, 'C517-5'::text as code, 'ANTI GRAFFITI 5L'::text as name, 'ANTI GRAFFITI 5L'::text as short_description, 'Spécialité: Détachants surfaces Anti Graffiti | SOLS & SURFACES'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'specialite-detachants-surfaces-anti-graffiti'::text as category_slug, null::text as notes
union all
select 'IO015'::text as reference, 'IO015'::text as code, 'DESODORISANT LONGUE DUREE 200 ml'::text as name, 'DESODORISANT LONGUE DUREE 200 ml'::text as short_description, 'Désodorisants et surodorants | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '200ml'::text as packaging, '200ml'::text as unit, 'desodorisants-et-surodorants'::text as category_slug, null::text as notes
union all
select 'IO018'::text as reference, 'IO018'::text as code, 'VAPORISATEUR TEXTILES PARFUM DOUCEUR  500 ml'::text as name, 'VAPORISATEUR TEXTILES PARFUM DOUCEUR  500 ml'::text as short_description, 'Désodorisants et surodorants | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'desodorisants-et-surodorants'::text as category_slug, null::text as notes
union all
select '80104'::text as reference, '80104'::text as code, 'SPRAY D''AMBIANCE SURODORANT LAVANDE 500 ml'::text as name, 'SPRAY D''AMBIANCE SURODORANT LAVANDE 500 ml'::text as short_description, 'Désodorisants et surodorants | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'desodorisants-et-surodorants'::text as category_slug, null::text as notes
union all
select '80101'::text as reference, '80101'::text as code, 'SPRAY D''AMBIANCE SURODORANT FLEURIE 500 ml'::text as name, 'SPRAY D''AMBIANCE SURODORANT FLEURIE 500 ml'::text as short_description, 'Désodorisants et surodorants | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'desodorisants-et-surodorants'::text as category_slug, null::text as notes
union all
select '80102'::text as reference, '80102'::text as code, 'SPRAY D''AMBIANCE SURODORANT AMBIANCE 500 ml'::text as name, 'SPRAY D''AMBIANCE SURODORANT AMBIANCE 500 ml'::text as short_description, 'Désodorisants et surodorants | SOLS & SURFACES'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'desodorisants-et-surodorants'::text as category_slug, null::text as notes
union all
select '1794'::text as reference, '1794'::text as code, 'DESODORISANT MECHE LAVANDE 375 ml'::text as name, 'DESODORISANT MECHE LAVANDE 375 ml'::text as short_description, 'Désodorisants et surodorants | SOLS & SURFACES'::text as long_description, 'Aire Care'::text as brand, 'Aire Care'::text as range_name, '375ml'::text as packaging, '375ml'::text as unit, 'desodorisants-et-surodorants'::text as category_slug, null::text as notes
union all
select '642'::text as reference, '642'::text as code, 'DESODORISANT GEL ROSE 150 gr'::text as name, 'DESODORISANT GEL ROSE 150 gr'::text as short_description, 'Désodorisants et surodorants | SOLS & SURFACES'::text as long_description, 'Aire Care'::text as brand, 'Aire Care'::text as range_name, '150gr'::text as packaging, '150gr'::text as unit, 'desodorisants-et-surodorants'::text as category_slug, null::text as notes
union all
select '641'::text as reference, '641'::text as code, 'DESODORISANT GEL LAVANDE 150 gr'::text as name, 'DESODORISANT GEL LAVANDE 150 gr'::text as short_description, 'Désodorisants et surodorants | SOLS & SURFACES'::text as long_description, 'Aire Care'::text as brand, 'Aire Care'::text as range_name, '150gr'::text as packaging, '150gr'::text as unit, 'desodorisants-et-surodorants'::text as category_slug, null::text as notes
union all
select 'IO026'::text as reference, 'IO026'::text as code, 'IO LIQUIDE VAISSELLE MAINS ULTRA PUISSANT CITRON 1L'::text as name, 'IO LIQUIDE VAISSELLE MAINS ULTRA PUISSANT CITRON 1L'::text as short_description, 'Liquide vaisselle mains | CUISINE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'liquide-vaisselle-mains'::text as category_slug, null::text as notes
union all
select 'IOPRO032-5'::text as reference, 'IOPRO032-5'::text as code, 'IO LIQUIDE VAISSELLE MAINS ULTRA PUISSANT CITRON 5L'::text as name, 'IO LIQUIDE VAISSELLE MAINS ULTRA PUISSANT CITRON 5L'::text as short_description, 'Liquide vaisselle mains | CUISINE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'liquide-vaisselle-mains'::text as category_slug, null::text as notes
union all
select 'IO041'::text as reference, 'IO041'::text as code, 'IO LIQUIDE VAISSELLE MAINS ULTRA PUISSANT POMME 1L'::text as name, 'IO LIQUIDE VAISSELLE MAINS ULTRA PUISSANT POMME 1L'::text as short_description, 'Liquide vaisselle mains | CUISINE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'liquide-vaisselle-mains'::text as category_slug, null::text as notes
union all
select 'IO027'::text as reference, 'IO027'::text as code, 'IO LIQUIDE VAISSELLE MAINS ULTRA PUISSANT FRUITS ROUGES 1L'::text as name, 'IO LIQUIDE VAISSELLE MAINS ULTRA PUISSANT FRUITS ROUGES 1L'::text as short_description, 'Liquide vaisselle mains | CUISINE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'liquide-vaisselle-mains'::text as category_slug, null::text as notes
union all
select 'IO040'::text as reference, 'IO040'::text as code, 'IO LIQUIDE VAISSELLE MAINS ULTRA PUISSANT CITRON 500 ml'::text as name, 'IO LIQUIDE VAISSELLE MAINS ULTRA PUISSANT CITRON 500 ml'::text as short_description, 'Liquide vaisselle mains | CUISINE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'liquide-vaisselle-mains'::text as category_slug, null::text as notes
union all
select 'IO028'::text as reference, 'IO028'::text as code, 'IO LIQUIDE VAISSELLE MAINS ULTRA PUISSANT POMME 500 ml'::text as name, 'IO LIQUIDE VAISSELLE MAINS ULTRA PUISSANT POMME 500 ml'::text as short_description, 'Liquide vaisselle mains | CUISINE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'liquide-vaisselle-mains'::text as category_slug, null::text as notes
union all
select 'IO039'::text as reference, 'IO039'::text as code, 'IO LIQUIDE VAISSELLE MAINS ULTRA PUISSANT FRUITS ROUGES 500 ml'::text as name, 'IO LIQUIDE VAISSELLE MAINS ULTRA PUISSANT FRUITS ROUGES 500 ml'::text as short_description, 'Liquide vaisselle mains | CUISINE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'liquide-vaisselle-mains'::text as category_slug, null::text as notes
union all
select 'IO029'::text as reference, 'IO029'::text as code, 'IO DEGRAISSANT ULTRA PUISSANT VAISSELLE CITRON/BERGAMOTTE 500 ml'::text as name, 'IO DEGRAISSANT ULTRA PUISSANT VAISSELLE CITRON/BERGAMOTTE 500 ml'::text as short_description, 'Liquide vaisselle mains | CUISINE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'liquide-vaisselle-mains'::text as category_slug, null::text as notes
union all
select 'IOPRO020'::text as reference, 'IOPRO020'::text as code, 'BAC VERRE 1L Idéal pour les bars à bières'::text as name, 'BAC VERRE 1L Idéal pour les bars à bières'::text as short_description, 'Liquide vaisselle mains | CUISINE'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'liquide-vaisselle-mains'::text as category_slug, null::text as notes
union all
select 'IOPRO027'::text as reference, 'IOPRO027'::text as code, 'LIQUIDE DE TREMPAGE 5L'::text as name, 'LIQUIDE DE TREMPAGE 5L'::text as short_description, 'Liquide vaisselle mains | CUISINE'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'liquide-vaisselle-mains'::text as category_slug, null::text as notes
union all
select 'IOPRO022'::text as reference, 'IOPRO022'::text as code, 'VERRE ECLAT LLV 1L'::text as name, 'VERRE ECLAT LLV 1L'::text as short_description, 'Liquide Lavage Machine | CUISINE'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'liquide-lavage-machine'::text as category_slug, null::text as notes
union all
select 'IOPRO024'::text as reference, 'IOPRO024'::text as code, 'LVM MACHINE EAU DURE et DOUCE 5L'::text as name, 'LVM MACHINE EAU DURE et DOUCE 5L'::text as short_description, 'Liquide Lavage Machine | CUISINE'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'liquide-lavage-machine'::text as category_slug, null::text as notes
union all
select 'IOPRO025'::text as reference, 'IOPRO025'::text as code, 'LVM MACHINE EAU DURE et DOUCE 20L'::text as name, 'LVM MACHINE EAU DURE et DOUCE 20L'::text as short_description, 'Liquide Lavage Machine | CUISINE'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '20L'::text as packaging, '20L'::text as unit, 'liquide-lavage-machine'::text as category_slug, null::text as notes
union all
select 'IOPRO026'::text as reference, 'IOPRO026'::text as code, 'LIQUIDE RINCAGE RVM 5L'::text as name, 'LIQUIDE RINCAGE RVM 5L'::text as short_description, 'Liquide Rinçage Machine | CUISINE'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'liquide-rincage-machine'::text as category_slug, null::text as notes
union all
select 'IOPRO026-20'::text as reference, 'IOPRO026-20'::text as code, 'LIQUIDE RINCAGE RVM 20L'::text as name, 'LIQUIDE RINCAGE RVM 20L'::text as short_description, 'Liquide Rinçage Machine | CUISINE'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '20L'::text as packaging, '20L'::text as unit, 'liquide-rincage-machine'::text as category_slug, null::text as notes
union all
select 'ACT2002-5'::text as reference, 'ACT2002-5'::text as code, 'ACTIVATOP SOL CUISINE ET INDUSTRIEL  5L'::text as name, 'ACTIVATOP SOL CUISINE ET INDUSTRIEL  5L'::text as short_description, 'Surfaces | CUISINE'::text as long_description, 'ACTIVATOP'::text as brand, 'ACTIVATOP'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'surfaces'::text as category_slug, null::text as notes
union all
select 'IO011'::text as reference, 'IO011'::text as code, 'IO DEGRAISSANT SPECIAL CUISINE 625 ml'::text as name, 'IO DEGRAISSANT SPECIAL CUISINE 625 ml'::text as short_description, 'Surfaces | CUISINE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '625ml'::text as packaging, '625ml'::text as unit, 'surfaces'::text as category_slug, null::text as notes
union all
select 'IOPRO012'::text as reference, 'IOPRO012'::text as code, 'SUPER DEGRAISSANT 500ml'::text as name, 'SUPER DEGRAISSANT 500ml'::text as short_description, 'Surfaces | CUISINE'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'surfaces'::text as category_slug, null::text as notes
union all
select 'IOPRO012-5'::text as reference, 'IOPRO012-5'::text as code, 'SUPER DEGRAISSANT 5L'::text as name, 'SUPER DEGRAISSANT 5L'::text as short_description, 'Surfaces | CUISINE'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'surfaces'::text as category_slug, null::text as notes
union all
select 'IOPRO028-750'::text as reference, 'IOPRO028-750'::text as code, 'DÉGRAISSANT DÉSINFECTANT MOUSSANT ALIMENTAIRE 750ml PAE'::text as name, 'DÉGRAISSANT DÉSINFECTANT MOUSSANT ALIMENTAIRE 750ml PAE'::text as short_description, 'Désinfectants Surfaces | CUISINE'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '750ml'::text as packaging, '750ml'::text as unit, 'desinfectants-surfaces'::text as category_slug, null::text as notes
union all
select 'IOPRO028'::text as reference, 'IOPRO028'::text as code, 'DÉGRAISSANT DÉSINFECTANT MOUSSANT ALIMENTAIRE CONCENTRE 5L'::text as name, 'DÉGRAISSANT DÉSINFECTANT MOUSSANT ALIMENTAIRE CONCENTRE 5L'::text as short_description, 'Désinfectants Surfaces | CUISINE'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'desinfectants-surfaces'::text as category_slug, null::text as notes
union all
select 'IOPRO021'::text as reference, 'IOPRO021'::text as code, 'DETARTRANT MACHINE 5L'::text as name, 'DETARTRANT MACHINE 5L'::text as short_description, 'Détartrant Machine | CUISINE'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'detartrant-machine'::text as category_slug, null::text as notes
union all
select 'IO006'::text as reference, 'IO006'::text as code, 'IO NETTOYANT SPECIAL FOUR 750 ml'::text as name, 'IO NETTOYANT SPECIAL FOUR 750 ml'::text as short_description, 'Four, Plancha, Plaque | CUISINE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '750mL'::text as packaging, '750mL'::text as unit, 'four-plancha-plaque'::text as category_slug, null::text as notes
union all
select 'IOPRO031'::text as reference, 'IOPRO031'::text as code, 'IO NETTOYANT PLANCHA 180° FLACON 1L'::text as name, 'IO NETTOYANT PLANCHA 180° FLACON 1L'::text as short_description, 'Four, Plancha, Plaque | CUISINE'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'four-plancha-plaque'::text as category_slug, null::text as notes
union all
select 'IOPRO014'::text as reference, 'IOPRO014'::text as code, 'NETTOYANT PLANCHA'::text as name, 'NETTOYANT PLANCHA'::text as short_description, 'Four, Plancha, Plaque | CUISINE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '750ml'::text as packaging, '750ml'::text as unit, 'four-plancha-plaque'::text as category_slug, null::text as notes
union all
select 'IOPRO017'::text as reference, 'IOPRO017'::text as code, 'NETTOYANT FOUR BOULANGERIE'::text as name, 'NETTOYANT FOUR BOULANGERIE'::text as short_description, 'Four, Plancha, Plaque | CUISINE'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'four-plancha-plaque'::text as category_slug, null::text as notes
union all
select 'IOPRO017-5'::text as reference, 'IOPRO017-5'::text as code, 'NETTOYANT FOUR BOULANGERIE'::text as name, 'NETTOYANT FOUR BOULANGERIE'::text as short_description, 'Four, Plancha, Plaque | CUISINE'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'four-plancha-plaque'::text as category_slug, null::text as notes
union all
select 'IOPRO023'::text as reference, 'IOPRO023'::text as code, 'RENOVATEUR METAUX 750ML'::text as name, 'RENOVATEUR METAUX 750ML'::text as short_description, 'Rénovateur Métaux | CUISINE'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '750ml'::text as packaging, '750ml'::text as unit, 'renovateur-metaux'::text as category_slug, null::text as notes
union all
select 'CREMARGMET'::text as reference, 'CREMARGMET'::text as code, 'CREME NETTOYANTE ARGENT & METAUX 250 ml  (Nouveauté)'::text as name, 'CREME NETTOYANTE ARGENT & METAUX 250 ml  (Nouveauté)'::text as short_description, 'Rénovateur Métaux | CUISINE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '250ml'::text as packaging, '250ml'::text as unit, 'renovateur-metaux'::text as category_slug, null::text as notes
union all
select 'PIERRENET'::text as reference, 'PIERRENET'::text as code, 'PIERRE DE NETTOYAGE BLANCHE 300 GR  (Nouveauté)'::text as name, 'PIERRE DE NETTOYAGE BLANCHE 300 GR  (Nouveauté)'::text as short_description, 'Rénovateur Métaux | CUISINE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '300gr'::text as packaging, '300gr'::text as unit, 'renovateur-metaux'::text as category_slug, null::text as notes
union all
select 'LES 7500'::text as reference, 'LES 7500'::text as code, 'NILOZYM - 1L'::text as name, 'NILOZYM - 1L'::text as short_description, 'Traitement Canalisations / Bac à graisse | CUISINE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'traitement-canalisations-bac-a-graisse'::text as category_slug, null::text as notes
union all
select 'LES 7503'::text as reference, 'LES 7503'::text as code, 'NILOZYM - 5L'::text as name, 'NILOZYM - 5L'::text as short_description, 'Traitement Canalisations / Bac à graisse | CUISINE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'traitement-canalisations-bac-a-graisse'::text as category_slug, null::text as notes
union all
select 'ACT1129-5'::text as reference, 'ACT1129-5'::text as code, 'ACTIVATOP GT 1X - 5L'::text as name, 'ACTIVATOP GT 1X - 5L'::text as short_description, 'Traitement Canalisations / Bac à graisse | CUISINE'::text as long_description, 'ACTIVATOP'::text as brand, 'ACTIVATOP'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'traitement-canalisations-bac-a-graisse'::text as category_slug, null::text as notes
union all
select '1105'::text as reference, '1105'::text as code, 'SAVON LAVE MAINS TRADITIONNEL 500 ml'::text as name, 'SAVON LAVE MAINS TRADITIONNEL 500 ml'::text as short_description, 'None | CORPOREL'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'none'::text as category_slug, null::text as notes
union all
select '1107'::text as reference, '1107'::text as code, 'SAVON LAVE MAINS LAVANDE 500ML  (Nouveauté)'::text as name, 'SAVON LAVE MAINS LAVANDE 500ML  (Nouveauté)'::text as short_description, 'None | CORPOREL'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'none'::text as category_slug, null::text as notes
union all
select '1108'::text as reference, '1108'::text as code, 'SAVON LAVE MAINS PEAUX SENSIBLES 500ML  (Nouveauté)'::text as name, 'SAVON LAVE MAINS PEAUX SENSIBLES 500ML  (Nouveauté)'::text as short_description, 'None | CORPOREL'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'none'::text as category_slug, null::text as notes
union all
select '1109'::text as reference, '1109'::text as code, 'SAVON LAVE MAINS DERMO 500ML  (Nouveauté)'::text as name, 'SAVON LAVE MAINS DERMO 500ML  (Nouveauté)'::text as short_description, 'None | CORPOREL'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'none'::text as category_slug, null::text as notes
union all
select 'SHKERA'::text as reference, 'SHKERA'::text as code, 'SHAMPOING A LA KERATINE 270 ml (Nouveauté)'::text as name, 'SHAMPOING A LA KERATINE 270 ml (Nouveauté)'::text as short_description, 'None | SHAMPOING'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '270ML'::text as packaging, '270ML'::text as unit, 'none'::text as category_slug, null::text as notes
union all
select 'SHGRAS'::text as reference, 'SHGRAS'::text as code, 'SHAMPOING CHEVEUX GRAS 270 ml (Nouveauté)'::text as name, 'SHAMPOING CHEVEUX GRAS 270 ml (Nouveauté)'::text as short_description, 'None | SHAMPOING'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '270ML'::text as packaging, '270ML'::text as unit, 'none'::text as category_slug, null::text as notes
union all
select 'SHFINS'::text as reference, 'SHFINS'::text as code, 'SHAMPOING CHEVEUX FINS 270 ml (Nouveauté)'::text as name, 'SHAMPOING CHEVEUX FINS 270 ml (Nouveauté)'::text as short_description, 'None | SHAMPOING'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '270ML'::text as packaging, '270ML'::text as unit, 'none'::text as category_slug, null::text as notes
union all
select 'SHABIM'::text as reference, 'SHABIM'::text as code, 'SHAMPOING CHEVEUX ABIMES 270 ml (Nouveauté)'::text as name, 'SHAMPOING CHEVEUX ABIMES 270 ml (Nouveauté)'::text as short_description, 'None | SHAMPOING'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '270ML'::text as packaging, '270ML'::text as unit, 'none'::text as category_slug, null::text as notes
union all
select 'GELDOUROSE'::text as reference, 'GELDOUROSE'::text as code, 'GEL DOUCHE ROSE MUSQUE 1250 ml (Nouveauté)'::text as name, 'GEL DOUCHE ROSE MUSQUE 1250 ml (Nouveauté)'::text as short_description, 'None | GEL DOUCHE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '1,250 L'::text as packaging, '1,250 L'::text as unit, 'none'::text as category_slug, null::text as notes
union all
select 'GELDOUTRAD'::text as reference, 'GELDOUTRAD'::text as code, 'GEL DOUCHE TRADITIONNEL 1250 ml (Nouveauté)'::text as name, 'GEL DOUCHE TRADITIONNEL 1250 ml (Nouveauté)'::text as short_description, 'None | GEL DOUCHE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '1,250 L'::text as packaging, '1,250 L'::text as unit, 'none'::text as category_slug, null::text as notes
union all
select 'GELDOUSENS'::text as reference, 'GELDOUSENS'::text as code, 'GEL DOUCHE SENSITIVE 1250 ml (Nouveauté)'::text as name, 'GEL DOUCHE SENSITIVE 1250 ml (Nouveauté)'::text as short_description, 'None | GEL DOUCHE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '1,250 L'::text as packaging, '1,250 L'::text as unit, 'none'::text as category_slug, null::text as notes
union all
select 'GELDOUCLAS'::text as reference, 'GELDOUCLAS'::text as code, 'GEL DOUCHE CLASSIQUE 1250 ml (Nouveauté)'::text as name, 'GEL DOUCHE CLASSIQUE 1250 ml (Nouveauté)'::text as short_description, 'None | GEL DOUCHE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '1,250 L'::text as packaging, '1,250 L'::text as unit, 'none'::text as category_slug, null::text as notes
union all
select 'BIO1103'::text as reference, 'BIO1103'::text as code, 'BIOBACTER MENTHE 1L'::text as name, 'BIOBACTER MENTHE 1L'::text as short_description, 'Surfaces et Canalisations | SANITAIRES'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'surfaces-et-canalisations'::text as category_slug, null::text as notes
union all
select 'BIO1103-TM'::text as reference, 'BIO1103-TM'::text as code, 'BIOBACTER TANGO MANGO 1L'::text as name, 'BIOBACTER TANGO MANGO 1L'::text as short_description, 'Surfaces et Canalisations | SANITAIRES'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'surfaces-et-canalisations'::text as category_slug, null::text as notes
union all
select 'BIO1103-5'::text as reference, 'BIO1103-5'::text as code, 'BIOBACTER MENTHE 5L'::text as name, 'BIOBACTER MENTHE 5L'::text as short_description, 'Surfaces et Canalisations | SANITAIRES'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'surfaces-et-canalisations'::text as category_slug, null::text as notes
union all
select 'BIO1103-5TM'::text as reference, 'BIO1103-5TM'::text as code, 'BIOBACTER TANGO MANGO 5L'::text as name, 'BIOBACTER TANGO MANGO 5L'::text as short_description, 'Surfaces et Canalisations | SANITAIRES'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'surfaces-et-canalisations'::text as category_slug, null::text as notes
union all
select 'IOPRO029'::text as reference, 'IOPRO029'::text as code, 'DETARTRANT DESINFECTANT  SANITAIRE 4D 750ml'::text as name, 'DETARTRANT DESINFECTANT  SANITAIRE 4D 750ml'::text as short_description, 'Nettoyants, Détartrants, Désinfectants | SANITAIRES'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '750ml'::text as packaging, '750ml'::text as unit, 'nettoyants-detartrants-desinfectants'::text as category_slug, null::text as notes
union all
select 'IOPRO029-5'::text as reference, 'IOPRO029-5'::text as code, 'DETARTRANT DESINFECTANT  SANITAIRE 4D 5L'::text as name, 'DETARTRANT DESINFECTANT  SANITAIRE 4D 5L'::text as short_description, 'Nettoyants, Détartrants, Désinfectants | SANITAIRES'::text as long_description, 'IO PRO'::text as brand, 'IO PRO'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'nettoyants-detartrants-desinfectants'::text as category_slug, null::text as notes
union all
select 'IO024'::text as reference, 'IO024'::text as code, 'IO NETTOYANT SALLE DE BAIN 625 ml'::text as name, 'IO NETTOYANT SALLE DE BAIN 625 ml'::text as short_description, 'Nettoyants, Détartrants, Désinfectants | SANITAIRES'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '625ml'::text as packaging, '625ml'::text as unit, 'nettoyants-detartrants-desinfectants'::text as category_slug, null::text as notes
union all
select 'IO020'::text as reference, 'IO020'::text as code, 'IO ANTICALCAIRE SALLE DE BAIN 625 ml'::text as name, 'IO ANTICALCAIRE SALLE DE BAIN 625 ml'::text as short_description, 'Nettoyants, Détartrants, Désinfectants | SANITAIRES'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '625ml'::text as packaging, '625ml'::text as unit, 'nettoyants-detartrants-desinfectants'::text as category_slug, null::text as notes
union all
select 'ACT1103'::text as reference, 'ACT1103'::text as code, 'ACTIVATOP POUDRE FOSSES SEPTIQUES - 750 gr'::text as name, 'ACTIVATOP POUDRE FOSSES SEPTIQUES - 750 gr'::text as short_description, 'Fosse septique | SANITAIRES'::text as long_description, 'ACTIVATOP'::text as brand, 'ACTIVATOP'::text as range_name, '750 gr'::text as packaging, '750 gr'::text as unit, 'fosse-septique'::text as category_slug, null::text as notes
union all
select 'IO037'::text as reference, 'IO037'::text as code, 'IO GEL WC  DETARTRANT BLEU OCEAN BEC VERSEUR 750 ml'::text as name, 'IO GEL WC  DETARTRANT BLEU OCEAN BEC VERSEUR 750 ml'::text as short_description, 'Wc, Urinoir | SANITAIRES'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '750ml'::text as packaging, '750ml'::text as unit, 'wc-urinoir'::text as category_slug, null::text as notes
union all
select 'IO038'::text as reference, 'IO038'::text as code, 'IO GEL WC DETARTRANT VERT PIN BEC VERSEUR 750 ml'::text as name, 'IO GEL WC DETARTRANT VERT PIN BEC VERSEUR 750 ml'::text as short_description, 'Wc, Urinoir | SANITAIRES'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '750ml'::text as packaging, '750ml'::text as unit, 'wc-urinoir'::text as category_slug, null::text as notes
union all
select 'IO036'::text as reference, 'IO036'::text as code, 'IO GEL WC DETARTRANT JAVEL BEC VERSEUR 750 ml'::text as name, 'IO GEL WC DETARTRANT JAVEL BEC VERSEUR 750 ml'::text as short_description, 'Wc, Urinoir | SANITAIRES'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '750ml'::text as packaging, '750ml'::text as unit, 'wc-urinoir'::text as category_slug, null::text as notes
union all
select '1529'::text as reference, '1529'::text as code, 'BLOCS WC 5 DROPS OCEAN 2 x 55 gr'::text as name, 'BLOCS WC 5 DROPS OCEAN 2 x 55 gr'::text as short_description, 'Wc, Urinoir | SANITAIRES'::text as long_description, 'SPLUFF'::text as brand, 'SPLUFF'::text as range_name, '2x55g'::text as packaging, '2x55g'::text as unit, 'wc-urinoir'::text as category_slug, null::text as notes
union all
select '593'::text as reference, '593'::text as code, 'BLOCS WC JAVEL 2 X 40 gr'::text as name, 'BLOCS WC JAVEL 2 X 40 gr'::text as short_description, 'Wc, Urinoir | SANITAIRES'::text as long_description, 'SPLUFF'::text as brand, 'SPLUFF'::text as range_name, '2x40g'::text as packaging, '2x40g'::text as unit, 'wc-urinoir'::text as category_slug, null::text as notes
union all
select 'LES7605'::text as reference, 'LES7605'::text as code, 'BLOC ENZYME'::text as name, 'BLOC ENZYME'::text as short_description, 'Wc, Urinoir | SANITAIRES'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'pièce'::text as packaging, 'pièce'::text as unit, 'wc-urinoir'::text as category_slug, null::text as notes
union all
select 'LES7600'::text as reference, 'LES7600'::text as code, 'NILOBLOC GRILLE'::text as name, 'NILOBLOC GRILLE'::text as short_description, 'Wc, Urinoir | SANITAIRES'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'pièce'::text as packaging, 'pièce'::text as unit, 'wc-urinoir'::text as category_slug, null::text as notes
union all
select '53900'::text as reference, '53900'::text as code, 'DEBOUCHEUR DISOLVO ALCALIN 1L'::text as name, 'DEBOUCHEUR DISOLVO ALCALIN 1L'::text as short_description, 'Liquide | DEBOUCHEURS'::text as long_description, 'DISOLVO'::text as brand, 'DISOLVO'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'liquide'::text as category_slug, null::text as notes
union all
select '53600'::text as reference, '53600'::text as code, 'DEBOUCHEUR GEL AVEC JAVEL DISOLVO ALCALIN 1L'::text as name, 'DEBOUCHEUR GEL AVEC JAVEL DISOLVO ALCALIN 1L'::text as short_description, 'Liquide | DEBOUCHEURS'::text as long_description, 'DISOLVO'::text as brand, 'DISOLVO'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'liquide'::text as category_slug, null::text as notes
union all
select 'IO022'::text as reference, 'IO022'::text as code, 'IO DEBOUCHEUR GEL 1L'::text as name, 'IO DEBOUCHEUR GEL 1L'::text as short_description, 'Liquide | DEBOUCHEURS'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'liquide'::text as category_slug, null::text as notes
union all
select '53100'::text as reference, '53100'::text as code, 'SOUDE CAUSTIQUE ANHYDRE 1Kg'::text as name, 'SOUDE CAUSTIQUE ANHYDRE 1Kg'::text as short_description, 'Solide | DEBOUCHEURS'::text as long_description, 'DISOLVO'::text as brand, 'DISOLVO'::text as range_name, '1 Kg'::text as packaging, '1 Kg'::text as unit, 'solide'::text as category_slug, null::text as notes
union all
select '53750'::text as reference, '53750'::text as code, 'DEBOUCHEUR PAILLETTES 750 gr'::text as name, 'DEBOUCHEUR PAILLETTES 750 gr'::text as short_description, 'Solide | DEBOUCHEURS'::text as long_description, 'DISOLVO'::text as brand, 'DISOLVO'::text as range_name, '750gr'::text as packaging, '750gr'::text as unit, 'solide'::text as category_slug, null::text as notes
union all
select 'CIM07'::text as reference, 'CIM07'::text as code, 'BIOCIME DEBOUCHEUR BIOLOGIQUE 500 ml'::text as name, 'BIOCIME DEBOUCHEUR BIOLOGIQUE 500 ml'::text as short_description, 'Solide | DEBOUCHEURS'::text as long_description, 'BIOCIME'::text as brand, 'BIOCIME'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'solide'::text as category_slug, null::text as notes
union all
select '160'::text as reference, '160'::text as code, '20 SACS POUBELLE LIEN COULISSANTS 30L'::text as name, '20 SACS POUBELLE LIEN COULISSANTS 30L'::text as short_description, 'None | SAC A DECHET NETTOYANT POUBELLES'::text as long_description, 'SPHERE'::text as brand, 'SPHERE'::text as range_name, 'rouleau'::text as packaging, 'rouleau'::text as unit, 'none'::text as category_slug, null::text as notes
union all
select '164'::text as reference, '164'::text as code, '10 SACS POUBELLE LIEN COULISSANTS 50L'::text as name, '10 SACS POUBELLE LIEN COULISSANTS 50L'::text as short_description, 'None | SAC A DECHET NETTOYANT POUBELLES'::text as long_description, 'SPHERE'::text as brand, 'SPHERE'::text as range_name, 'rouleau'::text as packaging, 'rouleau'::text as unit, 'none'::text as category_slug, null::text as notes
union all
select '159'::text as reference, '159'::text as code, '10 SACS POUBELLE LIEN COULISSANTS 100L'::text as name, '10 SACS POUBELLE LIEN COULISSANTS 100L'::text as short_description, 'None | SAC A DECHET NETTOYANT POUBELLES'::text as long_description, 'SPHERE'::text as brand, 'SPHERE'::text as range_name, 'rouleau'::text as packaging, 'rouleau'::text as unit, 'none'::text as category_slug, null::text as notes
union all
select 'IO044'::text as reference, 'IO044'::text as code, 'LESSIVE SAVON DE MARSEILLE POUR MACHINE A LAVER & MAINS 3L 120 Lavages'::text as name, 'LESSIVE SAVON DE MARSEILLE POUR MACHINE A LAVER & MAINS 3L 120 Lavages'::text as short_description, 'Lessive Liquide | LINGE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '3L'::text as packaging, '3L'::text as unit, 'lessive-liquide'::text as category_slug, null::text as notes
union all
select 'LESSMA-5'::text as reference, 'LESSMA-5'::text as code, 'LESSIVE LIQUIDE SAVON MARSEILLE 5L  (Nouveauté)'::text as name, 'LESSIVE LIQUIDE SAVON MARSEILLE 5L  (Nouveauté)'::text as short_description, 'Lessive Liquide | LINGE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'lessive-liquide'::text as category_slug, null::text as notes
union all
select 'LESSAV-5'::text as reference, 'LESSAV-5'::text as code, 'LESSIVE LIQUIDE ALOE VERA 5L  (Nouveauté)'::text as name, 'LESSIVE LIQUIDE ALOE VERA 5L  (Nouveauté)'::text as short_description, 'Lessive Liquide | LINGE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'lessive-liquide'::text as category_slug, null::text as notes
union all
select 'IO019'::text as reference, 'IO019'::text as code, 'IO LESSIVE TEXTILE COULEUR & DELICAT 1L'::text as name, 'IO LESSIVE TEXTILE COULEUR & DELICAT 1L'::text as short_description, 'Lessive Liquide | LINGE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'lessive-liquide'::text as category_slug, null::text as notes
union all
select 'IO014'::text as reference, 'IO014'::text as code, 'IO LESSIVE TEXTILE LAINE & DELICAT 1L'::text as name, 'IO LESSIVE TEXTILE LAINE & DELICAT 1L'::text as short_description, 'Lessive Liquide | LINGE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'lessive-liquide'::text as category_slug, null::text as notes
union all
select 'IO012'::text as reference, 'IO012'::text as code, 'IO DETACHANT UNIVERSEL 625 ml'::text as name, 'IO DETACHANT UNIVERSEL 625 ml'::text as short_description, 'Détachants | LINGE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '625ml'::text as packaging, '625ml'::text as unit, 'detachants'::text as category_slug, null::text as notes
union all
select 'IO013'::text as reference, 'IO013'::text as code, 'IO DETACHANT UNIVERSEL SANS JAVEL 625 ml'::text as name, 'IO DETACHANT UNIVERSEL SANS JAVEL 625 ml'::text as short_description, 'Détachants | LINGE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '625ml'::text as packaging, '625ml'::text as unit, 'detachants'::text as category_slug, null::text as notes
union all
select 'UACLIP-AS'::text as reference, 'UACLIP-AS'::text as code, 'ULTRA AIR CLIP 2.0 POMME'::text as name, 'ULTRA AIR CLIP 2.0 POMME'::text as short_description, 'Clips | LINGE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'clips'::text as category_slug, null::text as notes
union all
select 'UACLIP-FS'::text as reference, 'UACLIP-FS'::text as code, 'ULTRA AIR CLIP 2.0 TUTTI FRUTTI'::text as name, 'ULTRA AIR CLIP 2.0 TUTTI FRUTTI'::text as short_description, 'Clips | LINGE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'clips'::text as category_slug, null::text as notes
union all
select 'UACLIP-TM'::text as reference, 'UACLIP-TM'::text as code, 'ULTRA AIR CLIP 2.0 TANGO MANGO'::text as name, 'ULTRA AIR CLIP 2.0 TANGO MANGO'::text as short_description, 'Clips | LINGE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'clips'::text as category_slug, null::text as notes
union all
select 'UACLIP-SL'::text as reference, 'UACLIP-SL'::text as code, 'ULTRA AIR CLIP 2.0 DOUCEUR'::text as name, 'ULTRA AIR CLIP 2.0 DOUCEUR'::text as short_description, 'Clips | LINGE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'clips'::text as category_slug, null::text as notes
union all
select 'UAH-AS'::text as reference, 'UAH-AS'::text as code, 'ULTRA AIR ACCORDEON POMME'::text as name, 'ULTRA AIR ACCORDEON POMME'::text as short_description, 'Accordéons | LINGE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'accordeons'::text as category_slug, null::text as notes
union all
select 'UAH-TM'::text as reference, 'UAH-TM'::text as code, 'ULTRA AIR ACCORDEON TANGO MANGO'::text as name, 'ULTRA AIR ACCORDEON TANGO MANGO'::text as short_description, 'Accordéons | LINGE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'accordeons'::text as category_slug, null::text as notes
union all
select 'UAH-M'::text as reference, 'UAH-M'::text as code, 'ULTRA AIR ACCORDEON MENTHE'::text as name, 'ULTRA AIR ACCORDEON MENTHE'::text as short_description, 'Accordéons | LINGE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'accordeons'::text as category_slug, null::text as notes
union all
select 'UAH-SL'::text as reference, 'UAH-SL'::text as code, 'ULTRA AIR ACCORDEON DOUCEUR'::text as name, 'ULTRA AIR ACCORDEON DOUCEUR'::text as short_description, 'Accordéons | LINGE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'accordeons'::text as category_slug, null::text as notes
union all
select 'UARF-CAB'::text as reference, 'UARF-CAB'::text as code, 'ULTRA AIR CABINE'::text as name, 'ULTRA AIR CABINE'::text as short_description, 'Air Sapin | LINGE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'air-sapin'::text as category_slug, null::text as notes
union all
select 'UARF-AS'::text as reference, 'UARF-AS'::text as code, 'ULTRA AIR SAPIN POMME'::text as name, 'ULTRA AIR SAPIN POMME'::text as short_description, 'Air Sapin | LINGE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'air-sapin'::text as category_slug, null::text as notes
union all
select 'UARF-TM'::text as reference, 'UARF-TM'::text as code, 'ULTRA AIR SAPIN TANGO MANGO'::text as name, 'ULTRA AIR SAPIN TANGO MANGO'::text as short_description, 'Air Sapin | LINGE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'air-sapin'::text as category_slug, null::text as notes
union all
select 'UARF-SL'::text as reference, 'UARF-SL'::text as code, 'ULTRA AIR SAPIN DOUCEUR'::text as name, 'ULTRA AIR SAPIN DOUCEUR'::text as short_description, 'Air Sapin | LINGE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'air-sapin'::text as category_slug, null::text as notes
union all
select 'UA2-TM'::text as reference, 'UA2-TM'::text as code, 'ULTRA GRILLE 2.0 TANGO MANGO'::text as name, 'ULTRA GRILLE 2.0 TANGO MANGO'::text as short_description, 'Grilles | LINGE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'grilles'::text as category_slug, null::text as notes
union all
select 'UA2-CM'::text as reference, 'UA2-CM'::text as code, 'ULTRA GRILLE 2.0 MELON'::text as name, 'ULTRA GRILLE 2.0 MELON'::text as short_description, 'Grilles | LINGE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'grilles'::text as category_slug, null::text as notes
union all
select 'UA2-SL'::text as reference, 'UA2-SL'::text as code, 'ULTRA GRILLE 2.0 DOUCEUR'::text as name, 'ULTRA GRILLE 2.0 DOUCEUR'::text as short_description, 'Grilles | LINGE'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'grilles'::text as category_slug, null::text as notes
union all
select 'NIL 4609'::text as reference, 'NIL 4609'::text as code, 'NILODOR GOUTTES 15 ml'::text as name, 'NILODOR GOUTTES 15 ml'::text as short_description, 'Neutralisants et destructeurs d''odeurs | GAMME NILODOR'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '15 ml'::text as packaging, '15 ml'::text as unit, 'neutralisants-et-destructeurs-d-odeurs'::text as category_slug, null::text as notes
union all
select 'NIL4921O'::text as reference, 'NIL4921O'::text as code, 'NILIUM ORIGINAL 1L Doseur'::text as name, 'NILIUM ORIGINAL 1L Doseur'::text as short_description, 'Neutralisants et destructeurs d''odeurs | GAMME NILODOR'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '1L Doseur'::text as packaging, '1L Doseur'::text as unit, 'neutralisants-et-destructeurs-d-odeurs'::text as category_slug, null::text as notes
union all
select 'NIL4921T'::text as reference, 'NIL4921T'::text as code, 'NILIUM THE ROUGE 1L  Doseur'::text as name, 'NILIUM THE ROUGE 1L  Doseur'::text as short_description, 'Neutralisants et destructeurs d''odeurs | GAMME NILODOR'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '1L Doseur'::text as packaging, '1L Doseur'::text as unit, 'neutralisants-et-destructeurs-d-odeurs'::text as category_slug, null::text as notes
union all
select 'NIL4921-5O'::text as reference, 'NIL4921-5O'::text as code, 'NILIUM ORIGINAL 5L'::text as name, 'NILIUM ORIGINAL 5L'::text as short_description, 'Neutralisants et destructeurs d''odeurs | GAMME NILODOR'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'neutralisants-et-destructeurs-d-odeurs'::text as category_slug, null::text as notes
union all
select 'NIL4921-5T'::text as reference, 'NIL4921-5T'::text as code, 'NILIUM THE ROUGE 5L'::text as name, 'NILIUM THE ROUGE 5L'::text as short_description, 'Neutralisants et destructeurs d''odeurs | GAMME NILODOR'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'neutralisants-et-destructeurs-d-odeurs'::text as category_slug, null::text as notes
union all
select 'NIL4913'::text as reference, 'NIL4913'::text as code, 'NILODOR VAPORISATEUR ORIGINAL 200 ml'::text as name, 'NILODOR VAPORISATEUR ORIGINAL 200 ml'::text as short_description, 'Neutralisants et destructeurs d''odeurs | GAMME NILODOR'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '200 ml'::text as packaging, '200 ml'::text as unit, 'neutralisants-et-destructeurs-d-odeurs'::text as category_slug, null::text as notes
union all
select 'NIL4913S'::text as reference, 'NIL4913S'::text as code, 'NILODOR VAPORISATEUR DOUCEUR 200 ml'::text as name, 'NILODOR VAPORISATEUR DOUCEUR 200 ml'::text as short_description, 'Neutralisants et destructeurs d''odeurs | GAMME NILODOR'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '200 ml'::text as packaging, '200 ml'::text as unit, 'neutralisants-et-destructeurs-d-odeurs'::text as category_slug, null::text as notes
union all
select 'NIL 4912'::text as reference, 'NIL 4912'::text as code, 'NILODOR VAPO ORIGINAL 500 ml (sur commande spéciale)'::text as name, 'NILODOR VAPO ORIGINAL 500 ml (sur commande spéciale)'::text as short_description, 'Neutralisants et destructeurs d''odeurs | GAMME NILODOR'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'neutralisants-et-destructeurs-d-odeurs'::text as category_slug, null::text as notes
union all
select 'AS00302'::text as reference, 'AS00302'::text as code, 'NILODISCS ORIGINAL boîte de 12 disques'::text as name, 'NILODISCS ORIGINAL boîte de 12 disques'::text as short_description, 'Neutralisants et destructeurs d''odeurs | GAMME NILODOR'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'neutralisants-et-destructeurs-d-odeurs'::text as category_slug, null::text as notes
union all
select 'LES 7504'::text as reference, 'LES 7504'::text as code, 'NILOSORB - Flacon poudreur 311 gr'::text as name, 'NILOSORB - Flacon poudreur 311 gr'::text as short_description, 'Absorbants NILODOR | GAMME NILODOR'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, '311gr'::text as packaging, '311gr'::text as unit, 'absorbants-nilodor'::text as category_slug, null::text as notes
union all
select 'LES 7506'::text as reference, 'LES 7506'::text as code, 'NILOGEL - Flacon poudreur 750 ml/284 gr'::text as name, 'NILOGEL - Flacon poudreur 750 ml/284 gr'::text as short_description, 'Absorbants NILODOR | GAMME NILODOR'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'absorbants-nilodor'::text as category_slug, null::text as notes
union all
select 'MINI-SOK'::text as reference, 'MINI-SOK'::text as code, 'MINI SUPER SOCK ORIGINAL'::text as name, 'MINI SUPER SOCK ORIGINAL'::text as short_description, 'Poubelles Locaux, Parking neutralisation très longue durée et grands surfaces | GAMME NILODOR'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'la  sock'::text as packaging, 'la  sock'::text as unit, 'poubelles-locaux-parking-neutralisation-tres-longue-duree-et-grands-surfaces'::text as category_slug, null::text as notes
union all
select 'CTMINI'::text as reference, 'CTMINI'::text as code, 'MINI SUPER SOCK CITRON'::text as name, 'MINI SUPER SOCK CITRON'::text as short_description, 'Poubelles Locaux, Parking neutralisation très longue durée et grands surfaces | GAMME NILODOR'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'la  sock'::text as packaging, 'la  sock'::text as unit, 'poubelles-locaux-parking-neutralisation-tres-longue-duree-et-grands-surfaces'::text as category_slug, null::text as notes
union all
select 'CT-SOK'::text as reference, 'CT-SOK'::text as code, 'SUPER SOCK CITRON'::text as name, 'SUPER SOCK CITRON'::text as short_description, 'Poubelles Locaux, Parking neutralisation très longue durée et grands surfaces | GAMME NILODOR'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'la  sock'::text as packaging, 'la  sock'::text as unit, 'poubelles-locaux-parking-neutralisation-tres-longue-duree-et-grands-surfaces'::text as category_slug, null::text as notes
union all
select 'OR-SOK'::text as reference, 'OR-SOK'::text as code, 'SUPER SOCK ORIGINAL'::text as name, 'SUPER SOCK ORIGINAL'::text as short_description, 'Poubelles Locaux, Parking neutralisation très longue durée et grands surfaces | GAMME NILODOR'::text as long_description, 'NILODOR'::text as brand, 'NILODOR'::text as range_name, 'la  sock'::text as packaging, 'la  sock'::text as unit, 'poubelles-locaux-parking-neutralisation-tres-longue-duree-et-grands-surfaces'::text as category_slug, null::text as notes
union all
select '41'::text as reference, '41'::text as code, 'JAVEL  2,6% 1L'::text as name, 'JAVEL  2,6% 1L'::text as short_description, 'Javels | DROGUERIE'::text as long_description, 'OXENA'::text as brand, 'OXENA'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'javels'::text as category_slug, null::text as notes
union all
select '42'::text as reference, '42'::text as code, 'JAVEL  2,6% 2L'::text as name, 'JAVEL  2,6% 2L'::text as short_description, 'Javels | DROGUERIE'::text as long_description, 'OXENA'::text as brand, 'OXENA'::text as range_name, '2L'::text as packaging, '2L'::text as unit, 'javels'::text as category_slug, null::text as notes
union all
select '43'::text as reference, '43'::text as code, 'JAVEL  2,6% 5L'::text as name, 'JAVEL  2,6% 5L'::text as short_description, 'Javels | DROGUERIE'::text as long_description, 'OXENA'::text as brand, 'OXENA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'javels'::text as category_slug, null::text as notes
union all
select '44'::text as reference, '44'::text as code, 'JAVEL 2,6% EUCALYPTUS 2L'::text as name, 'JAVEL 2,6% EUCALYPTUS 2L'::text as short_description, 'Javels | DROGUERIE'::text as long_description, 'OXENA'::text as brand, 'OXENA'::text as range_name, '2L'::text as packaging, '2L'::text as unit, 'javels'::text as category_slug, null::text as notes
union all
select '871'::text as reference, '871'::text as code, 'JAVEL 2,6% CITRON 2L'::text as name, 'JAVEL 2,6% CITRON 2L'::text as short_description, 'Javels | DROGUERIE'::text as long_description, 'OXENA'::text as brand, 'OXENA'::text as range_name, '2L'::text as packaging, '2L'::text as unit, 'javels'::text as category_slug, null::text as notes
union all
select '45'::text as reference, '45'::text as code, 'JAVEL 9,6% 5L'::text as name, 'JAVEL 9,6% 5L'::text as short_description, 'Javels | DROGUERIE'::text as long_description, 'OXENA'::text as brand, 'OXENA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'javels'::text as category_slug, null::text as notes
union all
select '49'::text as reference, '49'::text as code, 'JAVEL PRO  9,6% 20L'::text as name, 'JAVEL PRO  9,6% 20L'::text as short_description, 'Javels | DROGUERIE'::text as long_description, 'OXENA'::text as brand, 'OXENA'::text as range_name, '20L'::text as packaging, '20L'::text as unit, 'javels'::text as category_slug, null::text as notes
union all
select '50'::text as reference, '50'::text as code, 'JAVEL Chlore liquide 12,5% 20L  (Nouveauté)'::text as name, 'JAVEL Chlore liquide 12,5% 20L  (Nouveauté)'::text as short_description, 'Javels | DROGUERIE'::text as long_description, 'OXENA'::text as brand, 'OXENA'::text as range_name, '20L'::text as packaging, '20L'::text as unit, 'javels'::text as category_slug, null::text as notes
union all
select '39'::text as reference, '39'::text as code, '150 PASTILLES CHLOREES BOITE 500 gr'::text as name, '150 PASTILLES CHLOREES BOITE 500 gr'::text as short_description, 'Javels | DROGUERIE'::text as long_description, 'OXENA'::text as brand, 'OXENA'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'javels'::text as category_slug, null::text as notes
union all
select '1071CB'::text as reference, '1071CB'::text as code, 'VINAIGRE MENAGER 14° 1L'::text as name, 'VINAIGRE MENAGER 14° 1L'::text as short_description, 'Entretien | DROGUERIE'::text as long_description, 'CB'::text as brand, 'CB'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'entretien'::text as category_slug, null::text as notes
union all
select '1076CB'::text as reference, '1076CB'::text as code, 'VINAIGRE MENAGER 14° 5L'::text as name, 'VINAIGRE MENAGER 14° 5L'::text as short_description, 'Entretien | DROGUERIE'::text as long_description, 'CB'::text as brand, 'CB'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'entretien'::text as category_slug, null::text as notes
union all
select '1078CB'::text as reference, '1078CB'::text as code, 'VINAIGRE 14° 20L  (Nouveauté)'::text as name, 'VINAIGRE 14° 20L  (Nouveauté)'::text as short_description, 'Entretien | DROGUERIE'::text as long_description, 'CB'::text as brand, 'CB'::text as range_name, '20L'::text as packaging, '20L'::text as unit, 'entretien'::text as category_slug, null::text as notes
union all
select '219'::text as reference, '219'::text as code, 'EAU DEMINERALISEE 5L'::text as name, 'EAU DEMINERALISEE 5L'::text as short_description, 'Entretien | DROGUERIE'::text as long_description, 'OXENA'::text as brand, 'OXENA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'entretien'::text as category_slug, null::text as notes
union all
select '229'::text as reference, '229'::text as code, 'EAU DEMINERALISEE 20L'::text as name, 'EAU DEMINERALISEE 20L'::text as short_description, 'Entretien | DROGUERIE'::text as long_description, 'OXENA'::text as brand, 'OXENA'::text as range_name, '20L'::text as packaging, '20L'::text as unit, 'entretien'::text as category_slug, null::text as notes
union all
select 'JABSO05'::text as reference, 'JABSO05'::text as code, 'BICARBONATE DE SOUDE 500 gr'::text as name, 'BICARBONATE DE SOUDE 500 gr'::text as short_description, 'Entretien | DROGUERIE'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '500gr'::text as packaging, '500gr'::text as unit, 'entretien'::text as category_slug, null::text as notes
union all
select 'IO047'::text as reference, 'IO047'::text as code, 'ALCOOL MENAGER CITRON 1L'::text as name, 'ALCOOL MENAGER CITRON 1L'::text as short_description, 'Entretien | DROGUERIE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'entretien'::text as category_slug, null::text as notes
union all
select '48'::text as reference, '48'::text as code, 'ALCOOL MENAGER PARFUME FLORAL 1L'::text as name, 'ALCOOL MENAGER PARFUME FLORAL 1L'::text as short_description, 'Entretien | DROGUERIE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'entretien'::text as category_slug, null::text as notes
union all
select '221'::text as reference, '221'::text as code, 'ACIDE CHLORHYDRIQUE 1L'::text as name, 'ACIDE CHLORHYDRIQUE 1L'::text as short_description, 'Entretien | DROGUERIE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'entretien'::text as category_slug, null::text as notes
union all
select '1531'::text as reference, '1531'::text as code, 'ACIDE CHLORHYDRIQUE 5L'::text as name, 'ACIDE CHLORHYDRIQUE 5L'::text as short_description, 'Entretien | DROGUERIE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'entretien'::text as category_slug, null::text as notes
union all
select '214'::text as reference, '214'::text as code, 'WHITE SPIRIT DC10 1L'::text as name, 'WHITE SPIRIT DC10 1L'::text as short_description, 'Diluants | DROGUERIE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'diluants'::text as category_slug, null::text as notes
union all
select '215'::text as reference, '215'::text as code, 'WHITE SPIRIT DC10 5L'::text as name, 'WHITE SPIRIT DC10 5L'::text as short_description, 'Diluants | DROGUERIE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'diluants'::text as category_slug, null::text as notes
union all
select '216'::text as reference, '216'::text as code, 'ALCOOL A BRULER 90° 1L'::text as name, 'ALCOOL A BRULER 90° 1L'::text as short_description, 'Diluants | DROGUERIE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'diluants'::text as category_slug, null::text as notes
union all
select '1077'::text as reference, '1077'::text as code, 'AMMONIAQUE 1,5L'::text as name, 'AMMONIAQUE 1,5L'::text as short_description, 'Diluants | DROGUERIE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '1,5L'::text as packaging, '1,5L'::text as unit, 'diluants'::text as category_slug, null::text as notes
union all
select '220'::text as reference, '220'::text as code, 'ACETONE 1L'::text as name, 'ACETONE 1L'::text as short_description, 'Diluants | DROGUERIE'::text as long_description, 'MPL'::text as brand, 'MPL'::text as range_name, '1L'::text as packaging, '1L'::text as unit, 'diluants'::text as category_slug, null::text as notes
union all
select 'BJG6137'::text as reference, 'BJG6137'::text as code, 'BIOJAG 2.0 - 500 ml (hors Egalim)'::text as name, 'BIOJAG 2.0 - 500 ml (hors Egalim)'::text as short_description, 'Insectes Volants et Rampants | DROGUERIE'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'insectes-volants-et-rampants'::text as category_slug, null::text as notes
union all
select 'BJG6137-5'::text as reference, 'BJG6137-5'::text as code, 'BIOJAG 2.0 - 5L (hors Egalim)'::text as name, 'BIOJAG 2.0 - 5L (hors Egalim)'::text as short_description, 'Insectes Volants et Rampants | DROGUERIE'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'insectes-volants-et-rampants'::text as category_slug, null::text as notes
union all
select 'BJG6132'::text as reference, 'BJG6132'::text as code, 'BIOJAG INSECTICIDE 500 ml'::text as name, 'BIOJAG INSECTICIDE 500 ml'::text as short_description, 'Insectes Volants et Rampants | DROGUERIE'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'insectes-volants-et-rampants'::text as category_slug, null::text as notes
union all
select 'BJG6136'::text as reference, 'BJG6136'::text as code, 'BIOJAG INSECTICICDE 5L'::text as name, 'BIOJAG INSECTICICDE 5L'::text as short_description, 'Insectes Volants et Rampants | DROGUERIE'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '5L'::text as packaging, '5L'::text as unit, 'insectes-volants-et-rampants'::text as category_slug, null::text as notes
union all
select '231'::text as reference, '231'::text as code, '10 SPIRALES ANTI-MOUSTIQUES'::text as name, '10 SPIRALES ANTI-MOUSTIQUES'::text as short_description, 'Insectes Volants | DROGUERIE'::text as long_description, 'BENGAL'::text as brand, 'BENGAL'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'insectes-volants'::text as category_slug, null::text as notes
union all
select '1558'::text as reference, '1558'::text as code, 'DIFFUSEUR + 1 RECHARGE ANTI-MOUSTIQUES 45 NUITS (+ Taxe DEEE 0,08€)'::text as name, 'DIFFUSEUR + 1 RECHARGE ANTI-MOUSTIQUES 45 NUITS (+ Taxe DEEE 0,08€)'::text as short_description, 'Insectes Volants | DROGUERIE'::text as long_description, 'BENGAL'::text as brand, 'BENGAL'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'insectes-volants'::text as category_slug, null::text as notes
union all
select '1560'::text as reference, '1560'::text as code, 'RECHARGE LIQUIDE ANTI-MOUSTIQUES 45 NUITS'::text as name, 'RECHARGE LIQUIDE ANTI-MOUSTIQUES 45 NUITS'::text as short_description, 'Insectes Volants | DROGUERIE'::text as long_description, 'BENGAL'::text as brand, 'BENGAL'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'insectes-volants'::text as category_slug, null::text as notes
union all
select '1559'::text as reference, '1559'::text as code, 'RECHARGE 30 PASTILLES ANTI-MOUSTIQUES 45 NUITS'::text as name, 'RECHARGE 30 PASTILLES ANTI-MOUSTIQUES 45 NUITS'::text as short_description, 'Insectes Volants | DROGUERIE'::text as long_description, 'BENGAL'::text as brand, 'BENGAL'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'insectes-volants'::text as category_slug, null::text as notes
union all
select 'BEN030'::text as reference, 'BEN030'::text as code, 'INSECTICIDE AEROSOL VOLANTS BENGAL 400ML  (Nouveauté)'::text as name, 'INSECTICIDE AEROSOL VOLANTS BENGAL 400ML  (Nouveauté)'::text as short_description, 'Insectes Volants | DROGUERIE'::text as long_description, 'BENGAL'::text as brand, 'BENGAL'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'insectes-volants'::text as category_slug, null::text as notes
union all
select '1855'::text as reference, '1855'::text as code, '2 PIEGES A MITES DES VETEMENTS'::text as name, '2 PIEGES A MITES DES VETEMENTS'::text as short_description, 'Insectes Volants | DROGUERIE'::text as long_description, 'AEROXON'::text as brand, 'AEROXON'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'insectes-volants'::text as category_slug, null::text as notes
union all
select 'XONMITLAV'::text as reference, 'XONMITLAV'::text as code, 'BOITE ANTI MITES PARFUM LAVANDE (Nouveauté)'::text as name, 'BOITE ANTI MITES PARFUM LAVANDE (Nouveauté)'::text as short_description, 'Insectes Volants | DROGUERIE'::text as long_description, 'AEROXON'::text as brand, 'AEROXON'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'insectes-volants'::text as category_slug, null::text as notes
union all
select '1114'::text as reference, '1114'::text as code, '2 PIEGES A MITES ALIMENTAIRES'::text as name, '2 PIEGES A MITES ALIMENTAIRES'::text as short_description, 'Insectes Volants | DROGUERIE'::text as long_description, 'AEROXON'::text as brand, 'AEROXON'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'insectes-volants'::text as category_slug, null::text as notes
union all
select 'XONTAPMOU'::text as reference, 'XONTAPMOU'::text as code, '36 TAPETTES A MOUCHES EN PRESENTOIR (Nouveauté)'::text as name, '36 TAPETTES A MOUCHES EN PRESENTOIR (Nouveauté)'::text as short_description, 'Insectes Volants | DROGUERIE'::text as long_description, 'AEROXON'::text as brand, 'AEROXON'::text as range_name, 'Présentoir'::text as packaging, 'Présentoir'::text as unit, 'insectes-volants'::text as category_slug, null::text as notes
union all
select 'BJG6138'::text as reference, 'BJG6138'::text as code, 'IINSECTICIDE PUNAISE DE LIT 500 ml (hors Egalim)'::text as name, 'IINSECTICIDE PUNAISE DE LIT 500 ml (hors Egalim)'::text as short_description, 'Insectes Rampants | DROGUERIE'::text as long_description, 'JAGPRIMA'::text as brand, 'JAGPRIMA'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'insectes-rampants'::text as category_slug, null::text as notes
union all
select 'IO016'::text as reference, 'IO016'::text as code, 'ANTI RAMPANTS 500 ml (hors Egalim)'::text as name, 'ANTI RAMPANTS 500 ml (hors Egalim)'::text as short_description, 'Insectes Rampants | DROGUERIE'::text as long_description, 'IO'::text as brand, 'IO'::text as range_name, '500ml'::text as packaging, '500ml'::text as unit, 'insectes-rampants'::text as category_slug, null::text as notes
union all
select 'BEN032'::text as reference, 'BEN032'::text as code, 'INSECTICIDE AEROSOL RAMPANTS BENGAL 400ML (Nouveauté)'::text as name, 'INSECTICIDE AEROSOL RAMPANTS BENGAL 400ML (Nouveauté)'::text as short_description, 'Insectes Rampants | DROGUERIE'::text as long_description, 'BENGAL'::text as brand, 'BENGAL'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'insectes-rampants'::text as category_slug, null::text as notes
union all
select '891'::text as reference, '891'::text as code, 'POUDRE ANTI -FOURMIS  200 gr'::text as name, 'POUDRE ANTI -FOURMIS  200 gr'::text as short_description, 'Insectes Rampants | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, '200gr'::text as packaging, '200gr'::text as unit, 'insectes-rampants'::text as category_slug, null::text as notes
union all
select '1852'::text as reference, '1852'::text as code, 'BOITE ANTI-FOURMIS DE 10 gr'::text as name, 'BOITE ANTI-FOURMIS DE 10 gr'::text as short_description, 'Insectes Rampants | DROGUERIE'::text as long_description, 'AEROXON'::text as brand, 'AEROXON'::text as range_name, '10gr'::text as packaging, '10gr'::text as unit, 'insectes-rampants'::text as category_slug, null::text as notes
union all
select '1857'::text as reference, '1857'::text as code, 'CARTE 2 TUBES 15 gr ANTI-FOURMIS MATIERE ACTIVE CYPHENOTHRINE'::text as name, 'CARTE 2 TUBES 15 gr ANTI-FOURMIS MATIERE ACTIVE CYPHENOTHRINE'::text as short_description, 'Insectes Rampants | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, '30gr'::text as packaging, '30gr'::text as unit, 'insectes-rampants'::text as category_slug, null::text as notes
union all
select '1866'::text as reference, '1866'::text as code, 'SERINGUE / CARTE ANTI-CAFARDS 25 gr'::text as name, 'SERINGUE / CARTE ANTI-CAFARDS 25 gr'::text as short_description, 'Insectes Rampants | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, '25gr'::text as packaging, '25gr'::text as unit, 'insectes-rampants'::text as category_slug, null::text as notes
union all
select '1821'::text as reference, '1821'::text as code, '3 PIEGES COLLANTS POUR CAFARD / POISSONS D’ARGENT'::text as name, '3 PIEGES COLLANTS POUR CAFARD / POISSONS D’ARGENT'::text as short_description, 'Insectes Rampants | DROGUERIE'::text as long_description, 'AEROXON'::text as brand, 'AEROXON'::text as range_name, 'Unité'::text as packaging, 'Unité'::text as unit, 'insectes-rampants'::text as category_slug, null::text as notes
union all
select '589'::text as reference, '589'::text as code, 'BOITE DE 4 PIEGES A GLU SOURIS avec appât'::text as name, 'BOITE DE 4 PIEGES A GLU SOURIS avec appât'::text as short_description, 'Rongeurs | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'rongeurs'::text as category_slug, null::text as notes
union all
select '336'::text as reference, '336'::text as code, 'TUBE GLU 135 gr'::text as name, 'TUBE GLU 135 gr'::text as short_description, 'Rongeurs | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, '135gr'::text as packaging, '135gr'::text as unit, 'rongeurs'::text as category_slug, null::text as notes
union all
select '1614'::text as reference, '1614'::text as code, 'LOT DE 2 TAPETTES A SOURIS EN BOIS SUR CARTE'::text as name, 'LOT DE 2 TAPETTES A SOURIS EN BOIS SUR CARTE'::text as short_description, 'Rongeurs | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'rongeurs'::text as category_slug, null::text as notes
union all
select '410'::text as reference, '410'::text as code, 'BOITE D''APPATAGE  POUR SOURIS AVEC CLE'::text as name, 'BOITE D''APPATAGE  POUR SOURIS AVEC CLE'::text as short_description, 'Rongeurs | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'rongeurs'::text as category_slug, null::text as notes
union all
select '1082'::text as reference, '1082'::text as code, 'BOITE D''APPATAGE  POUR RATS & SOURIS  AVEC CLE'::text as name, 'BOITE D''APPATAGE  POUR RATS & SOURIS  AVEC CLE'::text as short_description, 'Rongeurs | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'rongeurs'::text as category_slug, null::text as notes
union all
select '1066'::text as reference, '1066'::text as code, 'RATICIDE/ SOURICIDE AVOINE BOITE  6X25 gr'::text as name, 'RATICIDE/ SOURICIDE AVOINE BOITE  6X25 gr'::text as short_description, 'Rongeurs | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, '150gr'::text as packaging, '150gr'::text as unit, 'rongeurs'::text as category_slug, null::text as notes
union all
select '1124'::text as reference, '1124'::text as code, 'RATICIDE/ SOURICIDE BLE ENTIER BOITE  3X50 gr'::text as name, 'RATICIDE/ SOURICIDE BLE ENTIER BOITE  3X50 gr'::text as short_description, 'Rongeurs | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, '150gr'::text as packaging, '150gr'::text as unit, 'rongeurs'::text as category_slug, null::text as notes
union all
select '1574'::text as reference, '1574'::text as code, 'RATICIDE/SOURICIDE HYDROFUGE BOITE 7 X 40 gr'::text as name, 'RATICIDE/SOURICIDE HYDROFUGE BOITE 7 X 40 gr'::text as short_description, 'Rongeurs | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, '280gr'::text as packaging, '280gr'::text as unit, 'rongeurs'::text as category_slug, null::text as notes
union all
select '1590'::text as reference, '1590'::text as code, 'RATICIDE/SOURIS PATE FRAICHE BOITE 15 X 10 gr'::text as name, 'RATICIDE/SOURIS PATE FRAICHE BOITE 15 X 10 gr'::text as short_description, 'Rongeurs | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, '150gr'::text as packaging, '150gr'::text as unit, 'rongeurs'::text as category_slug, null::text as notes
union all
select '590'::text as reference, '590'::text as code, 'BOITE DE 2 PIEGES A GLU RAT/SOURIS avec appât'::text as name, 'BOITE DE 2 PIEGES A GLU RAT/SOURIS avec appât'::text as short_description, 'Rongeurs | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'rongeurs'::text as category_slug, null::text as notes
union all
select '378'::text as reference, '378'::text as code, 'TAPETTE A  RAT ASSAINIC VRAC'::text as name, 'TAPETTE A  RAT ASSAINIC VRAC'::text as short_description, 'Rongeurs | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'rongeurs'::text as category_slug, null::text as notes
union all
select '377'::text as reference, '377'::text as code, 'TAPETTE A  SOURIS ASSAINIC VRAC'::text as name, 'TAPETTE A  SOURIS ASSAINIC VRAC'::text as short_description, 'Rongeurs | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'rongeurs'::text as category_slug, null::text as notes
union all
select '1616'::text as reference, '1616'::text as code, 'TAPETTE A RAT EN BOIS SUR CARTE'::text as name, 'TAPETTE A RAT EN BOIS SUR CARTE'::text as short_description, 'Rongeurs | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'rongeurs'::text as category_slug, null::text as notes
union all
select '1106'::text as reference, '1106'::text as code, '2 PIEGES A SOURIS AUTOMATIQUES pré-appâtés'::text as name, '2 PIEGES A SOURIS AUTOMATIQUES pré-appâtés'::text as short_description, 'Rongeurs | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'rongeurs'::text as category_slug, null::text as notes
union all
select '628'::text as reference, '628'::text as code, 'NASSE A SOURIS 1 ENTREE 12X6X6 cm'::text as name, 'NASSE A SOURIS 1 ENTREE 12X6X6 cm'::text as short_description, 'Rongeurs | DROGUERIE'::text as long_description, 'ASSAINIC'::text as brand, 'ASSAINIC'::text as range_name, 'L''unité'::text as packaging, 'L''unité'::text as unit, 'rongeurs'::text as category_slug, null::text as notes
union all
select '4728'::text as reference, '4728'::text as code, 'THERMOMETRE SONDE ETANCHE IP67 CALIBRABLE'::text as name, 'THERMOMETRE SONDE ETANCHE IP67 CALIBRABLE'::text as short_description, 'Themomètres | DROGUERIE'::text as long_description, 'STIL'::text as brand, 'STIL'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'themometres'::text as category_slug, 'Ecotaxe 0.08 €'::text as notes
union all
select '4749'::text as reference, '4749'::text as code, 'THERMOMETRE SONDE PRECISION INDUCTION EN13485'::text as name, 'THERMOMETRE SONDE PRECISION INDUCTION EN13485'::text as short_description, 'Themomètres | DROGUERIE'::text as long_description, 'STIL'::text as brand, 'STIL'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'themometres'::text as category_slug, 'Ecotaxe 0.08 €'::text as notes
union all
select '4717'::text as reference, '4717'::text as code, 'THERMOMETRE PRO CUISSON A CŒUR POUR FOUR'::text as name, 'THERMOMETRE PRO CUISSON A CŒUR POUR FOUR'::text as short_description, 'Themomètres | DROGUERIE'::text as long_description, 'STIL'::text as brand, 'STIL'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'themometres'::text as category_slug, 'Ecotaxe 0.08 €'::text as notes
union all
select '5512'::text as reference, '5512'::text as code, 'THERMOMETRE IF AVEC ALARME'::text as name, 'THERMOMETRE IF AVEC ALARME'::text as short_description, 'Themomètres | DROGUERIE'::text as long_description, 'STIL'::text as brand, 'STIL'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'themometres'::text as category_slug, 'Ecotaxe 0.08 €'::text as notes
union all
select '0992.5'::text as reference, '0992.5'::text as code, 'THERMOMETRE CONGEL/REFRIGERATEUR PRO'::text as name, 'THERMOMETRE CONGEL/REFRIGERATEUR PRO'::text as short_description, 'Themomètres | DROGUERIE'::text as long_description, 'STIL'::text as brand, 'STIL'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'themometres'::text as category_slug, null::text as notes
union all
select '4857.5'::text as reference, '4857.5'::text as code, 'TESTEUR D''HUILE ELECTRONIQUE'::text as name, 'TESTEUR D''HUILE ELECTRONIQUE'::text as short_description, 'Huiles | DROGUERIE'::text as long_description, 'STIL'::text as brand, 'STIL'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'huiles'::text as category_slug, 'Ecotaxe 0.12 €'::text as notes
union all
select '4853'::text as reference, '4853'::text as code, 'BANDELETTE TEST QUALITE L''HUILE DE FRITURE X50'::text as name, 'BANDELETTE TEST QUALITE L''HUILE DE FRITURE X50'::text as short_description, 'Huiles | DROGUERIE'::text as long_description, 'STIL'::text as brand, 'STIL'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'huiles'::text as category_slug, null::text as notes
union all
select '4852'::text as reference, '4852'::text as code, 'MINUTEUR ROTATIF 2 TEMPS + ALARME SONORE ET VISUELLE'::text as name, 'MINUTEUR ROTATIF 2 TEMPS + ALARME SONORE ET VISUELLE'::text as short_description, 'Minuteurs / Horloges | DROGUERIE'::text as long_description, 'STIL'::text as brand, 'STIL'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'minuteurs-horloges'::text as category_slug, 'Ecotaxe 0.08 €'::text as notes
union all
select '3023'::text as reference, '3023'::text as code, 'HORLOGE NUMERIQUE GEANTE'::text as name, 'HORLOGE NUMERIQUE GEANTE'::text as short_description, 'Minuteurs / Horloges | DROGUERIE'::text as long_description, 'STIL'::text as brand, 'STIL'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'minuteurs-horloges'::text as category_slug, 'Ecotaxe 0.12 €'::text as notes
union all
select '4797'::text as reference, '4797'::text as code, 'BALANCE DE CUISINE 5KGS/1GR  PLATEAU INOX'::text as name, 'BALANCE DE CUISINE 5KGS/1GR  PLATEAU INOX'::text as short_description, 'Balances | DROGUERIE'::text as long_description, 'STIL'::text as brand, 'STIL'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'balances'::text as category_slug, 'Ecotaxe 0.12 €'::text as notes
union all
select '4798'::text as reference, '4798'::text as code, 'BALANCE PRO 15 KGS/2GR  IP54'::text as name, 'BALANCE PRO 15 KGS/2GR  IP54'::text as short_description, 'Balances | DROGUERIE'::text as long_description, 'STIL'::text as brand, 'STIL'::text as range_name, 'l''unité'::text as packaging, 'l''unité'::text as unit, 'balances'::text as category_slug, 'Ecotaxe 0.25 €'::text as notes
) v
left join public.product_categories pc on pc.slug = v.category_slug
on conflict (reference) do update set
  category_id = excluded.category_id,
  code = excluded.code,
  name = excluded.name,
  short_description = excluded.short_description,
  long_description = excluded.long_description,
  brand = excluded.brand,
  range_name = excluded.range_name,
  packaging = excluded.packaging,
  unit = excluded.unit,
  vat_rate = excluded.vat_rate,
  is_active = excluded.is_active,
  notes = excluded.notes,
  updated_at = now();

-- 5) Lignes tarifaires
insert into public.price_list_items (
  price_list_id, product_id, unit_price_ht, discount_percent,
  conditioning, min_quantity, is_available, effective_date, notes, created_at, updated_at
)
select
  pl.id,
  p.id,
  v.unit_price_ht,
  0.00 as discount_percent,
  v.conditioning,
  null as min_quantity,
  true as is_available,
  date '2026-01-01' as effective_date,
  v.notes,
  now(),
  now()
from (
select 'SUP3DN750'::text as reference, 4.9511::numeric(12,2) as unit_price_ht, '750ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 9.1615'::text as notes
union all
select 'SUP3DN-5'::text as reference, 12.5000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 14.8391'::text as notes
union all
select 'SUP3DN2-5'::text as reference, 15.5400::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 18.6456'::text as notes
union all
select 'SUP3DNM-5'::text as reference, 27.1500::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 32.5814'::text as notes
union all
select 'SUP3DN-L100'::text as reference, 5.1800::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 10 | Cartons/palette: 77 | Tarif UV: 9.3228'::text as notes
union all
select 'SUP3DLA-5'::text as reference, 17.5000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 22.4844'::text as notes
union all
select 'SUP3DA-5'::text as reference, 17.5000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 22.4844'::text as notes
union all
select 'SUP3DF-5'::text as reference, 17.5000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 22.4844'::text as notes
union all
select 'SUP3DCV-5'::text as reference, 17.5000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 22.4844'::text as notes
union all
select 'SUP3DP-5'::text as reference, 17.5000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 22.4844'::text as notes
union all
select '60100'::text as reference, 6.1366::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 11.3551'::text as notes
union all
select '60250'::text as reference, 6.1366::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 11.3551'::text as notes
union all
select '60500'::text as reference, 6.1366::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 11.3551'::text as notes
union all
select '60200'::text as reference, 6.1366::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 11.3551'::text as notes
union all
select '60591'::text as reference, 6.1366::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 11.3551'::text as notes
union all
select '60510'::text as reference, 25.1400::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 32.1943'::text as notes
union all
select '65250'::text as reference, 25.1400::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 32.1943'::text as notes
union all
select '60550'::text as reference, 25.1400::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 32.1943'::text as notes
union all
select '60520'::text as reference, 25.1400::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 32.1943'::text as notes
union all
select '60590'::text as reference, 25.1400::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 32.1943'::text as notes
union all
select 'CL01-1'::text as reference, 7.4000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 13.3229'::text as notes
union all
select 'CL01'::text as reference, 33.6100::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 60.5176'::text as notes
union all
select 'PLAN2DN-5'::text as reference, 12.3100::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 13.5487'::text as notes
union all
select 'PLAN2DCV-5'::text as reference, 14.7100::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 16.0649'::text as notes
union all
select 'SUP2DN'::text as reference, 5.0000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 5.6594'::text as notes
union all
select 'SUP2DCV'::text as reference, 5.0000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 6.8542'::text as notes
union all
select 'SUP2DLA'::text as reference, 5.0000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 6.8542'::text as notes
union all
select 'SUP2DA'::text as reference, 5.0000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 6.8542'::text as notes
union all
select 'SUP2DF'::text as reference, 5.0000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 6.8542'::text as notes
union all
select 'SUP2DP'::text as reference, 5.0000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 6.8542'::text as notes
union all
select 'SUP2DN-5'::text as reference, 9.9000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 11.6454'::text as notes
union all
select 'SUP2DCV-5'::text as reference, 12.5000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 15.9036'::text as notes
union all
select 'SUP2DLA-5'::text as reference, 12.5000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 15.9036'::text as notes
union all
select 'SUP2DA-5'::text as reference, 12.5000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 15.9036'::text as notes
union all
select 'SUP2DF-5'::text as reference, 12.5000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 15.9036'::text as notes
union all
select 'SUP2DP-5'::text as reference, 12.5000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 15.9036'::text as notes
union all
select 'ACTTOI-5'::text as reference, 34.2550::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 52.7000'::text as notes
union all
select 'ACTTOI'::text as reference, 11.4725::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 17.6500'::text as notes
union all
select 'ACTTER-5'::text as reference, 31.9800::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 49.2000'::text as notes
union all
select 'ACTTER'::text as reference, 9.2625::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 14.2500'::text as notes
union all
select 'IO009'::text as reference, 2.5487::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 45 | Tarif UV: 4.7162'::text as notes
union all
select 'IO010'::text as reference, 2.6337::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 45 | Tarif UV: 4.8734'::text as notes
union all
select 'IO023'::text as reference, 2.0746::numeric(12,2) as unit_price_ht, '625ml'::text as conditioning, 'UV/carton: 16 | Cartons/palette: 60 | Tarif UV: 3.8388'::text as notes
union all
select 'IO045'::text as reference, 2.8000::numeric(12,2) as unit_price_ht, '625ml'::text as conditioning, 'UV/carton: 16 | Cartons/palette: 60 | Tarif UV: 3.6158'::text as notes
union all
select 'IOPRO033'::text as reference, 2.5000::numeric(12,2) as unit_price_ht, '750ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 64 | Tarif UV: 4.5031'::text as notes
union all
select 'IOPRO033-5'::text as reference, 10.2500::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 11.2674'::text as notes
union all
select 'CIM03'::text as reference, 8.1240::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 120 | Tarif UV: 15.0326'::text as notes
union all
select 'CIM04'::text as reference, 10.7633::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 120 | Tarif UV: 19.9164'::text as notes
union all
select 'C517'::text as reference, 12.8100::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 120 | Tarif UV: 23.0651'::text as notes
union all
select 'C517-5'::text as reference, 53.9000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 97.2282'::text as notes
union all
select 'IO015'::text as reference, 5.3218::numeric(12,2) as unit_price_ht, '200ml'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 104 | Tarif UV: 9.8474'::text as notes
union all
select 'IO018'::text as reference, 6.4568::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 64 | Tarif UV: 11.9477'::text as notes
union all
select '80104'::text as reference, 5.9600::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 120 | Tarif UV: 11.0325'::text as notes
union all
select '80101'::text as reference, 5.9600::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 120 | Tarif UV: 11.0325'::text as notes
union all
select '80102'::text as reference, 5.9600::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 120 | Tarif UV: 11.0325'::text as notes
union all
select '1794'::text as reference, 2.8500::numeric(12,2) as unit_price_ht, '375ml'::text as conditioning, 'UV/carton: 14 | Cartons/palette: 108 | Tarif UV: 4.3872'::text as notes
union all
select '642'::text as reference, 1.7259::numeric(12,2) as unit_price_ht, '150gr'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 210 | Tarif UV: 3.1936'::text as notes
union all
select '641'::text as reference, 1.7259::numeric(12,2) as unit_price_ht, '150gr'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 210 | Tarif UV: 3.1936'::text as notes
union all
select 'IO026'::text as reference, 3.0500::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 9 | Cartons/palette: 54 | Tarif UV: 3.5485'::text as notes
union all
select 'IOPRO032-5'::text as reference, 11.1504::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 128 | Tarif UV: 12.7338'::text as notes
union all
select 'IO041'::text as reference, 3.0500::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 9 | Cartons/palette: 54 | Tarif UV: 3.5485'::text as notes
union all
select 'IO027'::text as reference, 3.0500::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 9 | Cartons/palette: 54 | Tarif UV: 3.5485'::text as notes
union all
select 'IO040'::text as reference, 1.9000::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 186 | Tarif UV: 2.5484'::text as notes
union all
select 'IO028'::text as reference, 1.9000::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 186 | Tarif UV: 2.5484'::text as notes
union all
select 'IO039'::text as reference, 1.9000::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 186 | Tarif UV: 2.5484'::text as notes
union all
select 'IO029'::text as reference, 1.9525::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 65 | Tarif UV: 3.6130'::text as notes
union all
select 'IOPRO020'::text as reference, 5.3000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 64 | Tarif UV: 9.5486'::text as notes
union all
select 'IOPRO027'::text as reference, 24.6500::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 59.1727'::text as notes
union all
select 'IOPRO022'::text as reference, 7.2500::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 64 | Tarif UV: 21.2908'::text as notes
union all
select 'IOPRO024'::text as reference, 17.0000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 28.6781'::text as notes
union all
select 'IOPRO025'::text as reference, 67.0700::numeric(12,2) as unit_price_ht, '20L'::text as conditioning, 'UV/carton: 1 | Cartons/palette: 24 | Tarif UV: 107.7739'::text as notes
union all
select 'IOPRO026'::text as reference, 18.7000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 44.8721'::text as notes
union all
select 'IOPRO026-20'::text as reference, 59.9600::numeric(12,2) as unit_price_ht, '20L'::text as conditioning, 'UV/carton: 1 | Cartons/palette: 24 | Tarif UV: 90.5254'::text as notes
union all
select 'ACT2002-5'::text as reference, 29.9800::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 44.5172'::text as notes
union all
select 'IO011'::text as reference, 3.5000::numeric(12,2) as unit_price_ht, '625ml'::text as conditioning, 'UV/carton: 16 | Cartons/palette: 60 | Tarif UV: 4.2582'::text as notes
union all
select 'IOPRO012'::text as reference, 5.4915::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 96 | Tarif UV: 10.1615'::text as notes
union all
select 'IOPRO012-5'::text as reference, 11.7327::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 21.7102'::text as notes
union all
select 'IOPRO028-750'::text as reference, 4.9900::numeric(12,2) as unit_price_ht, '750ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 64 | Tarif UV: 9.2438'::text as notes
union all
select 'IOPRO028'::text as reference, 18.5000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 32.2589'::text as notes
union all
select 'IOPRO021'::text as reference, 15.8800::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 38.8719'::text as notes
union all
select 'IO006'::text as reference, 3.9000::numeric(12,2) as unit_price_ht, '750mL'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 100 | Tarif UV: 6.6131'::text as notes
union all
select 'IOPRO031'::text as reference, 9.2397::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 64 | Tarif UV: 17.0972'::text as notes
union all
select 'IOPRO014'::text as reference, 7.9845::numeric(12,2) as unit_price_ht, '750ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 100 | Tarif UV: 14.7746'::text as notes
union all
select 'IOPRO017'::text as reference, 5.5787::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 96 | Tarif UV: 10.3228'::text as notes
union all
select 'IOPRO017-5'::text as reference, 15.5000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 21.7747'::text as notes
union all
select 'IOPRO023'::text as reference, 6.2412::numeric(12,2) as unit_price_ht, '750ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 64 | Tarif UV: 11.5487'::text as notes
union all
select 'CREMARGMET'::text as reference, 3.7495::numeric(12,2) as unit_price_ht, '250ml'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 168 | Tarif UV: 4.2819'::text as notes
union all
select 'PIERRENET'::text as reference, 9.0523::numeric(12,2) as unit_price_ht, '300gr'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 62 | Tarif UV: 10.3377'::text as notes
union all
select 'LES 7500'::text as reference, 15.5200::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 80 | Tarif UV: 32.6137'::text as notes
union all
select 'LES 7503'::text as reference, 51.5300::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 108.2285'::text as notes
union all
select 'ACT1129-5'::text as reference, 39.9600::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 61.3563'::text as notes
union all
select '1105'::text as reference, 3.1603::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 117 | Tarif UV: 6.3205'::text as notes
union all
select '1107'::text as reference, 3.1603::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 117 | Tarif UV: 6.3205'::text as notes
union all
select '1108'::text as reference, 3.1603::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 117 | Tarif UV: 6.3205'::text as notes
union all
select '1109'::text as reference, 3.1603::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 117 | Tarif UV: 6.3205'::text as notes
union all
select 'SHKERA'::text as reference, 1.9500::numeric(12,2) as unit_price_ht, '270ML'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 147 | Tarif UV: 3.9000'::text as notes
union all
select 'SHGRAS'::text as reference, 1.9500::numeric(12,2) as unit_price_ht, '270ML'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 147 | Tarif UV: 3.9000'::text as notes
union all
select 'SHFINS'::text as reference, 1.9500::numeric(12,2) as unit_price_ht, '270ML'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 147 | Tarif UV: 3.9000'::text as notes
union all
select 'SHABIM'::text as reference, 1.9500::numeric(12,2) as unit_price_ht, '270ML'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 147 | Tarif UV: 3.9000'::text as notes
union all
select 'GELDOUROSE'::text as reference, 3.9900::numeric(12,2) as unit_price_ht, '1,250 L'::text as conditioning, 'UV/carton: 8 | Cartons/palette: 70 | Tarif UV: 7.9800'::text as notes
union all
select 'GELDOUTRAD'::text as reference, 3.9900::numeric(12,2) as unit_price_ht, '1,250 L'::text as conditioning, 'UV/carton: 8 | Cartons/palette: 70 | Tarif UV: 7.9800'::text as notes
union all
select 'GELDOUSENS'::text as reference, 3.9900::numeric(12,2) as unit_price_ht, '1,250 L'::text as conditioning, 'UV/carton: 8 | Cartons/palette: 70 | Tarif UV: 7.9800'::text as notes
union all
select 'GELDOUCLAS'::text as reference, 3.9900::numeric(12,2) as unit_price_ht, '1,250 L'::text as conditioning, 'UV/carton: 8 | Cartons/palette: 70 | Tarif UV: 7.9800'::text as notes
union all
select 'BIO1103'::text as reference, 15.6000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 21.0328'::text as notes
union all
select 'BIO1103-TM'::text as reference, 15.6000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 21.0328'::text as notes
union all
select 'BIO1103-5'::text as reference, 60.9100::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 82.2278'::text as notes
union all
select 'BIO1103-5TM'::text as reference, 60.9100::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 82.2278'::text as notes
union all
select 'IOPRO029'::text as reference, 5.2300::numeric(12,2) as unit_price_ht, '750ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 64 | Tarif UV: 9.6777'::text as notes
union all
select 'IOPRO029-5'::text as reference, 20.9201::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 38.7106'::text as notes
union all
select 'IO024'::text as reference, 2.5976::numeric(12,2) as unit_price_ht, '625ml'::text as conditioning, 'UV/carton: 16 | Cartons/palette: 60 | Tarif UV: 4.8066'::text as notes
union all
select 'IO020'::text as reference, 3.8000::numeric(12,2) as unit_price_ht, '625ml'::text as conditioning, 'UV/carton: 16 | Cartons/palette: 60 | Tarif UV: 4.3872'::text as notes
union all
select 'ACT1103'::text as reference, 27.3800::numeric(12,2) as unit_price_ht, '750 gr'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 80 | Tarif UV: 49.0980'::text as notes
union all
select 'IO037'::text as reference, 3.2000::numeric(12,2) as unit_price_ht, '750ml'::text as conditioning, 'UV/carton: 16 | Cartons/palette: 45 | Tarif UV: 3.7098'::text as notes
union all
select 'IO038'::text as reference, 3.2000::numeric(12,2) as unit_price_ht, '750ml'::text as conditioning, 'UV/carton: 16 | Cartons/palette: 45 | Tarif UV: 3.7098'::text as notes
union all
select 'IO036'::text as reference, 3.2000::numeric(12,2) as unit_price_ht, '750ml'::text as conditioning, 'UV/carton: 16 | Cartons/palette: 45 | Tarif UV: 3.8065'::text as notes
union all
select '1529'::text as reference, 2.7022::numeric(12,2) as unit_price_ht, '2x55g'::text as conditioning, 'UV/carton: 10 | Cartons/palette: 100 | Tarif UV: 5.0001'::text as notes
union all
select '593'::text as reference, 2.2140::numeric(12,2) as unit_price_ht, '2x40g'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 120 | Tarif UV: 4.0969'::text as notes
union all
select 'LES7605'::text as reference, 5.4915::numeric(12,2) as unit_price_ht, 'pièce'::text as conditioning, 'UV/carton: 12 | Tarif UV: 10.1615'::text as notes
union all
select 'LES7600'::text as reference, 3.7656::numeric(12,2) as unit_price_ht, 'pièce'::text as conditioning, 'UV/carton: 12 | Tarif UV: 6.9679'::text as notes
union all
select '53900'::text as reference, 7.0780::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 80 | Tarif UV: 13.0971'::text as notes
union all
select '53600'::text as reference, 6.3632::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 80 | Tarif UV: 11.7745'::text as notes
union all
select 'IO022'::text as reference, 4.3000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 50 | Tarif UV: 6.2905'::text as notes
union all
select '53100'::text as reference, 5.9971::numeric(12,2) as unit_price_ht, '1 Kg'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 50 | Tarif UV: 11.0970'::text as notes
union all
select '53750'::text as reference, 4.7070::numeric(12,2) as unit_price_ht, '750gr'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 36 | Tarif UV: 8.7099'::text as notes
union all
select 'CIM07'::text as reference, 4.8000::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 120 | Tarif UV: 5.4700'::text as notes
union all
select '160'::text as reference, 2.0400::numeric(12,2) as unit_price_ht, 'rouleau'::text as conditioning, 'UV/carton: 25 | Cartons/palette: 78 | Tarif UV: 2.3200'::text as notes
union all
select '164'::text as reference, 2.5500::numeric(12,2) as unit_price_ht, 'rouleau'::text as conditioning, 'UV/carton: 28 | Cartons/palette: 78 | Tarif UV: 2.9000'::text as notes
union all
select '159'::text as reference, 1.7900::numeric(12,2) as unit_price_ht, 'rouleau'::text as conditioning, 'UV/carton: 20 | Cartons/palette: 78 | Tarif UV: 2.0400'::text as notes
union all
select 'IO044'::text as reference, 8.9000::numeric(12,2) as unit_price_ht, '3L'::text as conditioning, 'UV/carton: 4 | Cartons/palette: 50 | Tarif UV: 10.1293'::text as notes
union all
select 'LESSMA-5'::text as reference, 20.0865::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 4 | Cartons/palette: 36 | Tarif UV: 22.9388'::text as notes
union all
select 'LESSAV-5'::text as reference, 20.0865::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 4 | Cartons/palette: 36 | Tarif UV: 22.9388'::text as notes
union all
select 'IO019'::text as reference, 3.5000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 45 | Tarif UV: 4.2582'::text as notes
union all
select 'IO014'::text as reference, 3.5000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 45 | Tarif UV: 3.4517'::text as notes
union all
select 'IO012'::text as reference, 2.9000::numeric(12,2) as unit_price_ht, '625ml'::text as conditioning, 'UV/carton: 16 | Cartons/palette: 60 | Tarif UV: 4.3872'::text as notes
union all
select 'IO013'::text as reference, 2.9000::numeric(12,2) as unit_price_ht, '625ml'::text as conditioning, 'UV/carton: 16 | Cartons/palette: 60 | Tarif UV: 4.3872'::text as notes
union all
select 'UACLIP-AS'::text as reference, 4.5144::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 48 | Tarif UV: 8.3534'::text as notes
union all
select 'UACLIP-FS'::text as reference, 4.5144::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 48 | Tarif UV: 8.3534'::text as notes
union all
select 'UACLIP-TM'::text as reference, 4.5144::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 48 | Tarif UV: 8.3534'::text as notes
union all
select 'UACLIP-SL'::text as reference, 4.5144::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 48 | Tarif UV: 8.3534'::text as notes
union all
select 'UAH-AS'::text as reference, 3.1293::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 48 | Tarif UV: 5.7905'::text as notes
union all
select 'UAH-TM'::text as reference, 3.1293::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 48 | Tarif UV: 5.7905'::text as notes
union all
select 'UAH-M'::text as reference, 3.1293::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 48 | Tarif UV: 5.7905'::text as notes
union all
select 'UAH-SL'::text as reference, 3.1293::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 48 | Tarif UV: 5.7905'::text as notes
union all
select 'UARF-CAB'::text as reference, 5.9850::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 48 | Tarif UV: 11.0746'::text as notes
union all
select 'UARF-AS'::text as reference, 6.7545::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 48 | Tarif UV: 12.4985'::text as notes
union all
select 'UARF-TM'::text as reference, 6.7545::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 48 | Tarif UV: 12.4985'::text as notes
union all
select 'UARF-SL'::text as reference, 6.7545::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 48 | Tarif UV: 12.4985'::text as notes
union all
select 'UA2-TM'::text as reference, 9.5800::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 10 | Cartons/palette: 48 | Tarif UV: 8.8597'::text as notes
union all
select 'UA2-CM'::text as reference, 9.5800::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 10 | Cartons/palette: 48 | Tarif UV: 8.8597'::text as notes
union all
select 'UA2-SL'::text as reference, 9.5800::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 10 | Cartons/palette: 48 | Tarif UV: 8.8597'::text as notes
union all
select 'NIL 4609'::text as reference, 6.8300::numeric(12,2) as unit_price_ht, '15 ml'::text as conditioning, 'UV/carton: 12 | Tarif UV: 12.2906'::text as notes
union all
select 'NIL4921O'::text as reference, 24.5000::numeric(12,2) as unit_price_ht, '1L Doseur'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 36.7751'::text as notes
union all
select 'NIL4921T'::text as reference, 24.5000::numeric(12,2) as unit_price_ht, '1L Doseur'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 90 | Tarif UV: 36.7751'::text as notes
union all
select 'NIL4921-5O'::text as reference, 94.0000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 141.1002'::text as notes
union all
select 'NIL4921-5T'::text as reference, 94.0000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 141.1002'::text as notes
union all
select 'NIL4913'::text as reference, 6.0200::numeric(12,2) as unit_price_ht, '200 ml'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 48 | Tarif UV: 9.0325'::text as notes
union all
select 'NIL4913S'::text as reference, 6.0200::numeric(12,2) as unit_price_ht, '200 ml'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 48 | Tarif UV: 9.0325'::text as notes
union all
select 'NIL 4912'::text as reference, 11.0500::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 120 | Tarif UV: 16.5811'::text as notes
union all
select 'AS00302'::text as reference, 23.1800::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 8 | Cartons/palette: 100 | Tarif UV: 34.7750'::text as notes
union all
select 'LES 7504'::text as reference, 10.3200::numeric(12,2) as unit_price_ht, '311gr'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 150 | Tarif UV: 15.4843'::text as notes
union all
select 'LES 7506'::text as reference, 19.3500::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 150 | Tarif UV: 29.0330'::text as notes
union all
select 'MINI-SOK'::text as reference, 35.6100::numeric(12,2) as unit_price_ht, 'la  sock'::text as conditioning, 'UV/carton: 24 | Cartons/palette: 40 | Tarif UV: 53.4207'::text as notes
union all
select 'CTMINI'::text as reference, 35.6100::numeric(12,2) as unit_price_ht, 'la  sock'::text as conditioning, 'UV/carton: 24 | Cartons/palette: 40 | Tarif UV: 53.4207'::text as notes
union all
select 'CT-SOK'::text as reference, 80.4500::numeric(12,2) as unit_price_ht, 'la  sock'::text as conditioning, 'UV/carton: 4 | Cartons/palette: 40 | Tarif UV: 120.6804'::text as notes
union all
select 'OR-SOK'::text as reference, 80.4500::numeric(12,2) as unit_price_ht, 'la  sock'::text as conditioning, 'UV/carton: 4 | Cartons/palette: 40 | Tarif UV: 120.6804'::text as notes
union all
select '41'::text as reference, 2.5000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 48 | Tarif UV: 4.3630'::text as notes
union all
select '42'::text as reference, 4.2000::numeric(12,2) as unit_price_ht, '2L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 50 | Tarif UV: 7.3299'::text as notes
union all
select '43'::text as reference, 8.9000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 3 | Cartons/palette: 48 | Tarif UV: 15.5324'::text as notes
union all
select '44'::text as reference, 4.5000::numeric(12,2) as unit_price_ht, '2L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 50 | Tarif UV: 7.8535'::text as notes
union all
select '871'::text as reference, 4.5000::numeric(12,2) as unit_price_ht, '2L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 50 | Tarif UV: 7.8535'::text as notes
union all
select '45'::text as reference, 12.8000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 3 | Cartons/palette: 48 | Tarif UV: 22.3388'::text as notes
union all
select '49'::text as reference, 45.0000::numeric(12,2) as unit_price_ht, '20L'::text as conditioning, 'UV/carton: 1 | Cartons/palette: 28 | Tarif UV: 78.5348'::text as notes
union all
select '50'::text as reference, 51.9000::numeric(12,2) as unit_price_ht, '20L'::text as conditioning, 'UV/carton: 1 | Cartons/palette: 30 | Tarif UV: 90.5768'::text as notes
union all
select '39'::text as reference, 5.8000::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 72 | Tarif UV: 10.1223'::text as notes
union all
select '1071CB'::text as reference, 3.5000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 60 | Tarif UV: 4.5690'::text as notes
union all
select '1076CB'::text as reference, 15.0000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 3 | Cartons/palette: 60 | Tarif UV: 18.9285'::text as notes
union all
select '1078CB'::text as reference, 60.0000::numeric(12,2) as unit_price_ht, '20L'::text as conditioning, 'UV/carton: 1 | Cartons/palette: 30 | Tarif UV: 57.6944'::text as notes
union all
select '219'::text as reference, 8.8000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 3 | Cartons/palette: 48 | Tarif UV: 6.4534'::text as notes
union all
select '229'::text as reference, 39.0000::numeric(12,2) as unit_price_ht, '20L'::text as conditioning, 'UV/carton: 1 | Cartons/palette: 30 | Tarif UV: 30.9214'::text as notes
union all
select 'JABSO05'::text as reference, 4.3409::numeric(12,2) as unit_price_ht, '500gr'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 120 | Tarif UV: 8.0325'::text as notes
union all
select 'IO047'::text as reference, 3.2794::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 10 | Cartons/palette: 60 | Tarif UV: 6.0682'::text as notes
union all
select '48'::text as reference, 4.3932::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 105 | Tarif UV: 8.1292'::text as notes
union all
select '221'::text as reference, 3.2000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 55 | Tarif UV: 3.7420'::text as notes
union all
select '1531'::text as reference, 12.5000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 3 | Cartons/palette: 55 | Tarif UV: 14.0326'::text as notes
union all
select '214'::text as reference, 4.8639::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 54 | Tarif UV: 9.0002'::text as notes
union all
select '215'::text as reference, 23.0000::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 4 | Cartons/palette: 32 | Tarif UV: 40.3236'::text as notes
union all
select '216'::text as reference, 3.8000::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 96 | Tarif UV: 5.8066'::text as notes
union all
select '1077'::text as reference, 4.2000::numeric(12,2) as unit_price_ht, '1,5L'::text as conditioning, 'UV/carton: 8 | Cartons/palette: 60 | Tarif UV: 4.4018'::text as notes
union all
select '220'::text as reference, 4.7419::numeric(12,2) as unit_price_ht, '1L'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 105 | Tarif UV: 8.7744'::text as notes
union all
select 'BJG6137'::text as reference, 6.9400::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 120 | Tarif UV: 12.8466'::text as notes
union all
select 'BJG6137-5'::text as reference, 40.9600::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 75.7822'::text as notes
union all
select 'BJG6132'::text as reference, 6.8900::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 120 | Tarif UV: 12.7517'::text as notes
union all
select 'BJG6136'::text as reference, 39.0300::numeric(12,2) as unit_price_ht, '5L'::text as conditioning, 'UV/carton: 2 | Cartons/palette: 64 | Tarif UV: 72.2067'::text as notes
union all
select '231'::text as reference, 1.6587::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 24 | Cartons/palette: 72 | Tarif UV: 3.0693'::text as notes
union all
select '1558'::text as reference, 4.9761::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 48 | Tarif UV: 9.2078'::text as notes
union all
select '1560'::text as reference, 2.2572::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 24 | Cartons/palette: 96 | Tarif UV: 4.1767'::text as notes
union all
select '1559'::text as reference, 2.2572::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 24 | Cartons/palette: 84 | Tarif UV: 4.1767'::text as notes
union all
select 'BEN030'::text as reference, 4.2557::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 63 | Tarif UV: 4.8600'::text as notes
union all
select '1855'::text as reference, 5.8320::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 14 | Cartons/palette: 160 | Tarif UV: 7.5300'::text as notes
union all
select 'XONMITLAV'::text as reference, 3.3072::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 14 | Cartons/palette: 160 | Tarif UV: 3.7768'::text as notes
union all
select '1114'::text as reference, 4.8393::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 14 | Tarif UV: 8.9546'::text as notes
union all
select 'XONTAPMOU'::text as reference, 43.3868::numeric(12,2) as unit_price_ht, 'Présentoir'::text as conditioning, 'UV/carton: 36 | Tarif UV: 49.5477'::text as notes
union all
select 'BJG6138'::text as reference, 7.6095::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 120 | Tarif UV: 14.0806'::text as notes
union all
select 'IO016'::text as reference, 3.8430::numeric(12,2) as unit_price_ht, '500ml'::text as conditioning, 'UV/carton: 6 | Cartons/palette: 120 | Tarif UV: 7.1111'::text as notes
union all
select 'BEN032'::text as reference, 5.0438::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 63 | Tarif UV: 5.7600'::text as notes
union all
select '891'::text as reference, 6.7990::numeric(12,2) as unit_price_ht, '200gr'::text as conditioning, 'UV/carton: 12 | Cartons/palette: 152 | Tarif UV: 12.5810'::text as notes
union all
select '1852'::text as reference, 4.4802::numeric(12,2) as unit_price_ht, '10gr'::text as conditioning, 'UV/carton: 14 | Tarif UV: 4.6500'::text as notes
union all
select '1857'::text as reference, 6.6944::numeric(12,2) as unit_price_ht, '30gr'::text as conditioning, 'UV/carton: 24 | Tarif UV: 12.3874'::text as notes
union all
select '1866'::text as reference, 5.1952::numeric(12,2) as unit_price_ht, '25gr'::text as conditioning, 'UV/carton: 10 | Tarif UV: 9.6131'::text as notes
union all
select '1821'::text as reference, 5.8140::numeric(12,2) as unit_price_ht, 'Unité'::text as conditioning, 'UV/carton: 14 | Tarif UV: 8.5200'::text as notes
union all
select '589'::text as reference, 5.0731::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 12 | Tarif UV: 9.3873'::text as notes
union all
select '336'::text as reference, 4.9337::numeric(12,2) as unit_price_ht, '135gr'::text as conditioning, 'UV/carton: 25 | Tarif UV: 9.1293'::text as notes
union all
select '1614'::text as reference, 1.9351::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 30 | Tarif UV: 3.5807'::text as notes
union all
select '410'::text as reference, 3.9051::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 10 | Tarif UV: 7.2260'::text as notes
union all
select '1082'::text as reference, 12.7787::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 4 | Tarif UV: 23.6457'::text as notes
union all
select '1066'::text as reference, 3.9923::numeric(12,2) as unit_price_ht, '150gr'::text as conditioning, 'UV/carton: 12 | Tarif UV: 7.3873'::text as notes
union all
select '1124'::text as reference, 4.0794::numeric(12,2) as unit_price_ht, '150gr'::text as conditioning, 'UV/carton: 12 | Tarif UV: 7.5486'::text as notes
union all
select '1574'::text as reference, 10.0940::numeric(12,2) as unit_price_ht, '280gr'::text as conditioning, 'UV/carton: 12 | Tarif UV: 18.6779'::text as notes
union all
select '1590'::text as reference, 4.1666::numeric(12,2) as unit_price_ht, '150gr'::text as conditioning, 'UV/carton: 12 | Tarif UV: 7.7099'::text as notes
union all
select '590'::text as reference, 7.3046::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 12 | Tarif UV: 13.5165'::text as notes
union all
select '378'::text as reference, 1.9351::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 12 | Tarif UV: 3.5807'::text as notes
union all
select '377'::text as reference, 0.7496::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 50 | Tarif UV: 1.3871'::text as notes
union all
select '1616'::text as reference, 2.3361::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 15 | Tarif UV: 4.3227'::text as notes
union all
select '1106'::text as reference, 4.0097::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 10 | Tarif UV: 7.4195'::text as notes
union all
select '628'::text as reference, 3.7482::numeric(12,2) as unit_price_ht, 'L''unité'::text as conditioning, 'UV/carton: 12 | Tarif UV: 6.9357'::text as notes
union all
select '4728'::text as reference, 16.1000::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 40 | Tarif UV: 32.2000 | Ecotaxe: 0.08 EUR'::text as notes
union all
select '4749'::text as reference, 22.2700::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 10 | Tarif UV: 44.5400 | Ecotaxe: 0.08 EUR'::text as notes
union all
select '4717'::text as reference, 26.7500::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 24 | Tarif UV: 53.5000 | Ecotaxe: 0.08 EUR'::text as notes
union all
select '5512'::text as reference, 46.6000::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 5 | Tarif UV: 93.2000 | Ecotaxe: 0.08 EUR'::text as notes
union all
select '0992.5'::text as reference, 2.3000::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 12 | Tarif UV: 4.6000'::text as notes
union all
select '4857.5'::text as reference, 324.0000::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 10 | Tarif UV: 648.0000 | Ecotaxe: 0.12 EUR'::text as notes
union all
select '4853'::text as reference, 28.2800::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 15 | Tarif UV: 56.5600'::text as notes
union all
select '4852'::text as reference, 20.7700::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 8 | Tarif UV: 41.5400 | Ecotaxe: 0.08 EUR'::text as notes
union all
select '3023'::text as reference, 48.0000::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 3 | Tarif UV: 96.0000 | Ecotaxe: 0.12 EUR'::text as notes
union all
select '4797'::text as reference, 22.9400::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 1 | Tarif UV: 45.8800 | Ecotaxe: 0.12 EUR'::text as notes
union all
select '4798'::text as reference, 174.6400::numeric(12,2) as unit_price_ht, 'l''unité'::text as conditioning, 'UV/carton: 1 | Tarif UV: 349.2800 | Ecotaxe: 0.25 EUR'::text as notes
) v
join public.products p on p.reference = v.reference
join public.price_lists pl on pl.code = 'BIOLAUR-SP-2026-CORSE'
on conflict (price_list_id, product_id) do update set
  unit_price_ht = excluded.unit_price_ht,
  discount_percent = excluded.discount_percent,
  conditioning = excluded.conditioning,
  min_quantity = excluded.min_quantity,
  is_available = excluded.is_available,
  effective_date = excluded.effective_date,
  notes = excluded.notes,
  updated_at = now();

commit;