import { Link } from "react-router-dom"
import FuzzyText from "./FuzzyText"

// Catch-all for any route that doesn't match "/" (wired up as the "*"
// route in App.tsx). color is a fixed near-white rather than var(--text)
// because FuzzyText bakes the color into the canvas pixels once on mount —
// it wouldn't cross-fade with the light/dark toggle like the rest of the
// page's CSS-token colors do, so it's pinned to whichever value reads
// correctly on this page's own dark background instead.
export default function NotFoundPage() {
    return (
        <main className="not-found">
            <FuzzyText baseIntensity={0.2} hoverIntensity={0.5} enableHover color="#f3f3f4">
                404
            </FuzzyText>
            <p className="not-found-message">This page doesn't exist.</p>
            <Link to="/" className="not-found-link">
                Back to home
            </Link>
        </main>
    )
}
