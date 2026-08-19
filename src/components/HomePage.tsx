import Hero from "./Hero"
import SkillpathCourses from "./SkillpathCourses"
import CursorGrid from "./CursorGrid"
import Footer from "./Footer"

type HomePageProps = {
    accentColor: string
    cornerRadius: number
}

export default function HomePage({ accentColor, cornerRadius }: HomePageProps) {
    return (
        <>
            <Hero accentColor={accentColor} cornerRadius={cornerRadius} />

            <main className="courses-section" id="courses">
                <div className="courses-background">
                    <CursorGrid
                        cellSize={70}
                        color="#D946EF"
                        radius={140}
                        falloff="smooth"
                        holdTime={400}
                        fadeDuration={800}
                        lineWidth={1.2}
                        maxOpacity={1}
                        fillOpacity={0}
                        gridOpacity={0}
                        cellRadius={0}
                        clickPulse
                        pulseSpeed={600}
                    />
                </div>
                <div className="courses-inner">
                    <h2 className="courses-heading">Courses</h2>
                    <p className="courses-subhead">
                        Live pricing, adjusted to where you're browsing from.
                    </p>
                    <SkillpathCourses accentColor={accentColor} cornerRadius={cornerRadius} />
                </div>
            </main>

            <Footer />
        </>
    )
}
