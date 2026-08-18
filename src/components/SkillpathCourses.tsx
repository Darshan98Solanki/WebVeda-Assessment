import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * Skillpath — Courses Section
 * ============================================================================
 * The one live-data section of the Skillpath landing page. A Framer code
 * component, not Framer's Fetch (Fetch can't map over an array to render a
 * variable-length grid).
 *
 * Talks to two independent, unauthenticated GET endpoints that fail on
 * purpose roughly 1 in 3 calls (404 or 500):
 *
 *   GET /assignment/course-data   -> Course[]                (5–10 items)
 *   GET /assignment/country-code  -> { country_code: "IN" | "US" }
 *
 * Three decisions worth being able to explain on the call:
 *
 * 1. TWO independent hooks/effects, not one combined Promise.allSettled.
 *    Courses and country fail and recover on completely different
 *    timelines and have different consequences (no courses = nothing to
 *    show; no country = can't price what we do have). Two small effects,
 *    each owning one fetch and one retry counter, means retrying the
 *    country lookup never re-fetches the courses, and a course-data retry
 *    never re-runs the country check. Combining them under one
 *    Promise.allSettled would still "handle" both, but then a retry has
 *    to decide which half of the settled array to re-run — more code for
 *    no real benefit here.
 *
 * 2. Country failing does NOT fall back to a guessed currency. A wrong
 *    currency symbol next to a real number reads as correct — that's
 *    worse than an obvious error. So when the country lookup fails but
 *    courses loaded fine, each card still shows everything we do know
 *    (name, description, category) and the price slot shows
 *    "Price unavailable" with its own small retry, instead of assuming
 *    USD or INR. See `CourseCard`'s price row.
 *
 * 3. fetch(url) is called with no method, no headers, no body. Any custom
 *    header (even "Content-Type") turns a GET into a non-"simple" CORS
 *    request and makes the browser send a pre-flight OPTIONS call first.
 *    This API 405s anything that isn't a plain GET, so the plainest
 *    possible request is also the only one guaranteed to work.
 */

const BASE_URL = "https://syncsphere-hiv6.onrender.com"
const COURSES_ENDPOINT = `${BASE_URL}/assignment/course-data`
const COUNTRY_ENDPOINT = `${BASE_URL}/assignment/country-code`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Course = {
    courseName: string
    courseCode: string
    description: string
    mainCategory: string
    shortCourse: string
    courseType: string
    pricePaise: number
    priceUsdCents: number
    mangoId: string
    refundable: boolean
}

type CountryCode = "IN" | "US"

type CoursesStatus = "loading" | "error" | "empty" | "ready"
type CountryStatus = "loading" | "ready" | "error"

type Props = {
    accentColor: string
    cornerRadius: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// The API is external and not contractually guaranteed. A course missing its
// name, id, or either price field can't be rendered safely, so it's dropped
// rather than shown with blanks or "undefined". Dropped items are logged for
// debugging, never shown to a visitor.
function isValidCourse(value: unknown): value is Course {
    if (typeof value !== "object" || value === null) return false
    const c = value as Record<string, unknown>
    return (
        typeof c.courseName === "string" &&
        typeof c.description === "string" &&
        typeof c.mainCategory === "string" &&
        typeof c.mangoId === "string" &&
        typeof c.pricePaise === "number" &&
        typeof c.priceUsdCents === "number" &&
        typeof c.refundable === "boolean"
    )
}

// pricePaise / priceUsdCents are both in the smallest currency unit.
// 199900 paise is ₹1,999.00, not ₹1,99,900 — dividing by 100 before handing
// the number to Intl.NumberFormat is the entire trick here. NumberFormat
// then owns the grouping/symbol/decimal rules so we never hand-build a
// currency string.
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

// ---------------------------------------------------------------------------
// Data hooks
// ---------------------------------------------------------------------------

function useCourses() {
    const [status, setStatus] = React.useState<CoursesStatus>("loading")
    const [courses, setCourses] = React.useState<Course[]>([])
    const [attempt, setAttempt] = React.useState(0)

    React.useEffect(() => {
        let cancelled = false
        // A no-op on mount (state already starts at "loading"), but this is
        // what makes the retry button work: bumping `attempt` re-runs this
        // effect, and this line is what resets status away from "error" or
        // "ready" back to "loading" before the new request starts.
        setStatus("loading")

        async function load() {
            try {
                const res = await fetch(COURSES_ENDPOINT)
                if (!res.ok) throw new Error(`course-data returned ${res.status}`)

                const data: unknown = await res.json()
                if (!Array.isArray(data)) throw new Error("course-data did not return an array")

                const valid = data.filter(isValidCourse)
                if (valid.length !== data.length) {
                    console.warn(
                        `Skillpath: dropped ${data.length - valid.length} malformed course(s) from the API response.`
                    )
                }

                if (cancelled) return
                setCourses(valid)
                setStatus(valid.length === 0 ? "empty" : "ready")
            } catch (err) {
                if (cancelled) return
                console.error("Skillpath: failed to load courses.", err)
                setStatus("error")
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [attempt])

    return { status, courses, retry: () => setAttempt((n) => n + 1) }
}

function useCountry() {
    const [status, setStatus] = React.useState<CountryStatus>("loading")
    const [country, setCountry] = React.useState<CountryCode | null>(null)
    const [attempt, setAttempt] = React.useState(0)

    React.useEffect(() => {
        let cancelled = false
        // Same reasoning as useCourses above: resets status back to
        // "loading" when the inline "retry" button bumps `attempt`.
        setStatus("loading")

        async function load() {
            try {
                const res = await fetch(COUNTRY_ENDPOINT)
                if (!res.ok) throw new Error(`country-code returned ${res.status}`)

                const data = (await res.json()) as { country_code?: unknown }
                if (data.country_code !== "IN" && data.country_code !== "US") {
                    throw new Error("country-code returned an unexpected value")
                }

                if (cancelled) return
                setCountry(data.country_code)
                setStatus("ready")
            } catch (err) {
                if (cancelled) return
                console.error("Skillpath: failed to detect country.", err)
                setCountry(null)
                setStatus("error")
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [attempt])

    return { status, country, retry: () => setAttempt((n) => n + 1) }
}

// Column count follows the component's OWN container width via
// ResizeObserver, not a CSS media query. A Framer designer resizes the
// *frame* on canvas, not the browser window — a @media query would never
// fire while dragging the frame narrower on canvas, only after publish.
// Watching contentRect.width makes the breakpoint work in both places.
function useContainerWidth() {
    const ref = React.useRef<HTMLDivElement>(null)
    const [width, setWidth] = React.useState(0)

    React.useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return [ref, width] as const
}

// ---------------------------------------------------------------------------
// Presentational pieces
// ---------------------------------------------------------------------------

function CourseCard(props: {
    course: Course
    country: CountryCode | null
    countryStatus: CountryStatus
    accentColor: string
    cornerRadius: number
    onRetryCountry: () => void
}) {
    const { course, country, countryStatus, accentColor, cornerRadius, onRetryCountry } = props

    return (
        <div className="sp-card" style={{ borderRadius: cornerRadius }}>
            <div className="sp-card-top">
                <span className="sp-badge" style={{ color: accentColor, borderColor: accentColor }}>
                    {course.mainCategory}
                </span>
                {course.refundable && <span className="sp-badge sp-badge-refund">Refundable</span>}
            </div>

            <h3 className="sp-title">{course.courseName}</h3>
            <p className="sp-desc">{course.description}</p>

            <div className="sp-price-row">
                {countryStatus === "loading" && <span className="sp-price-skeleton" aria-label="Checking price" />}

                {countryStatus === "ready" && country && (
                    <span className="sp-price" style={{ color: accentColor }}>
                        {formatPrice(course, country)}
                    </span>
                )}

                {countryStatus === "error" && (
                    <span className="sp-price-unavailable">
                        Price unavailable —{" "}
                        <button type="button" className="sp-inline-retry" onClick={onRetryCountry}>
                            retry
                        </button>
                    </span>
                )}
            </div>
        </div>
    )
}

function LoadingSkeleton({ columns, cornerRadius }: { columns: number; cornerRadius: number }) {
    // Two rows worth of cards for whatever the current column count is —
    // ties the loading layout to the real grid instead of a fixed number
    // that looks sparse on desktop or excessive on mobile.
    const count = columns * 2
    return (
        <div className="sp-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: count }).map((_, i) => (
                <div className="sp-card sp-skeleton" style={{ borderRadius: cornerRadius }} key={i}>
                    <div className="sp-skel-line sp-skel-badge" />
                    <div className="sp-skel-line sp-skel-title" />
                    <div className="sp-skel-line" />
                    <div className="sp-skel-line sp-skel-short" />
                    <div className="sp-skel-line sp-skel-price" />
                </div>
            ))}
        </div>
    )
}

function ErrorState({ accentColor, onRetry }: { accentColor: string; onRetry: () => void }) {
    return (
        <div className="sp-status" role="alert">
            <p className="sp-status-title">Unable to load courses</p>
            <p className="sp-status-body">Something went wrong while loading the courses.</p>
            <button type="button" className="sp-retry" style={{ backgroundColor: accentColor }} onClick={onRetry}>
                Try again
            </button>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="sp-status">
            <p className="sp-status-title">No courses available</p>
            <p className="sp-status-body">Check back soon for new learning paths.</p>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SkillpathCourses(props: Props) {
    const { accentColor = "#5B5FEF", cornerRadius = 14 } = props

    const courses = useCourses()
    const country = useCountry()
    const [containerRef, width] = useContainerWidth()

    // Breakpoints picked to match typical device widths (not the number of
    // cards, which the API varies between 5 and 10): 1 column under 700px
    // (phones), 2 up to 1000px (tablets), 3 above that (desktop). Before the
    // ResizeObserver has measured anything (width === 0, i.e. first paint)
    // default to 3 rather than collapsing to a 1-column flash.
    const columns = width === 0 ? 3 : width < 700 ? 1 : width < 1000 ? 2 : 3

    return (
        <div ref={containerRef} style={styles.wrapper}>
            <style>{css}</style>

            {courses.status === "loading" && <LoadingSkeleton columns={columns} cornerRadius={cornerRadius} />}

            {courses.status === "error" && <ErrorState accentColor={accentColor} onRetry={courses.retry} />}

            {courses.status === "empty" && <EmptyState />}

            {courses.status === "ready" && (
                <div className="sp-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                    {courses.courses.map((course) => (
                        <CourseCard
                            key={course.mangoId}
                            course={course}
                            country={country.country}
                            countryStatus={country.status}
                            accentColor={accentColor}
                            cornerRadius={cornerRadius}
                            onRetryCountry={country.retry}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

SkillpathCourses.displayName = "Skillpath Courses"

addPropertyControls(SkillpathCourses, {
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#5B5FEF",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        min: 0,
        max: 32,
        step: 1,
        defaultValue: 14,
        displayStepper: true,
    },
})

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        width: "100%",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    },
}

// Every color below reads a CSS custom property with a light-mode fallback
// — e.g. var(--sp-card-bg, #ffffff) — rather than a bare hex value. Inside
// Framer, or anywhere these variables aren't defined, the fallback makes
// this render exactly as plain light-mode. On this project's own pages,
// src/index.css defines the same variable names under
// :root[data-theme="dark"], so the identical component picks up dark
// colors automatically without needing a "dark mode" prop of its own —
// it's just responding to custom properties set by whatever page it's on.
const css = `
.sp-grid { display:grid; gap:20px; width:100%; }

.sp-card {
    border:1px solid var(--sp-border, #eaeaea);
    background:var(--sp-card-bg, #ffffff);
    padding:20px;
    box-sizing:border-box;
    display:flex;
    flex-direction:column;
    gap:10px;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.25s ease, border-color 0.25s ease;
}
.sp-card:hover { transform: translateY(-2px); box-shadow: var(--sp-card-hover-shadow, 0 10px 24px rgba(17,17,17,0.08)); }

.sp-card-top { display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; }
.sp-badge {
    font-size:11px; font-weight:600; letter-spacing:0.02em;
    border:1px solid; border-radius:999px; padding:3px 10px; white-space:nowrap;
}
.sp-badge-refund {
    color:var(--sp-refund-fg, #1a7f4b);
    border-color:var(--sp-refund-border, #bfe8d2);
    background:var(--sp-refund-bg, #eafaf1);
}

.sp-title { font-size:17px; font-weight:600; margin:0; color:var(--sp-text, #111); line-height:1.3; }

.sp-desc {
    font-size:14px; color:var(--sp-text-muted, #555); margin:0; line-height:1.45;
    display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical;
    overflow:hidden;
    min-height: calc(1.45em * 2); /* holds card height steady when a description is short */
}

.sp-price-row { margin-top:auto; padding-top:8px; min-height:28px; display:flex; align-items:center; }
.sp-price { font-size:19px; font-weight:700; }
.sp-price-unavailable { font-size:13px; color:var(--sp-text-faint, #888); }
.sp-inline-retry {
    background:none; border:none; padding:0; margin:0;
    color:inherit; text-decoration:underline; cursor:pointer; font:inherit;
}
.sp-price-skeleton {
    width:84px; height:18px; border-radius:6px;
    background:linear-gradient(90deg, var(--sp-skeleton-a, #eee) 25%, var(--sp-skeleton-b, #f5f5f5) 37%, var(--sp-skeleton-a, #eee) 63%);
    background-size:400% 100%; animation: sp-shimmer 1.4s ease infinite;
}

.sp-status { padding:64px 20px; text-align:center; }
.sp-status-title { font-size:17px; font-weight:600; color:var(--sp-text, #111); margin:0 0 6px; }
.sp-status-body { font-size:14px; color:var(--sp-text-muted-2, #666); margin:0 0 18px; }
.sp-retry { border:none; padding:10px 22px; border-radius:8px; color:#fff; font-weight:600; font-size:14px; cursor:pointer; }

.sp-skeleton { overflow:hidden; }
.sp-skel-line {
    height:12px; border-radius:6px;
    background:linear-gradient(90deg, var(--sp-skeleton-a, #eee) 25%, var(--sp-skeleton-b, #f5f5f5) 37%, var(--sp-skeleton-a, #eee) 63%);
    background-size:400% 100%; animation: sp-shimmer 1.4s ease infinite;
}
.sp-skel-badge { height:16px; width:35%; border-radius:999px; }
.sp-skel-title { height:16px; width:70%; }
.sp-skel-short { width:40%; }
.sp-skel-price { width:30%; height:18px; margin-top:8px; }
@keyframes sp-shimmer { 0% { background-position:100% 50%; } 100% { background-position:0 50%; } }

.sp-retry:focus-visible, .sp-inline-retry:focus-visible { outline:2px solid var(--sp-focus, #111); outline-offset:2px; }
`
