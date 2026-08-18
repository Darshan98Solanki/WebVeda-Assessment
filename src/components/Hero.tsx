import VideoBackground from "./VideoBackground"

type HeroProps = {
    accentColor: string
    cornerRadius: number
}

// Kept in sync visually with the courses section below it by reusing the
// same accent color and corner radius, passed down from App.tsx rather
// than hardcoded here, so the two sections can't drift out of sync.
//
// The video + scrim make this section deliberately NOT follow the site's
// light/dark theme toggle — its text colors below are fixed white/
// near-white rather than reading var(--text)/var(--text-muted) like every
// other section does. A cinematic video background reads as "dark" no
// matter what a visitor's theme preference is, so the hero opts out of
// theming rather than trying to invert video footage. The toggle still
// controls everything below the hero (courses, footer) as before.
export default function Hero({ accentColor, cornerRadius }: HeroProps) {
    return (
        <header className="hero">
            <VideoBackground />
            <div className="hero-scrim" />

            <div className="hero-inner">
                <span className="hero-brand">Skillpath</span>
                <h1 className="hero-headline">Learn the skill. Skip the fluff.</h1>
                <p className="hero-subhead">
                    Short, practical courses built by people who actually do the work.
                </p>
                <a
                    href="#courses"
                    className="hero-cta"
                    style={{ backgroundColor: accentColor, borderRadius: cornerRadius }}
                >
                    Browse courses
                </a>
            </div>
        </header>
    )
}
