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
| `EXPO_PUBLIC_MAPBOX_TOKEN`, `EXPO_PUBLIC_MAPBOX_STYLE_URL`, `EXPO_PUBLIC_MAPBOX_FRIENDS_MAP_STYLE_URL` | The real map on Map and Throw **on web** (native uses Apple/Google Maps). Defaults to the same public token as v2 (`src/v2/lib/mapbox.ts`). |

### Google sign-in setup (one-time, Supabase dashboard)

Supabase only redirects back to URLs on its allow-list and otherwise falls back to the project's Site URL (v2's site). In **Authentication → URL Configuration → Redirect URLs**, add:

- `https://myspacev3*.vercel.app/**` (production + preview deploys) and any custom domain
- `myspacev3://**` (the native app — v3 uses its own scheme so sign-in never opens the v2 app)
- `http://localhost:8081/**` for local web dev

Google sign-in always opens Google's account chooser (`prompt=select_account`).

### Database

Map visibility: `throw_profiles.location_visibility` defaults to `all` (everyone); people narrow it to `friends` or `ghost` with "Show me to" (Map) or Throw settings. Old values from before this change are in `throw_profiles_visibility_backup_20261020`. Throw's map background (`user_settings.throw_map_show_background`) defaults to on.

`profiles.avatar_color` (smallint 0–7, nullable) stores each person's sticker colour so friends see it. Added by the `profiles_avatar_color` migration, which also makes `handle_new_user` copy `avatar_color` from sign-up metadata. Additive only; v2 ignores it.

## Deploy (web)

`vercel.json` builds the web app (`npm run build` → `dist/`) as a single-page app; `public/` adds the PWA manifest and icons, so it can be added to a phone's home screen and opens full-screen. On vercel.com: **Add New → Project → import `dhaval-prog/Myspacev3`**, add `EXPO_PUBLIC_MAPBOX_TOKEN` (same value as v2's Vercel project) under Environment Variables, and deploy. Every push to `main` redeploys.

On phones the web app fills the screen; on desktop it shows as a centred mobile-width column.

Launch speed:
- **Caching** — `vercel.json` marks the hashed app code (`/_expo/static`, `/assets`) as cache-forever, so phones keep it between opens.
- **Offline** — a service worker (`scripts/sw.js`, written to `dist/sw.js` with the build id and first-screen files by `scripts/stamp-sw.mjs` during `npm run build`) keeps code, fonts and launch images on the phone; pages are network-first with a 3 s fallback to the saved copy, so new deploys show up on the next open and the app still opens offline.
- **Fonts (web)** — Latin-subset WOFF2 files in `public/fonts/` (`scripts/build-web-fonts.py`), declared and preloaded in `public/index.html`; the app waits at most 2.5 s for the first screen's fonts (`src/ui/fonts.web.ts`). Native still bundles the TTFs (`src/ui/fonts.ts`).

`public/index.html` shows the splash as a still image (`public/launch-hero.webp`) before any JavaScript runs, and `hideBoot()` lifts it once the app is ready. Mapbox GL and three.js load on demand (Map/Throw), and only the fonts the first screens need block launch. If you change the splash layout, re-capture `launch-hero.webp` so the two still match.

## Screens

| Route | Screen | Data |
| --- | --- | --- |
| `/` | Splash on every app launch; "Step inside" → Chats (signed in) or sign-up | — |
| `/welcome`, `/signup`, `/avatar` | Welcome, sign up, pick your look | Creates the Supabase account (name, colour, photo) |
| `/login` | Log in (intercom) | Supabase sign-in, password reset |
| `/verify` | Check mail | Resend confirmation email |
| `/success` | Your pass | Profile, friend / letter / game counts |
| `/friends` | Add friends | Your real friend code + QR, look up a code, send request |
| `/chat` | Chats | Friends, groups, last message, unread, online, typing, requests |
| `/thread` | Chat thread, group chat, requests, new group, QR scanner | v2 screens |
| `/throw`, `/letters` | Throw + received letters | v2 screens |
| `/map` | Map (Mapbox) | Everyone sharing a location: friends + people who show themselves to everyone ("Add friend" on strangers). "Show me to" switch: Everyone / Friends / Hidden; accounts made in v3 default to Everyone |
| `/games`, `/games/npat`, `/games/trivia` | Games hub; real multiplayer NPAT and Trivia | Leaderboard/points; v2 game screens |
| `/pocket` | Pocket (v2 screen: card deck, wallet, add/join, members, history, transfers) | Budget cards and spends; `?card=<id>` opens a card |
| `/look` | Pick your look (change colour/photo any time) | `profiles.avatar_color` / `avatar_url` |
| `/account` | Account settings | v2 screen |

## Code map

- `src/app/` — routes (Expo Router). `_layout.tsx` gates routes on the Supabase session and mounts the signed-in providers. `(tabs)/` holds Chat, Throw, Map, Games and Pocket as tabs that stay loaded (paused while hidden) so switching is instant; use `toTab()` / `backToTab()` from `src/ui/nav.ts` to move between them.
- `src/v2/` — Myspace v2's data layer (`context/`, `lib/`, `types/`, `utils/`) and the screens reused as-is (Throw, chat threads, games, wallet, account). Ported unchanged apart from React Native 0.88 type fixes; excluded from ESLint (see `eslint.config.js`).
- `src/state/` — local sign-up draft (`store.tsx`) and the signed-in profile + avatar upload (`profile.tsx`).
- `src/theme/` — design tokens and every `sk*` / `gp*` keyframe from the handoff's `animations.css`.
- `src/ui/` — primitives, tab bar, avatar helpers, visual effects.

## Notes

- Throw, chat threads, the real-time games and the wallet's extra sheets use v2's own screens and styling; the rest uses the v3 sticker design.
- Calls (`react-native-webrtc`), camera scanning and speech-to-text need a development build (`npx expo run:ios|android` or EAS), not Expo Go.
