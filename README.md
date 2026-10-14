# UsVault

Private, mobile-first couple memory PWA built with React + Vite + Tailwind + Firebase.

## Folder structure

```text
usvault/
  public/
    pwa-192.svg
    pwa-512.svg
  src/
    components/
      AppShell.jsx
      InstallPrompt.jsx
      StatusBadge.jsx
    config/
      accessControl.js
    constants/
      options.js
    context/
      AuthContext.jsx
    firebase/
      config.js
    pages/
      DashboardPage.jsx
      LoginPage.jsx
      MemoryJournalPage.jsx
      MoodTrackerPage.jsx
      StatusPage.jsx
    services/
      journalService.js
    utils/
      date.js
    App.jsx
    index.css
    main.jsx
  .env.example
  firestore.rules
  storage.rules
  vite.config.js
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill Firebase credentials.
3. Keep `VITE_STRICT_COUPLE_MODE=false` for open multi-user signup.
4. Set `VITE_ADMIN_EMAILS` with your admin email(s).
5. Start:

```bash
npm run dev
```

If the Firebase variables are missing, the app shows a "Firebase is not configured" screen listing what to fill in.

### Environment variables

| Variable | Required | Where to get it |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Yes | Firebase Console → Project settings → General → Your apps → Web app config |
| `VITE_FIREBASE_VAPID_KEY` | For push | Firebase Console → Project settings → Cloud Messaging → Web Push certificates |
| `VITE_ADMIN_EMAILS` | Optional | Your admin email(s); also update the list in `firestore.rules` / `storage.rules` |
| `VITE_STRICT_COUPLE_MODE`, `VITE_ALLOWED_USERS` | Optional | Restrict signup to listed emails |

### Run locally without a Firebase project

Requires Java 11+. Uses the Firebase Emulator Suite (auth 6209, firestore 62091, storage 62092):

```bash
npm run emulators   # terminal 1
npm run dev:local   # terminal 2
```

### Quality checks

```bash
npm run lint
npm run test
npm run test:rules   # Firestore security-rules tests (starts the emulator, needs Java)
npm run build
```

## What changed in v1.1

| Before | After |
| --- | --- |
| Blank page when `.env` was missing (`auth/invalid-api-key` at import) | Clear setup screen listing missing variables |
| Setting today's mood wiped today's memory text and photo | Entries are saved field-by-field; nothing is overwritten |
| Partner linking always failed (rules rejected the write to the partner's profile) | Linking works via `partner_codes/{code}`; rules only allow setting `partnerUid` when the code really belongs to that user |
| Any signed-in user could list every profile (emails, partner codes, gossip, messages) | Profiles readable only by the owner, the linked partner and admins; partner codes are random and rotated |
| Partner's mood never showed (journal was owner-only) | Today's mood is shared through the status doc; journals stay private |
| Bans enforced only in the UI | Bans also enforced in Firestore rules |
| New signups could be signed straight out (duplicate access-control write race) | Access-control and profile setup de-duplicated / transactional |
| Firebase web config hardcoded in `public/firebase-messaging-sw.js`; FCM token logged to console | Worker gets config from env via its URL; token no longer logged |
| Generic auth errors, journal text over 2500 chars silently failed, `??` in header | Specific auth messages, 2500-char limit in the editor, fixed header text |

6. Install Cloud Functions dependencies:

```bash
cd functions
npm install
cd ..
```

## Implementation order

1. Dashboard page
- Today memory
- Current mood emoji
- Live status cards (You + Partner)

2. Memory journal
- Daily text entry
- Daily image upload to Firebase Storage
- Date-based memory list

3. Mood tracker
- Emoji mood selection
- Mood history list

4. Status system
- Free / Busy / Someone Around
- Real-time sync with Firestore listeners

5. Storage and data
- Firestore: journal text + mood + status metadata
- Firebase Storage: daily images

6. Authentication and moderation
- Email/password login and signup
- Optional strict allowlist mode via `VITE_STRICT_COUPLE_MODE`
- Admin dashboard for user moderation (ban/disable/delete app data)
- User access enforcement via `user_controls` collection

7. PWA
- Install prompt
- Standalone manifest
- Service worker precache + image runtime cache
- Firestore offline persistence enabled

## Firebase rules

Use the included `firestore.rules` and `storage.rules`, replacing admin emails with your real admin account(s) before deploying rules.

Rules support admin by custom claim (`admin: true`) and by admin email allowlist fallback.

**v1.1 needs the updated rules deployed** (`npm run firebase:deploy:rules`): partner linking, partner mood and the profile privacy fix depend on them. Existing users get a new random partner code on their next login.

## Production checklist

See [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) before release.

## Background push (app closed)

To receive partner updates when the app is closed:

1. Deploy Firestore/Storage rules:

```bash
npm run firebase:deploy:rules
```

2. Deploy Cloud Functions:

```bash
npm run firebase:deploy:functions
```

3. Ensure users grant notification permission and app is installed as PWA.
