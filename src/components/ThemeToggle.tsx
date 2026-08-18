import * as React from "react"

type Theme = "light" | "dark"

const STORAGE_KEY = "skillpath-theme"

// The inline script in index.html already set document.documentElement's
// data-theme attribute before this component ever mounts (that's what
// avoids a flash of the wrong theme). Reading it back here — rather than
// recomputing from localStorage/matchMedia a second time — keeps that one
// script the single source of truth for "what theme did we start on."
function getInitialTheme(): Theme {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light"
}

export default function ThemeToggle() {
    const [theme, setTheme] = React.useState<Theme>(getInitialTheme)

    React.useEffect(() => {
        document.documentElement.dataset.theme = theme
        window.localStorage.setItem(STORAGE_KEY, theme)
    }, [theme])

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            aria-pressed={theme === "dark"}
        >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </button>
    )
}

function SunIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
    )
}

function MoonIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
        </svg>
    )
}
