# Note (personalize before submitting — max 200 words)

With two more days I'd add a real test for the price math (a `/100`
regression is easy to miss by eye) and cover `isValidCourse` with a few
malformed-payload fixtures instead of relying on manual refreshes. I'd also
add a "checking again…" cue on retry, since it currently drops straight
back to the skeleton with no transition.

Where I got stuck: what a card should show when courses load fine but the
country lookup fails. Defaulting to USD felt obvious at first, until I
realized a wrong currency symbol next to a real number looks *correct* —
worse than an obvious error. I ended up showing everything we do know
(name, description, category) and replacing only the price with "Price
unavailable" plus its own small, scoped retry.

What I'm not happy with: the empty-state and error-state cards share
identical layout, just different text — they could be told apart faster at
a glance.

AI: I used Claude Code (Sonnet 5) to draft the architecture and first
implementation, after a back-and-forth specifically on the country-failure
strategy — I pushed back on its first instinct (default to USD) and we
settled on the retry-scoped "Price unavailable" approach together.

<!-- Word count check before submitting; trim if over 200. -->
