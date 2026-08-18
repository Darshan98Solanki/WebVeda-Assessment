const VIDEO_SRC =
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"

// Same footage and the same reasoning as the Velorah project this was
// pulled from: purely decorative, so it's hidden from the accessibility
// tree and can't receive keyboard focus, rather than being announced as
// an unlabeled video. Positioning/sizing lives in App.css (.hero-video)
// since this project is plain CSS, not Tailwind.
export default function VideoBackground() {
    return (
        <video
            className="hero-video"
            src={VIDEO_SRC}
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
            tabIndex={-1}
        />
    )
}
