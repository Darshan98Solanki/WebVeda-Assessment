# Skillpath

A landing page for a fictional learning platform, "Skillpath," built as a
junior-developer assessment. It's a real Vite + React + TypeScript project
— not just a snippet — so the whole page (hero, courses, footer) runs and
is reviewable locally, with the courses section built as a standalone code
component that also pastes unchanged into Framer.

- [`src/components/SkillpathCourses.tsx`](./src/components/SkillpathCourses.tsx)
  — the graded part: the live-data code component
- [`src/components/Hero.tsx`](./src/components/Hero.tsx),
  [`src/components/Footer.tsx`](./src/components/Footer.tsx),
  [`src/App.tsx`](./src/App.tsx) — the rest of the page, plain
  React/CSS, no fetching
- [`FRAMER_SETUP.md`](./FRAMER_SETUP.md) — how to move this into an actual
  Framer project and publish it
- [`TESTING.md`](./TESTING.md) — manual test checklist, all 18 scenarios
- [`INTERVIEW_PREP.md`](./INTERVIEW_PREP.md) — line-by-line explanation of
  the parts most likely to get pointed at on the call
- [`NOTE.md`](./NOTE.md) — the submission note + AI usage statement

## Running it locally

```bash
npm install
npm run dev      # http://localhost:5173 — full page, hits the live API
npm run build    # type-checks (tsc -b) then production-builds with Vite
npm run lint     # oxlint
```

`SkillpathCourses.tsx` imports `addPropertyControls` / `ControlType` from
`"framer"`, which is a real package but only resolves inside Framer's own
canvas runtime — it isn't on npm. `vite.config.ts` aliases that import to
[`src/framer-shim.ts`](./src/framer-shim.ts), a small no-op stand-in, so the
exact same file both runs here via Vite and pastes unchanged into a Framer
code component later — see the comment at the top of the shim for why.

## Theme toggle (light/dark)

Not part of the graded brief — added afterwards as a local-preview polish
item, and worth being able to explain on its own terms if it comes up:

- [`ThemeToggle.tsx`](./src/components/ThemeToggle.tsx) is a fixed-position
  button that flips `document.documentElement.dataset.theme` between
  `"light"`/`"dark"` and persists the choice in `localStorage`.
- Every color in `App.css` and in `SkillpathCourses.tsx`'s own injected
  `<style>` reads a CSS custom property — e.g. `var(--sp-card-bg,
  #ffffff)` — defined once in [`src/index.css`](./src/index.css) under
  bare `:root` (light) and `:root[data-theme="dark"]` (dark). The fallback
  value after the comma is what renders if those variables are never
  defined at all — which is exactly the situation inside Framer, so the
  component still looks like its normal light-mode self there. The toggle
  is a page-level feature; the graded component didn't need a third
  property control to support it.
- A tiny **inline, non-module `<script>` in `index.html`** sets the
  `data-theme` attribute before first paint (reading `localStorage`, then
  falling back to `prefers-color-scheme`). A React `useEffect` can't do
  this — effects run after the first paint, which is exactly when a
  flash-of-wrong-theme would happen.

## What it does

Fetches `GET /assignment/course-data` (5–10 courses, count varies between
calls) and `GET /assignment/country-code` (`"IN"` or `"US"`) from
`https://syncsphere-hiv6.onrender.com`. Both endpoints fail ~1 in 3 calls
(404 or 500) on purpose. The component:

- Renders four distinct states for the **courses** fetch: **loading**
  (skeleton cards), **error** (message + retry button), **empty** (API
  returned `[]`), **ready** (the grid).
- Handles the **country** fetch completely independently, because it has a
  different failure consequence — see below.
- Converts `pricePaise` / `priceUsdCents` correctly (divide by 100 *once*,
  then let `Intl.NumberFormat` handle symbol/grouping) and picks the
  currency from `country_code`.
- Renders a responsive grid — 3 columns desktop, 2 tablet, 1 mobile — driven
  by the component's own width via `ResizeObserver`, not a fixed card count
  or a viewport media query.
- Exposes two property controls: **Accent Color** and **Card Radius**.

## The decision that matters most: country failure ≠ USD fallback

The brief explicitly warns against ever showing a price that might be
wrong. Silently defaulting to USD when the country lookup fails is a guess
wearing a confident font — a real Indian visitor could see a dollar figure
that reads as the actual price, not as "we don't know."

