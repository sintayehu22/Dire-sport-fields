# Dire Sport Fields

A Next.js App Router starter for finding football fields in Dire Dawa, booking an available one-hour slot, and creating a group booking with an even per-player cost estimate.

The active app route is `app/page.tsx`. Reusable app code and mock field listings live in `src/`.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.local.example` to `.env.local` and fill in the Firebase web app configuration from the Firebase console.

3. In Firebase, create a Firestore database and enable **Anonymous** sign-in in Authentication.

4. Install and sign in to the Firebase CLI, then select your project:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   ```

5. Publish the included Firestore rules:

   ```bash
   firebase deploy --only firestore:rules
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Booking and group payments

- `src/lib/fields.ts` contains sample field details, ETB prices, and one-hour availability slots. Replace these mock listings with Firestore-backed field data before launch.
- The booking dialog collects a date, an available start time, and up to 20 player email addresses. The organizer is counted as a player.
- `src/lib/bookings.js` signs the organizer in anonymously, reserves the field/date/time in a Firestore transaction, and creates a `bookingGroups` document with each participant's equal share marked pending.
- `firestore.rules` lets a signed-in organizer create and read their group, prevents client edits to created groups, and prevents duplicate reservations for the same field, date, and start time.
- This starter records payment shares only; it does not collect money, send invitations, verify venue inventory, or integrate a payment provider. Add trusted server-side pricing, real field availability, invitation delivery, payment processing, and corresponding security rules before using it for live bookings.

Prices and available times are illustrative mock data, not confirmed venue listings.
