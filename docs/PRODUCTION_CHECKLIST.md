# Production Checklist

Use this checklist before every release.

## Quality Gates

- `npm run lint`
- `npm run test`
- `npm run build`
- GitHub Actions CI must pass on `main` and PRs.

## Firebase Security

- Deploy latest rules:
  - `npm run firebase:deploy:rules`
- Firestore and Storage rules support both:
  - custom claim: `request.auth.token.admin == true`
  - fallback admin email allowlist.
- Prefer custom claims in production.

## Admin Claims (recommended)

Set admin claim with Firebase Admin SDK (one-time per admin user):

```js
await admin.auth().setCustomUserClaims('<uid>', { admin: true })
```

After claim changes, users must sign out/in.

## Storage Upload Constraints

- Storage rules enforce image-only uploads and max 5 MB.
- If using Firebase Storage from web origin, configure bucket CORS for your domains.

## Environment Variables

Required:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_VAPID_KEY`

Optional:

- `VITE_STRICT_COUPLE_MODE`
- `VITE_ALLOWED_USERS`
- `VITE_ADMIN_EMAILS`

## Runtime Reliability

- Ensure Cloud Functions deployed for closed-app push notifications:
  - `npm run firebase:deploy:functions`
- Verify push token writes in `push_tokens/{uid}` and partner notification flow.

## Cost & Safety Controls

- Configure budget alerts in Google Cloud billing.
- Keep `VITE_STRICT_COUPLE_MODE=false` unless you explicitly want allowlist mode.
- Monitor Firestore and Storage usage quotas weekly.

## Release Steps

1. Merge only after CI passes.
2. Deploy frontend.
3. Deploy rules and functions.
4. Smoke test:
   - signup/login
   - memory upload
   - mood/status sync
   - delete + undo
   - partner notification (foreground + closed app)
