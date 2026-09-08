# Gaby's Hair Studio — Booking Site

A booking site for a hair salon, built as a demo/template for a booking-SaaS
product (the same pattern works for personal trainers, barbers, beauticians,
etc. — "Gaby's Hair Studio" is the example business).

- **Client side** (no login required): browse services & prices, see Gaby's
  open appointment slots, and request a booking with name/phone/email.
- **Admin side** (Gaby logs in): a dashboard of booking requests to confirm
  or decline, a schedule page to open up new appointment slots, and a
  services page to manage packages & prices.

## Stack

- **Server**: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT auth
  (httpOnly cookie) for the admin.
- **Web**: React, TypeScript, Vite, React Router.
- Single deployable service: the server serves the built React app and the
  `/api/*` routes.

## How it's modeled

- A **Service** is a package Gaby offers (name, description, price, duration).
- A **Slot** is a block of time Gaby has opened up for booking (start time +
  duration). Slots are created by the admin (one at a time or in a batch)
  and are either open or booked.
- A **Booking** links a client (name, phone, email, optional note) to a
  Slot and a Service, with a status: `pending`, `confirmed`, or `declined`.
  Clients create bookings in `pending` state; the admin confirms or
  declines them from the dashboard. Confirming a booking locks the slot;
  declining frees it back up.
- A single **Admin** account (seeded from env vars) is the only login on
  the site — clients never create accounts.

## Local development

Requires a local Postgres database (or point `DATABASE_URL` at any Postgres instance).

```bash
cd server
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npx prisma migrate deploy
npm run seed             # seeds demo services + a week of open slots
npm run dev              # starts the API on :3000

# in another terminal
cd web
npm install
npm run dev               # starts the Vite dev server on :5173, proxying /api to :3000
```

Log in to the admin dashboard at `/admin/login` with `ADMIN_EMAIL` /
`ADMIN_PASSWORD`.

## Deploying

Set these environment variables on the server service: `DATABASE_URL` (from
your Postgres service), `JWT_SECRET` (a long random string), `ADMIN_EMAIL`,
`ADMIN_PASSWORD`, `ADMIN_NAME`, `BUSINESS_NAME` (defaults to "Gaby's Hair
Studio"). The root `npm run build` builds both the web app and the server;
`npm start` runs `prisma migrate deploy` then starts the server, which
serves the built frontend and the API from one process/port.

On a platform with a separate pre-deploy step (e.g. Railway), run the
migration and seed there, in that order — using the repo's own installed
Prisma binary rather than `npx prisma` (which fetches an unrelated latest
version from the registry and doesn't understand this schema/CLI):
`server/node_modules/.bin/prisma migrate deploy --schema=server/prisma/schema.prisma && npm run seed --prefix server`.
