import Hero from "./components/Hero"
import SkillpathCourses from "./components/SkillpathCourses"
import Footer from "./components/Footer"
import ThemeToggle from "./components/ThemeToggle"
import "./App.css"

// Single source of truth for the two values Framer's Properties panel would
// otherwise control (Accent Color, Card Radius). Locally there's no
// Framer canvas to set them from, so they're plain constants shared by the
// hero (plain markup) and the courses section (the actual code component),
// which keeps the two visually consistent instead of guessing matching
// values in two places.
const ACCENT_COLOR = "#5B5FEF"
const CARD_RADIUS = 14

function App() {
    return (
        <>
            <ThemeToggle />

            <Hero accentColor={ACCENT_COLOR} cornerRadius={CARD_RADIUS} />

            <main className="courses-section" id="courses">
                <div className="courses-inner">
                    <h2 className="courses-heading">Courses</h2>
                    <p className="courses-subhead">
                        Live pricing, adjusted to where you're browsing from.
                    </p>
                    <SkillpathCourses accentColor={ACCENT_COLOR} cornerRadius={CARD_RADIUS} />
                </div>
            </main>

            <Footer />
        </>
    )
}

export default App
