# Scam Radar India

A community-powered scam detection platform for India — users can check numbers/UPI IDs/messages for scam risk, report scams, earn points, and stay updated on threats.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080)
- `pnpm --filter @workspace/admin run dev` — Admin dashboard (port 23744, BASE_PATH=/admin/)
- `pnpm --filter @workspace/mobile run dev` — Expo mobile app (port 18115)
- Admin password: `scamradar-admin-2024` (override via `ADMIN_PASSWORD` env var)

Required env vars: `FIREBASE_SERVICE_ACCOUNT` (base64 JSON for Firebase Admin SDK)

## Stack

- **API**: Express 5, Pino logging, esbuild bundle, Node 24
- **Admin**: React + Vite, TanStack Query, Tailwind
- **Mobile**: Expo SDK 54, expo-router, React Native 0.81, AsyncStorage
- **Push**: Firebase Admin SDK (FCM only — no Expo push service)
- **Auth**: JWT (admin), Google Sign-In (mobile users), device UID for anonymous
- **Storage**: In-memory + JSON file (store.json, users.json) — no external DB

## Where Things Live

- `artifacts/api-server/src/routes/` — all API routes
- `artifacts/api-server/src/lib/store.ts` — reports & alerts store
- `artifacts/api-server/src/lib/userStore.ts` — user profiles & leaderboard
- `artifacts/api-server/src/lib/firebase.ts` — Firebase Admin, FCM send, auto-cleanup
- `artifacts/mobile/app/(tabs)/` — all tab screens (9 tabs)
- `artifacts/mobile/context/` — ScamContext, AuthContext, ThemeContext
- `artifacts/mobile/constants/colors.ts` — dark + light theme tokens
- `artifacts/admin/src/pages/` — admin panel pages

## Architecture Decisions

- FCM tokens stored in Firebase RTDB under `fcmTokens/{uid}` — auto-cleaned on send failure
- Invalid FCM tokens (SenderId mismatch etc.) are auto-removed after failed send
- Reports stored in flat JSON file; user profiles in separate users.json
- Points system: +5 submit, +20 verified, -10 rejected — drives leaderboard
- Notification deep links: `verified_report` → Verified tab, `admin_broadcast` → Alerts tab
- Light/dark theme persisted in AsyncStorage, overrides system preference

## Product

- **Check tab**: Analyze any phone number, UPI ID, or suspicious message for scam risk
- **Alerts tab**: Live threat intelligence feed with pulsing indicator
- **Verified Reports tab**: Admin-confirmed scams visible to all users
- **Leaderboard tab**: Top reporters ranked by reputation points
- **Tips tab**: Expandable scam awareness cards (UPI, OTP, calls, jobs, investments)
- **News tab**: Curated cybercrime news from govt/regulatory sources
- **Report tab**: Submit scam reports (earns +5 pts; +20 if verified, -10 if rejected)
- **History tab**: Local check history with filter by type
- **Profile tab**: Google sign-in, stats, dark/light toggle, Emergency 1930 SOS button
- **Results screen**: Animated risk gauge + share button

## User Preferences

- Firebase FCM only (no Expo push service)
- Admin panel at /admin/ path
- All features: leaderboard, points, verified reports, tips, news, share, SOS, dark/light theme
- Notifications must be clickable and deep-link to relevant screen

## Gotchas

- `getDevicePushTokenAsync()` fails silently in Expo Go SDK 53+ — need standalone APK for real FCM
- Stale FCM tokens auto-cleaned on send; manual clear via admin panel → Broadcast
- API type errors in alerts.ts/reports.ts are pre-existing (param type widening) — don't affect runtime
- Mobile bundling shows "Unauthorized request" CORS noise from Expo Go web mode — not a real error