So the two fetches are decoupled (two small hooks, `useCourses` and
`useCountry`, each with its own status and retry counter) and the country
failure is handled at the *card* level, not the section level:

- **Courses fails** → nothing to show → section-level error state, retry
  button re-fetches courses.
- **Country fails, courses succeed** → the section still renders — every
  card shows name, description, and category, all of which we *do* have.
  Only the price slot shows `"Price unavailable — retry"`, with its own
  small retry that re-fetches *just* the country endpoint (not the whole
  course list).
- **Both fail** → section-level error state (no courses means nothing to
  price anyway, so this reduces to the first case).

Why two independent hooks instead of one `Promise.allSettled` call: with
`allSettled` the two results are indices in one array, and retrying either
half means re-running one effect that fetches both. Splitting them into two
hooks — each owning one `fetch`, one status, one retry — means a country
retry never re-fetches courses and vice versa, which is exactly the
behavior wanted here. It's also less code to trace for one thing at a time
than a single effect branching on two settled results.

## Why `fetch(url)` with nothing else

No custom headers, no explicit method. That keeps it a CORS "simple
request," so the browser sends it directly with no pre-flight `OPTIONS`
call. This API 405s anything that isn't a plain `GET`, so the smallest
possible request is also the only one guaranteed to work every time.

## Why `ResizeObserver` instead of a CSS media query

A Framer designer resizes the *frame* on canvas, not the browser window. A
`@media` query only reacts to viewport width, so it would never fire while
dragging the frame narrower on canvas — only after publishing. Watching the
container's own `contentRect.width` makes the same three breakpoints work
identically on canvas and on the published page.

## Property controls

| Control | Type | What it changes |
|---|---|---|
| Accent Color | Color | Category badge outline/text, price text, retry button background |
| Card Radius | Number (0–32) | Border radius on every card and the skeleton cards |

Both are visual-only — neither touches data or logic — which is what makes
them safe to hand to someone who isn't going to read the code. Locally
(outside Framer) there's no Properties panel to set them from, so
`src/App.tsx` passes them in as two plain constants shared by the hero and
the courses section, instead of hardcoding matching values in two places.

## Project structure

```
src/
  main.tsx                     entry point, mounts <App/>
  App.tsx                      composes Hero + courses section + Footer
  App.css / index.css          layout + reset (plain CSS, no framework)
  framer-shim.ts               local stand-in for the "framer" package (dev-only)
  components/
    Hero.tsx                   plain markup, no fetching
    Footer.tsx                 plain markup, no fetching
    ThemeToggle.tsx            light/dark toggle, page-level polish, not graded
    SkillpathCourses.tsx       the graded component — all the fetching/state lives here
```

One file per concern, nothing split further than that — a `utils/price.ts`
or a separate `CourseCard.tsx` file was considered and rejected as more
files to jump between for no readability gain at this size; `formatPrice`
and the small presentational sub-components live inside
`SkillpathCourses.tsx` instead, described in the file's own header comment.

## Scope decisions

- **No search or sort.** The brief lists them as optional, to be added only
  after the core is completely correct, and explicitly prioritizes
  explainability. Two extra pieces of state (search term, sort order) are
  easy to add later but were left out here to keep the component small
  enough that every line has an obvious reason to exist.
- **Malformed course entries are dropped, not partially rendered.** If an
  item from the API is missing a name, id, or either price field, it's
  filtered out before render and logged with `console.warn` — the
  alternative (rendering `undefined` or a blank price) is exactly what the
  brief says never to do.

## Known weak spots

- No automated tests — verification was manual, repeatedly refreshing until
  each of the 18 scenarios in `TESTING.md` had been hit at least once. Fine
  for this scope, wouldn't scale past it.
- The skeleton's card count (`columns * 2`) is computed from the *current*
  column count, which itself starts at a width-not-yet-measured default of
  3 on first paint. On a narrow frame this can mean the skeleton briefly
  shows a 3-column layout before correcting to 1 — sub-100ms in practice,
  but worth knowing about rather than pretending it's pixel-perfect from
  frame zero.

## AI use

Built with Claude Code (Sonnet 5). See [`NOTE.md`](./NOTE.md) for the full
AI usage statement and the shared chat link, and
[`INTERVIEW_PREP.md`](./INTERVIEW_PREP.md) for a line-by-line walkthrough of
the parts most worth being able to defend on the call.
