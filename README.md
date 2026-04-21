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
