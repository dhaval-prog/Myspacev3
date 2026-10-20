# Myspace v3

Mobile app (Expo + React Native) built from the **"Sticker pop"** design handoff: cream dot-grid paper, thick ink outlines, hard offset shadows, tilted stickers and stamp/pop animations.

## Run it

```bash
npm install
npx expo start          # press i / a for a simulator, or scan with a dev build
npx expo start --web    # web preview, drawn inside a 390×844 phone frame
```

Checks: `npx tsc --noEmit` and `npx eslint src`.

## Deploy (web)

`vercel.json` builds the web version (`npm run build` → `dist/`) and serves it as a single-page app. On vercel.com: **Add New → Project → import `dhaval-prog/Myspacev3`** and deploy with the defaults. Every push to `main` redeploys.

## Screens

| Route | Screen |
| --- | --- |
| `/` | 01 Splash — logo stamps in, tap stickers to peel them |
| `/welcome` | 02 Welcome — camcorder clip, ticker, slide to start |
| `/signup` | 03 Sign up — one question at a time, editable chips, password strength |
| `/avatar` | 04 Pick your look — photo + colour, sticker re-paints |
| `/login` | 05 Log in — intercom panel, LCD echoes typing, BUZZ |
| `/verify` | 06 Check mail — envelope flap opens, letter rises |
| `/success` | 07 Your pass — lanyard drop, holo foil, drag to tilt |
| `/friends` | 08 Add friends — QR + invite code, type a code, Add → ADDED |
| `/chat` | 09 Home · Chats |
| `/throw` | Throw a letter along the route |
| `/map` | 10 Map — pins, filters, zoom, glass sheet, throw from a card |
| `/games`, `/games/npat`, `/games/trivia` | G1–G3 |
| `/pocket`, `/pocket/[id]` | P1–P2 |

## Code map

- `src/app/` — routes (Expo Router), one file per screen.
- `src/theme/tokens.ts` — colours, fonts, dot-grid / hard-shadow helpers, `₹` formatting.
- `src/theme/anim.ts` — every `sk*` / `gp*` keyframe from `animations.css`, ported to Reanimated 4 CSS animations.
- `src/ui/` — primitives (`T` text, `Press`, `Icon`, tab bar, screen frame) and visual helpers (sheen, stroke-draw, stripes, barcode).
- `src/state/store.tsx` — shared app state and **all mock data** (people, chats, pocket cards). Replace with real APIs.

Gradients, dot grids and multi-layer shadows use React Native's built-in CSS `backgroundImage` / `boxShadow` (RN 0.76+, New Architecture), so they render the same on iOS, Android and web.

## Not wired yet

All data is mock. Sign up / log in / verify, friend codes, chats, map locations, games and Pocket need real backends. The alternate design variants in the handoff (sign-up B03/chat, home album/cork/bento, friends sheet/list) were not built; the defaults were.
