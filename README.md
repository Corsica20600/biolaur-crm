# Biolaur CRM Terrain

Application CRM commerciale orientee terrain pour un agent vendant des produits d'hygiene, entretien, vaisselle, sanitaires et techniques aux CHR, commerces de bouche et collectivites.

## Architecture

- `app/` : routes Next.js App Router, pages CRM, login et route PDF.
- `components/` : composants reutilisables UI, formulaires, emails, documents, commandes.
- `lib/` : donnees de demo, helpers, statut, generation PDF.
- `types/` : types TypeScript metier.
- `actions/` : server actions auth, email et upload document.
- `supabase/` : client navigateur/serveur, schema SQL et seed.
- `hooks/` : emplacement reserve aux hooks applicatifs.

## Pages livrees

- `/login`
- `/dashboard`
- `/crm`
- `/crm/[id]`
- `/products`
- `/products/[id]`
- `/price-lists`
- `/orders`
- `/orders/new`
- `/orders/[id]`
- `/actions`
- `/documents`
- `/emails`
- `/commissions`
- `/settings`

## Supabase

1. Creer un projet Supabase.
2. Executer `supabase/schema.sql` dans SQL Editor.
3. Les buckets Storage `technical-sheets`, `safety-sheets`, `order-pdfs` et `client-documents` sont declares dans le schema.
4. Creer un utilisateur Auth.
5. Adapter `supabase/seed.sql` avec l'id utilisateur, puis executer le seed.
6. Renseigner `.env.local` depuis `.env.example`.

## Emails

La couche `actions/email.ts` fonctionne en mode demo si `RESEND_API_KEY` est absent. Avec une cle Resend, elle envoie via l'API Resend. Les champs SMTP sont prevus dans `.env.example` pour brancher un transport SMTP ensuite.

## PDF

Le bon de commande est genere par la route:

```txt
/api/orders/[id]/pdf
```

## Lancement

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000/dashboard`.
