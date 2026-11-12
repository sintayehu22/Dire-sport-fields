# Dire Sport Fields

A Next.js App Router application for finding football fields in Dire Dawa and reserving bookable slots with a 30-minute payment window.

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

## Administrator workspace

The customer application and `/admin` workspace use separate named Firebase app
instances. Administrator sign-in therefore does not replace the anonymous Firebase
session that owns a customer's bookings. The interface is protected by the Firebase
Authentication `admin: true` custom claim; Firestore rules and every privileged
callable Function enforce the same claim on the server.

Admin routes include the overview, facilities, booking and 30-minute reservation
monitoring, payment reconciliation, customers, facility requests, review/feedback
moderation, reports and CSV exports, in-app announcements, settings, and the
server-generated activity log. Dashboard totals come from current Firestore records;
the app does not seed statistics, customers, bookings, reviews, or payments.

### Create or revoke an administrator

1. Enable **Email/Password** in Firebase Authentication and create the staff account.
2. Authenticate Application Default Credentials against the existing Firebase project.
3. Grant the claim from a trusted terminal (never from browser code):

   ```bash
   node functions/scripts/set-admin.js <firebase-auth-uid>
   ```

4. Ask the administrator to sign out and back in, then open `/admin/sign-in`.

Revoke access with:

```bash
node functions/scripts/set-admin.js <firebase-auth-uid> --revoke
```

Changing a Firestore profile document does **not** grant a role. Custom claims are the
only authorization source.

### Admin-managed data

- The verified facility code catalog remains the fallback. Admin edits and custom
  facilities are stored in `facilities`; the public directory merges those records at
  runtime. Bookable price and slot changes are also re-read and validated by the
  booking Cloud Function, so the browser is never trusted for price calculation.
- Private reviews retain booking ownership data in `reviews`. Approval copies only
  sanitized display fields to `publicReviews`; booking IDs and owner UIDs are not
  publicly readable.
- Customer restrictions live in `customerAdmin` and block new server-side bookings,
  requests, reviews, and feedback without deleting historical records.
- In-app notices use `adminNotifications`. Draft/admin-only records are protected;
  published customer notices are displayed on the public home page.
- `adminActivityLog` entries are written as part of validated server mutations. Browser
  clients cannot add or edit audit records directly.
- `platformSettings/general` contains only safe public contact and booking-availability
  settings. Chapa keys and webhook secrets stay in Firebase Secret Manager.

## Booking and payments

- `src/lib/booking-catalog.json` is the shared source for the currently bookable field prices and opening slots. The Cloud Functions use this server-side catalog to validate bookings and calculate ETB totals; never accept a price supplied by a browser.
- Booking creation and all time-slot locks run in the `createBooking` callable function using a Firestore transaction. Overlapping requests contend on the existing deterministic `fieldReservations` document IDs.
- New reservations have `pending_payment` / `unpaid` states and a server-created 30-minute `paymentExpiresAt`. `expireUnpaidBookings` runs every minute and releases locks transactionally. Booking creation also cleans up expired/legacy locks before checking availability.
- Chapa is the only payment provider wired in. The backend accepts only Chapa test-mode keys and verifies every callback with Chapa's server API before confirming a booking. A browser redirect is never treated as proof of payment.
- Verified payments arriving after expiry, cancellation, a lock conflict, or a mismatch are not confirmed; they are placed in the admin payment-review queue for manual refund/reconciliation.
- Firestore clients can read only their own bookings and payment attempts. Booking, payment, and lock writes are restricted to trusted Cloud Functions; administrators must have the server-managed `admin` Authentication custom claim.

### Configure and deploy

1. Enable Anonymous and Email/Password sign-in in Firebase Authentication. Anonymous sign-in is used for customer bookings; Email/Password is used on `/admin/payments`.
2. Install the Firebase CLI, sign in, and select the existing Firebase project as described above. Install the function dependencies with `npm install --prefix functions`.
3. Configure the Chapa test secret and a random webhook signing secret through Firebase Secret Manager. Do not put either value in a `NEXT_PUBLIC_*` variable or commit it:

   ```bash
   firebase functions:secrets:set CHAPA_SECRET_KEY
   firebase functions:secrets:set CHAPA_WEBHOOK_SECRET_HASH
   ```

   Use a Chapa **test-mode** secret (`CHASECK_TEST-...`). Live keys are rejected by the backend.
4. Deploy the functions, rules, and indexes:

   ```bash
   firebase deploy --only functions,firestore:rules,firestore:indexes
   ```

   During deployment, set the `APP_BASE_URL` function parameter to the public HTTPS URL of this app. Configure Chapa's webhook URL to the deployed `chapaWebhook` function and set the matching webhook secret hash in Chapa.
5. Set `NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION=us-central1` in `.env.local` (or your hosting provider's environment) and restart/redeploy the Next.js app. This must match the Functions region.
6. Create an Email/Password admin user in Firebase Authentication. With trusted Google Application Default Credentials for the Firebase project, grant the claim with `node functions/scripts/set-admin.js <firebase-auth-uid>`. Never grant this claim from the browser. Ask the administrator to sign out and in again, then visit `/admin/sign-in`.

Cloud Scheduler and the scheduled expiration function require the Firebase project's billing/Cloud Scheduler prerequisites. The deployment creates the required composite indexes; wait for them to finish building before testing booking queries.

### Validation and limits

Run `npm test`, `npm run lint`, and `npm run build`. Automated tests cover booking/payment decision rules, EAT slot locking, and administrator payload validation; they do not simulate Chapa, Cloud Scheduler, Firebase custom-claim propagation, or concurrent Firestore transactions. Complete a Chapa test-mode checkout and verify the webhook, scheduled expiry, admin authorization, and Firestore indexes in a deployed Firebase test project before accepting live payments.

Refunds are deliberately not issued automatically. Late or mismatched payments appear in the admin review queue; staff must process refunds in Chapa and record the result in the dashboard. The catalog and listed prices remain project data and must be confirmed with each venue before launch.
