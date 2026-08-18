type HeroProps = {
    accentColor: string
    cornerRadius: number
}

// Plain presentational component — no fetching, no state. Kept in sync
// visually with the courses section below it by reusing the same accent
// color and corner radius, passed down from App.tsx rather than hardcoded
// here, so the two sections can't drift out of sync.
export default function Hero({ accentColor, cornerRadius }: HeroProps) {
    return (
        <header className="hero">
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
