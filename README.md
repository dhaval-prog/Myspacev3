# Myspace v3

Mobile app (Expo + React Native, also runs as a mobile web app) with the **"Sticker pop"** design, running on the same Supabase backend as Myspace v2: real accounts, friends, chats, Throw letters, map locations, multiplayer games and Pocket budgets.

## Run it

```bash
npm install
npx expo start          # press i / a for a simulator, or scan with a dev build
npx expo start --web    # mobile web app
```

Checks: `npx tsc --noEmit` and `npx eslint src`.

### Backend

`src/v2/lib/supabase.ts` defaults to the shared Myspace Supabase project (the same one v2 uses), so sign-in works out of the box. The publishable key there is a public client key — data access is enforced by the database's row-level security. Override with env vars (see `.env.example`):

| Variable | Needed for |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Pointing at a different Supabase project |
| `EXPO_PUBLIC_MAPBOX_TOKEN`, `EXPO_PUBLIC_MAPBOX_STYLE_URL` | Throw's map **on web** (native uses the platform map) |

## Deploy (web)

`vercel.json` builds the web app (`npm run build` → `dist/`) as a single-page app; `public/` adds the PWA manifest and icons, so it can be added to a phone's home screen and opens full-screen. On vercel.com: **Add New → Project → import `dhaval-prog/Myspacev3`**, add `EXPO_PUBLIC_MAPBOX_TOKEN` (same value as v2's Vercel project) under Environment Variables, and deploy. Every push to `main` redeploys.

On phones the web app fills the screen; on desktop it shows as a centred mobile-width column.

## Screens

| Route | Screen | Data |
| --- | --- | --- |
| `/` | Splash (signed-in users skip to Chats) | — |
| `/welcome`, `/signup`, `/avatar` | Welcome, sign up, pick your look | Creates the Supabase account (name, colour, photo) |
| `/login` | Log in (intercom) | Supabase sign-in, password reset |
| `/verify` | Check mail | Resend confirmation email |
| `/success` | Your pass | Profile, friend / letter / game counts |
| `/friends` | Add friends | Your real friend code + QR, look up a code, send request |
| `/chat` | Chats | Friends, groups, last message, unread, online, typing, requests |
| `/thread` | Chat thread, group chat, requests, new group, QR scanner | v2 screens |
| `/throw`, `/letters` | Throw + received letters | v2 screens |
| `/map` | Map | Friends' shared locations (+ people sharing with everyone) |
| `/games`, `/games/npat`, `/games/trivia` | Games hub; real multiplayer NPAT and Trivia | Leaderboard/points; v2 game screens |
| `/pocket`, `/pocket/[id]`, `/pocket/manage` | Pocket cards, card detail, full wallet | Budget cards, spends; v2 wallet for new/join/members/history |
| `/account` | Account settings | v2 screen |

## Code map

- `src/app/` — routes (Expo Router). `_layout.tsx` gates routes on the Supabase session and mounts the signed-in providers.
- `src/v2/` — Myspace v2's data layer (`context/`, `lib/`, `types/`, `utils/`) and the screens reused as-is (Throw, chat threads, games, wallet, account). Ported unchanged apart from React Native 0.88 type fixes; excluded from ESLint (see `eslint.config.js`).
- `src/state/` — local sign-up draft (`store.tsx`) and the signed-in profile + avatar upload (`profile.tsx`).
- `src/theme/` — design tokens and every `sk*` / `gp*` keyframe from the handoff's `animations.css`.
- `src/ui/` — primitives, tab bar, avatar helpers, visual effects.

## Notes

- Throw, chat threads, the real-time games and the wallet's extra sheets use v2's own screens and styling; the rest uses the v3 sticker design.
- Calls (`react-native-webrtc`), camera scanning and speech-to-text need a development build (`npx expo run:ios|android` or EAS), not Expo Go.
