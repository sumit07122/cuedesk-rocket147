# CueDesk — One Shot Club Management

CueDesk is a lightweight management app for a local snooker and gaming club. It is configured for **One Shot Snooker Gaming Club**, Indian rupees (₹), and the `Asia/Kolkata` business time zone by default.

## What it manages

- Live table availability, game timers, pause/resume, table transfers, and checkout.
- Customer records with a permanent club customer number, bills, payments, credit due, advance balance, and account history.
- A verified, read-only customer page for a customer’s own visits, receipts, playing time, and account activity.
- Food and drink items, orders, stock, table maintenance, club expenses, and reports.
- Owner, manager, worker, and customer access. Customer accounts cannot edit records or receive staff controls.

This installation does not use shifts, memberships, assigned member IDs, or multi-club subscriptions. Bills and ledger entries are retained; daily reports filter the history by the club’s time zone and do not reset or erase it.

## Run locally

Requirements: Node.js 18 or later and npm.

```sh
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`. Set the Firebase values in `.env` before signing into a live club database. The app can use its bundled preview Firebase configuration when the required environment values are absent; do not treat preview data as live club data.

## Firebase setup

1. Create a Firebase project, enable Cloud Firestore, and enable Email/Password authentication.
2. Add the production Vercel domain (and any preview domain you will use) to Firebase Authentication’s authorized domains. Require users to verify email before signing in.
3. Configure the `VITE_FIREBASE_*` client values in the local `.env` and Vercel project environment settings. `VITE_FIREBASE_API_KEY` and `VITE_FIREBASE_PROJECT_ID` select the configured project; the remaining values use Firebase’s standard defaults when omitted.
4. Deploy `firestore.rules` to the same Firebase project before using real customer or staff accounts. Vercel deployment does not deploy Firestore rules.
5. Create the first owner’s Email/Password Auth account in Firebase and verify its email. In Firestore Console, create `/users/{AUTH_UID}` with fields like the following (replace the UID and email with the actual account values):

   ```json
   {
     "id": "AUTH_UID",
     "uid": "AUTH_UID",
     "email": "owner@example.com",
     "displayName": "Club Owner",
     "fullName": "Club Owner",
     "role": "owner",
     "clubId": "club-royal-cue",
     "status": "active",
     "createdAt": 1790900000000
   }
   ```

   Use a number for `createdAt`. After the owner signs in, CueDesk initializes the club’s default settings. The owner can then add tables, invite staff, and link a customer’s verified email to that customer’s existing club profile.

### Deploy Firestore rules

Install or run the Firebase CLI, sign in to the intended Firebase account, and deploy the rules to the same project as the Vercel environment:

```sh
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project YOUR_FIREBASE_PROJECT_ID
```

Review the target project ID carefully before deployment. Do not put Firebase service-account credentials in Vercel’s `VITE_` variables or in the browser app.

## Deploy to Vercel

- Import the Git repository into Vercel.
- Set the project root to the folder containing this `package.json` if it is inside a subfolder.
- Build command: `npm run build`
- Output directory: `dist`
- Add the Firebase client environment variables from `.env.example` to the Vercel environment, then redeploy.
- The included `vercel.json` sends app routes to the single-page app entry point.

Firebase Authentication, Firestore, and the Firestore rules are configured separately from Vercel. A successful Vercel build alone does not confirm database permissions or sign-in configuration.

## Data, reports, and backups

Club records live in Firestore under `/clubs/club-royal-cue/...`. The main collections include `tables`, `history`, `customers`, `customerPortal`, `menuItems`, `expenses`, and `auditLogs`. Customer portal data is separated by customer and Firestore rules limit a customer to their own profile and activity.

Daily totals use the club’s configured time zone. They are calculated from the permanent bill, payment, refund, and expense records; closing a day does not clear transaction history. Use **Settings → Backup & Restore → Download Complete JSON Backup** and save copies somewhere separate from the counter computer. The automatic browser snapshot is local to that browser/device and is not a cloud backup.

Cash received is still entered by staff at checkout. The app records the signed-in account and constrains worker edits, but software cannot verify physical cash or make a browser-only system completely fraud-proof. Owners should reconcile receipts with cash/UPI totals and review the audit history. Server-side processing and a second-person approval for sensitive refunds or corrections are future hardening options.

## Checks

```sh
npm run lint
npm test
npm run build
```

These checks cover TypeScript, the existing core-engine tests, and the production frontend build. Firestore security rules need a separate Firebase CLI/emulator validation and deployment.
