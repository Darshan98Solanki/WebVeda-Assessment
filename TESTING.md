# Manual testing checklist

Run `npm run dev` and test against `http://localhost:5173` — faster to
iterate on than the Framer canvas, and it's the same
`src/components/SkillpathCourses.tsx` file either way. Re-verify the ones
that matter most (2, 4, 16–18) once it's actually pasted into Framer per
`FRAMER_SETUP.md`, since that's what ships.

The API's failures are probabilistic (~1/3 of calls), not switchable on
demand, so most of this is repeated refreshing rather than a mock server —
reasonable for this scope. Two temporary tricks make the unlikely paths
reachable without waiting on luck; both are reverted before the final
commit, never shipped.

**Trick 1 — force an error:** temporarily point `COURSES_ENDPOINT` (or
`COUNTRY_ENDPOINT`) at a typo'd path, e.g. `/assignment/course-datax`, which
the API will 404 on every call. Confirm the error/price-unavailable UI,
then put the real path back.

**Trick 2 — force slow:** Chrome DevTools → Network → throttle to "Slow
3G," reload, confirm the skeleton holds with no flicker or duplicate
request.

## Checklist

| # | Scenario | How | Expected |
|---|---|---|---|
| 1 | Both APIs succeed | Refresh until you get a clean pass | Grid renders, correct currency, no console errors |
| 2 | Course API → 404 | Trick 1 on courses endpoint | Section-level error state, "Try again" button |
| 3 | Course API → 500 | Refresh until API returns 500 naturally, or trick 1 | Same error state (message doesn't leak the status code) |
| 4 | Country API → 404 | Trick 1 on country endpoint | Grid still renders; every card's price slot reads "Price unavailable — retry" |
| 5 | Country API → 500 | Same as above | Same as above |
| 6 | Course API → `[]` | Wait for a natural empty response | "No courses available" / "Check back soon" — visually distinct from the error state |
| 7 | 5 courses returned | Refresh a few times | Grid lays out cleanly, no leftover empty grid cells |
| 8 | 10 courses returned | Refresh a few times | Same, more rows, no column drift |
| 9 | Country = IN | Refresh until you land on IN | Prices use `pricePaise / 100`, ₹ symbol, `en-IN` grouping |
| 10 | Country = US | Refresh until you land on US | Prices use `priceUsdCents / 100`, $ symbol, 2 decimals |
| 11 | Very long description | Any course with a long `description` | Clamped to exactly 2 lines, `…` implied by clamp, card height unchanged vs. short descriptions |
| 12 | Missing/invalid price field | Trick 1: temporarily strip `pricePaise` from one item in a forced 200 response (or edit the response in DevTools) | That single course is dropped (not rendered with `undefined`), a `console.warn` fires, the rest of the grid renders normally |
| 13 | Slow API response | Trick 2 | Skeleton holds, no layout jump when data arrives |
| 14 | Retry after section error | Trigger error, click "Try again" | Returns to loading, then ready (assuming the retried call succeeds) |
| 15 | Retry after country-only failure | Trigger scenario 4/5, click the inline "retry" on a card | Only the price slots update; course list doesn't re-fetch or re-render from scratch |
| 16 | Mobile width (<700px) | Narrow the Framer frame or resize browser | 1 column, no horizontal scroll, no broken card spacing |
| 17 | Tablet width (700–1000px) | Same | 2 columns |
| 18 | Desktop width (>1000px) | Same | 3 columns |
| 19 | Property control: Accent Color | Change in Framer's Properties panel | Badge outline/text, price text, retry button, and each card's hover spotlight glow all update together |
| 20 | Property control: Card Radius | Same | Every card and skeleton card's corner radius updates together |
| 21 | Card spotlight glow | Move the cursor across a card | Glow follows the cursor smoothly, fades in on hover/out on unhover, stays clipped to the card's rounded corners, doesn't cover or dim the text on top |
| 22 | Reduced motion | OS setting → "reduce motion" (or DevTools → Rendering → emulate `prefers-reduced-motion: reduce`), reload | Spotlight glow's fade transition, card hover-lift, and skeleton shimmer all stop; content is otherwise unaffected |

Scenarios 2–18 line up with the assignment's own 18-point testing list;
19–22 cover the two property controls and the two extras added afterward
(spotlight glow, reduced-motion), since those weren't part of the original
list but are still real, testable behavior.
