# Ystask

Personal productivity platform: instant tools that need no account, plus habit, expense and job application trackers behind a sign-in. Frontend for [ystask-api](../ystask-api).

- **Instant tools**: character counter, spin wheel, password generator, QR code, unit converter, JSON formatter, pomodoro.
- **Trackers**: habits with streaks and a GitHub-style heatmap, expenses with monthly budgets and charts, job applications on a drag-and-drop Kanban board.
- **Dashboard** that combines all three, and an **admin area** for user management.

UI language is English. Vietnamese localization is planned as an i18n layer later.

## Stack

| Part | Choice |
|---|---|
| Framework | Vue 3 (`<script setup>`) + TypeScript + Vite |
| State | Pinia |
| Routing | Vue Router 4 with role-based guards |
| Styling | Tailwind CSS v4 over a neo-brutalist token system (Space Grotesk, ink borders, hard offset shadows) |
| Theme | Light and dark variants, three-way preference: system, light, dark |
| Charts | Chart.js via vue-chartjs |
| Drag and drop | vuedraggable |
| Icons | lucide-vue-next |

## Run locally

Requires Node.js 20+. Start [ystask-api](../ystask-api) first on port 5010.

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api to localhost:5010
npm run build      # typecheck + production build
```

Dev admin account: `admin@ystask.local` / `Admin@123` (seeded by the API).

## Layout

```
src/
├── app.css                  # Tailwind v4 theme mapping + brutal utilities and animations
├── styles/tokens.css        # Design tokens, light on :root and dark via [data-theme='dark']
├── components/ui/           # UiButton, UiCard, UiInput, UiModal, UiStat, UiToaster...
├── components/layout/       # PublicShell, AppShell (sidebar), BrandMark
├── composables/             # useTheme (system/light/dark), useCountUp
├── features/
│   ├── tools/               # registry.ts + one folder per tool
│   ├── habits/  expenses/  jobs/
├── views/                   # Home, auth/, app/ (Dashboard, Habits, Expenses, Jobs, Admin)
├── stores/                  # Pinia: auth, toast
├── services/                # http.ts (auto refresh-token retry) + one service per module
└── utils/                   # date.ts, money.ts
```

Adding an instant tool: add one entry to `src/features/tools/registry.ts`. The route and home page card generate themselves.

## Theme

Tokens live in `src/styles/tokens.css`. The default preference follows the OS (`prefers-color-scheme`); users can pin light or dark, persisted in `localStorage['ystask-theme']` and applied before first paint by a script in `index.html`.

Animations are CSS-only and cheap on low-end devices: staggered entrances, a marquee ticker, mechanical button presses, count-up stats. Everything respects `prefers-reduced-motion`.

## Deploy to Vercel

1. Import the repo into Vercel (framework preset: Vite).
2. In `vercel.json`, replace the placeholder backend URL with your deployed API URL.
3. Deploy. `/api/*` is rewritten to the backend; every other route serves the SPA.

The backend must list your Vercel domain in `Cors__AllowedOrigins`.
