# Claw lab — site & administration

Site de réservation pour Claw lab (nail art, Blancaa Institut, Arlon) et back-office
d'administration (réservations, facturation, dépenses).

Stack : Next.js 14 (App Router, TypeScript), PostgreSQL + Prisma, NextAuth
(Credentials), Tailwind CSS, @react-pdf/renderer, recharts.

## Structure

- Site public : `/`, `/tarifs`, `/reserver` — tarifs et réservation par créneau,
  alimentés depuis la base (modifiable depuis l'admin).
- Admin (protégé) : `/admin` — dashboard, réservations, factures, dépenses,
  paramètres.

## Démarrage en local

Prérequis : Node ≥ 18.17, PostgreSQL en cours d'exécution localement.

```bash
npm install
createdb clawlab_dev   # si la base n'existe pas encore
cp .env.example .env   # puis complétez DATABASE_URL, NEXTAUTH_SECRET, ADMIN_EMAIL/PASSWORD
npx prisma migrate dev
npm run db:seed
npm run dev
```

Le seed crée :

- les horaires (lundi-jeudi, 9h-18h — modifiables ensuite dans Paramètres),
- les prestations et tarifs de la grille fournie,
- un compte admin à partir de `ADMIN_EMAIL` / `ADMIN_PASSWORD` du `.env`.

⚠️ **Changez le mot de passe admin par défaut avant toute mise en production**
(via `ADMIN_PASSWORD` dans `.env` puis un nouveau `npm run db:seed`, ou plus tard
une gestion de mot de passe dédiée si besoin).

## Numéro de TVA / BCE / cotisation

Le salon est en régime de franchise de la TVA. Tant que le n° de TVA, le n° BCE et
le montant de cotisation ne sont pas connus, les factures indiquent automatiquement
« TVA non applicable, franchise de taxe (art. 56bis CTVA) ». Une fois ces
informations disponibles, renseignez-les dans **Admin → Paramètres** : elles
apparaîtront alors sur les factures et l'alerte du dashboard disparaîtra.

## Déploiement

Le projet est prêt pour un déploiement Vercel + base PostgreSQL managée (Neon,
Supabase, ou Vercel Postgres) :

1. Créez une base PostgreSQL chez le fournisseur de votre choix et récupérez son
   `DATABASE_URL`.
2. Sur Vercel, importez le repo et configurez les variables d'environnement
   (`DATABASE_URL`, `NEXTAUTH_URL` = URL de prod, `NEXTAUTH_SECRET` généré via
   `openssl rand -base64 32`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`).
3. Exécutez les migrations sur la base de prod : `npx prisma migrate deploy`.
4. Exécutez le seed une seule fois : `npm run db:seed` (avec `DATABASE_URL` de
   prod dans l'environnement).

Aucune donnée de paiement en ligne n'est traitée par l'application (paiement cash
au salon) : pas d'intégration de paiement à configurer.

## Limites connues / v1

- Pas d'envoi d'email de confirmation (aucun service SMTP fourni) — la
  confirmation est affichée à l'écran après réservation.
- La disponibilité anti-double-réservation est vérifiée par un contrôle applicatif
  au moment de la création (adapté à l'usage d'une seule praticienne) plutôt que
  par une contrainte base de données au niveau SQL.
