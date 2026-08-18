# Interview prep

Read this alongside `src/components/SkillpathCourses.tsx` open — it's
written to be pointed at ("why is this line here") on the call, not read
on its own.

## Walkthrough of the parts most likely to get picked

### `isValidCourse`

```ts
function isValidCourse(value: unknown): value is Course {
    if (typeof value !== "object" || value === null) return false
    const c = value as Record<string, unknown>
    return (
        typeof c.courseName === "string" &&
        ...
    )
}
```

This is a TypeScript **type guard** — the `value is Course` return
annotation tells the compiler that anywhere this function returns `true`,
`value` can be treated as a `Course` from then on. It exists because the
API is external: TypeScript's `Course` type is a compile-time promise, not
a runtime guarantee. `res.json()` returns `Promise<any>` regardless of what
the type annotation says a moment later — nothing stops the API from
sending a course missing `mangoId` on a bad day. This function is the one
place that distrust is actually enforced, by checking each field's runtime
`typeof` before anything downstream (like `formatPrice`, which assumes
`pricePaise` is a number) gets to run on it.

### Two hooks instead of one `Promise.allSettled`

`useCourses()` and `useCountry()` are separate custom hooks, each with its
own `useEffect`, own status, own retry counter. They're both called at the
top of `SkillpathCourses` and both fire their `fetch` on mount — so the two
requests still go out in parallel, exactly like `Promise.allSettled` would
give you, just without needing to combine them into one array of settled
results. The reason to keep them separate: they fail *independently* in
the UI (see below), and a retry needs to touch only the piece that failed.
If they shared one effect, retrying the country lookup after it fails
would either have to also re-run the courses fetch (wasteful, and risks
swapping a working course list for a fresh flaky call) or the effect would
need extra bookkeeping to retry just one half — which is exactly what two
separate hooks give for free.

### The country-failure branch (the one most worth defending)

```tsx
{countryStatus === "error" && (
    <span className="sp-price-unavailable">
        Price unavailable —{" "}
        <button type="button" className="sp-inline-retry" onClick={onRetryCountry}>
            retry
        </button>
    </span>
)}
```

If this were instead `country ?? "US"` (silently default to USD), the
component would never show an obviously-broken UI — but it could show a
*wrong* one, a dollar sign next to a price that should've been rupees, with
nothing telling the visitor that's a guess. That fails silently in the
worst way: it looks correct. "Price unavailable" is never wrong, only
incomplete, and says why (one API call failed) instead of pretending
everything's fine. The retry is scoped to `country.retry`, which only
re-runs `useCountry`'s effect — the course list already on screen doesn't
move.

### `formatPrice`

```ts
function formatPrice(course: Course, country: CountryCode): string {
    if (country === "IN") {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(course.pricePaise / 100)
    }
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(course.priceUsdCents / 100)
}
```

`pricePaise` and `priceUsdCents` are both stored in the smallest unit of
their currency — paise and cents — the same reason Stripe stores amounts in
cents: it avoids floating-point rounding on money. `/ 100` converts to the
"human" unit *before* formatting; doing it after formatting, or not at all,
is how you get ₹1,99,900 instead of ₹1,999. `Intl.NumberFormat` is used
instead of manually inserting commas/symbols because locale-correct digit
grouping (`en-IN`'s lakh/crore grouping vs. `en-US`'s thousands grouping)
is exactly the kind of thing that's easy to get subtly wrong by hand.
`maximumFractionDigits: 0` on the INR branch because rupee prices here are
whole numbers (`1999`, not `1999.00`) and Indian retail pricing
conventionally drops the paise in display; USD keeps its default 2 decimals
since `$39.99` is the expected shape.

### `useContainerWidth` / the column breakpoints

```ts
const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
```

`ResizeObserver` watches the actual rendered width of this component's own
wrapper `<div>`, not the browser viewport. A CSS `@media` query only knows
about viewport width, so it can't react to a Framer canvas frame being
dragged narrower — the frame isn't the viewport, the whole Framer editor
window is. Reading `contentRect.width` off the component's own container
means the same three breakpoints (`<700` → 1 col, `<1000` → 2, else 3) work
identically whether you're resizing the frame on canvas or resizing an
actual browser window after publishing.

### Property controls

```ts
addPropertyControls(SkillpathCourses, {
    accentColor: { type: ControlType.Color, title: "Accent Color", defaultValue: "#5B5FEF" },
    cornerRadius: { type: ControlType.Number, title: "Card Radius", min: 0, max: 32, step: 1, defaultValue: 14 },
})
```

`addPropertyControls` is Framer's API for exposing typed inputs in the
right-hand Properties panel — this is what turns "some props on a React
component" into "a lever a non-coder can pull." Both controls are purely
visual: `accentColor` is read wherever a `style={{ color: accentColor }}`
or `backgroundColor: accentColor` shows up (badge border/text, price text,
retry button); `cornerRadius` is read wherever `style={{ borderRadius:
cornerRadius }}` shows up (every card, including skeleton cards). Neither
touches fetch logic or state — changing them can't break the data flow,
which is exactly the guarantee you want before handing a control to
someone who isn't going to read the code behind it.

## Likely questions and short answers

**"Why not `Promise.all`?"** — `Promise.all` rejects as soon as *either*
promise rejects, discarding the other result even if it succeeded. That
would mean a flaky country call could wipe out a perfectly good course
list. `allSettled` (or, here, two independent hooks) is what lets one
failing without taking the other down.

**"What happens if the API changes and starts returning `price` instead of
`pricePaise`?"** — `isValidCourse` would filter every course out (no
`pricePaise` field), so the section would show the empty state rather than
crash or show `NaN`/`$0.00`. Not ideal, but safe — the honest answer is
this component doesn't handle schema *changes*, only schema *noise*
(missing fields on individual bad items), and reconciling with a changed
contract would need a code update either way.

**"Why is `cancelled` there in the effects?"** — If the component unmounts
(or the effect re-runs because of a retry) while a `fetch` is still in
flight, the old request's `.then`/`await` can still resolve later and call
`setState` on a component that's gone — React warns about this ("state
update on an unmounted component") and it can also let a stale, slower
response overwrite a newer one. The `cancelled` flag, checked right after
each `await`, makes the old response a no-op instead.

**"Why filter invalid courses instead of showing them with fallback
text?"** — Because a card with `"$NaN"` or a blank title is worse than not
showing that one card at all — it looks like the app is broken rather than
like the API sent something odd. Dropping + `console.warn` keeps the UI
honest without silently swallowing the problem — it's still visible to
whoever's debugging, just not to the visitor.

**"Why no search or sort?"** — Both are listed as optional in the brief,
explicitly lower priority than correctness, error handling, and
explainability. Leaving them out kept the component small enough that
every line has a clear reason to exist, which mattered more here than
maximizing feature count.

**"Why does the page have a dark mode toggle — that wasn't in the brief?"**
— Added afterwards, deliberately outside the graded component: it's a
page-level feature (`ThemeToggle.tsx`, `index.css`), not a third property
control on `SkillpathCourses.tsx`. The brief asked for exactly two
controls, and dark mode doesn't need to be one of them — the component
just reads CSS custom properties (`var(--sp-card-bg, #ffffff)`) that
`index.css` happens to redefine under `:root[data-theme="dark"]`. Paste
the same component into Framer, where those variables are never defined,
and the fallback values render it in plain light mode, unchanged.
