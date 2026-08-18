# Wiring this up in Framer

This project runs locally as a normal Vite app (`npm run dev`) for
development and review — see the root `README.md`. Framer's canvas can't be
built by pasting a whole project into it, though, so getting it live on
Framer is a separate manual path, roughly 20 minutes including the hero and
footer. Do it in this order.

## 1. New project

- framer.com → New Project → free plan is fine.
- Rename the project **Skillpath**.
- Set the page background to a soft off-white (`#FAFAFA` or similar) —
  the course cards are pure white with a 1px border, so a slightly tinted
  page background is what gives them their edge instead of a shadow doing
  all the work.

## 2. The courses code component

This one now needs **three** Code Assets, not one — `SkillpathCourses.tsx`
imports `./SpotlightCard`, and Framer resolves relative imports between
Code Assets the same way a bundler would, as long as the filenames match
exactly.

1. Left sidebar → **Assets** → **Code** → **New Code File**, three times:
   `SkillpathCourses.tsx`, `SpotlightCard.tsx`, `SpotlightCard.css`.
2. Paste in the full, unchanged contents of each from this repo:
   [`src/components/SkillpathCourses.tsx`](./src/components/SkillpathCourses.tsx),
   [`src/components/SpotlightCard.tsx`](./src/components/SpotlightCard.tsx),
   [`src/components/SpotlightCard.css`](./src/components/SpotlightCard.css).
   `SkillpathCourses.tsx` imports from `"framer"`, which only resolves
   inside Framer's own runtime, so it needs no edits to work here even
   though it also runs locally via the `framer-shim.ts` alias (see root
   `README.md`).
3. Framer flags a red icon on a syntax error — there shouldn't be one, but
   if TypeScript complains, it's almost always a stray bracket from
   copy-paste, or the two files not both existing yet with the exact
   filenames the import expects.
4. Drag `SkillpathCourses` (not the other two — they're not meant to be
   dropped on canvas directly, only imported) from the Assets panel onto
   the canvas, inside a section/frame you can label "Courses."
5. Set its frame width to **100% / Fill** of its parent and give it a
   reasonable min-height (e.g. 400) so it isn't a 0px sliver while loading.
6. With it selected, open the right-hand **Properties** panel — **Accent
   Color** and **Card Radius** should show up there. Try changing them; no
   code editing required, that's the whole point of a property control.
   Accent Color now also tints the cards' spotlight glow on hover.
7. Resize the frame itself (drag the side handle) and confirm the grid goes
   3 → 2 → 1 columns as it narrows. This reacts to the frame's own width,
   so it's previewable right on canvas, not just after publishing.

## 3. Hero (above the courses section)

Video background + a Stack on top, copying the exact copy/colors from
[`src/components/Hero.tsx`](./src/components/Hero.tsx) /
[`src/App.css`](./src/App.css) so the local preview and the Framer version
match, rather than improvising new copy in Framer:

1. Set the hero frame's height to **Viewport Height (100vh)** (or fill the
   screen height) rather than "Fit content" — a video cropped down to a
   content-sized strip defeats the point of a fullscreen background.
   `overflow: hidden`, content vertically centered inside it.
2. Add a **Video** element filling the frame (Fill width/height): source
   `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4`,
   autoplay on, loop on, muted on (Framer requires muted for autoplay to
   work, same as the browser rule the code follows).
3. Add a flat dark rectangle on top, also filling the frame:
   `rgba(8, 9, 14, 0.55)` — this is the scrim; without it the text below
   won't reliably read against the footage.
4. On top of both, a **Stack** (vertical, centered, gap ~16px):
   - "Skillpath" wordmark — bold, small, uppercase, accent color
     (`#5B5FEF`), sits above the headline like a brand mark.
   - Headline: *"Learn the skill. Skip the fluff."* Large (~48px desktop),
     tight line-height, **white** (`#fff`, not near-black — this is on
     video now, not the page background, so it doesn't follow the
     light/dark toggle).
   - Subhead: *"Short, practical courses built by people who actually do
     the work."* `rgba(255,255,255,0.78)`.
   - A **Button** labeled *"Browse courses"*. Use the same accent color as
     the code component's property control (default `#5B5FEF`) as the
     button background, and match its corner radius to the **Card Radius**
     control's value (default `14`) so the two sections read as one system.
     Link it to the courses section (anchor or scroll-to).

## 4. Footer (below the courses section)

Copy from [`src/components/Footer.tsx`](./src/components/Footer.tsx):

- **Stack** (horizontal, space-between, top border to separate it from the
  page):
  - Three text links: *About*, *Contact*, *Terms*. Link them to `#` or a
    blank page; they don't need to go anywhere real for this assignment.
  - Copyright line: *"© 2026 Skillpath. All rights reserved."*

## 5. Publish

- Top-right **Publish** → Framer gives you a free
  `your-name.framer.website` (or `.framer.app`) link.
- Open that link yourself in an incognito window before submitting.
  Refresh it several times — the API fails often enough that you should see
  the skeleton, the ready grid, and (within a handful of refreshes) the
  error state with its retry button. Click retry and confirm it recovers.
  Watch specifically for the "Price unavailable — retry" case on an
  individual card; it needs the courses call to succeed while the country
  call fails, so it may take a few refreshes to catch.

## 6. Code hosting

- Push this folder to a public GitHub repo (or paste
  `SkillpathCourses.tsx` into a public Gist).
- Put that link, your published Framer link, the note, and the AI chat
  link together in the submission document.
