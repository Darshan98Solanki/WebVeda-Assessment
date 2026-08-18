# Wiring this up in Framer

Framer's canvas can't be built by pasting a file into it — this is the
manual path, roughly 20 minutes including the hero and footer. Do it in
this order.

## 1. New project

- framer.com → New Project → free plan is fine.
- Rename the project **Skillpath**.
- Set the page background to a soft off-white (`#FAFAFA` or similar) —
  the course cards are pure white with a 1px border, so a slightly tinted
  page background is what gives them their edge instead of a shadow doing
  all the work.

## 2. The courses code component

1. Left sidebar → **Assets** → **Code** → **New Code File**.
2. Name it `SkillpathCourses.tsx`.
3. Delete the placeholder content and paste in the full contents of
   [`SkillpathCourses.tsx`](./SkillpathCourses.tsx) from this repo.
4. Framer flags a red icon on a syntax error — there shouldn't be one, but
   if TypeScript complains, it's almost always a stray bracket from
   copy-paste.
5. Drag the component from the Assets panel onto the canvas, inside a
   section/frame you can label "Courses."
6. Set its frame width to **100% / Fill** of its parent and give it a
   reasonable min-height (e.g. 400) so it isn't a 0px sliver while loading.
7. With it selected, open the right-hand **Properties** panel — **Accent
   Color** and **Card Radius** should show up there. Try changing them; no
   code editing required, that's the whole point of a property control.
8. Resize the frame itself (drag the side handle) and confirm the grid goes
   3 → 2 → 1 columns as it narrows. This reacts to the frame's own width,
   so it's previewable right on canvas, not just after publishing.

## 3. Hero (above the courses section)

Plain Framer, no code — but keep it visually consistent with the courses
section below it, since that consistency is part of the brief:

- **Stack** (vertical, centered, gap ~16px):
  - "Skillpath" wordmark/logo text — bold, small, sits above the headline
    like a brand mark, not styled as the headline itself.
  - Headline — e.g. *"Learn the skill. Skip the fluff."* Large, tight
    line-height, dark near-black text (`#111`), not pure black.
  - One-line subhead — e.g. *"Short, practical courses built by people who
    actually do the work."* Muted gray (`#555`), same as the course card
    description color, for consistency.
  - A **Button** — label *"Browse courses"*. Use the same accent color you
    set on the code component's property control (default `#5B5FEF`) as
    the button background, and match its corner radius to the **Card
    Radius** control's value (default `14`) so the two sections read as
    one system, not two different UI kits stitched together. Link it to
    the courses section (anchor or scroll-to).

## 4. Footer (below the courses section)

- **Stack** (horizontal, space-between, muted background or just a top
  border to separate it from the page):
  - Three text links — e.g. *About*, *Contact*, *Terms*. Link them to `#`
    or a blank page; they don't need to go anywhere real for this
    assignment.
  - A copyright line — e.g. *"© 2026 Skillpath. All rights reserved."*

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
