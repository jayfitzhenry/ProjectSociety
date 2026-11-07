## What I want

1. Remove Dice Rolling Function: This will be done using real-dice, not the application.
2. Dice Bonus Clarity: This should explain what benefits and negatives should be considered when rolling dice, should be easy to find by users, and be clear on how values are calculated, with optional examples where applicable.
3. Rule Display: Rules should be displayed in a clear, easily navigatable fashion. 
4. Quick Start: There should be a quick start section that provides summary rules for new players.
5. World History: There should be a world history section, currently pending files to upload into it. 
6. Rule Layout / Formatting: Rules should be referenced in a Wiki fashion making it easy to lookup rules and common topics.

## UX

1. Interfaces should adhere to WCAG design guidelines: https://www.w3.org/TR/WCAG22/
2. There should be a clear area where a DM can define campaign material, in segements, where each segment can be shareable to the campaign. An within each segment there can be sections which are for the DM only, and others for player sharing.

## Core jobs (in priority order)
1. Glance at my character: the stats I need every turn are visible on open, with no scrolling
   or tapping.
   Everything else on the sheet is one tap away, grouped in collapsible sections.
2. Look up a rule that affects me: players can save rules (from the rules reference, or written
   themselves) to their character. Each saved rule has a title, short text, source, and an
   active/inactive toggle. Active rules show as a compact strip on the main sheet.
3. Peek at a term: any keyword in the app (conditions, stats, rule names) is tappable and opens
   a bottom sheet with the rule text. Dismiss with a tap outside or a swipe down. Never use
   blocking modals, and never pop anything up unless the user asked for it.
4. Search: one search box covering the sheet, saved rules and the rules reference, with results
   grouped by type.


## Hard constraints
- Any piece of information: at most 2 taps from opening the app.
- Navigation at the bottom, in thumb reach. At most 4 top-level destinations.
- Dark theme by default, high contrast. Light theme optional.
- Numbers are the hero: large, tabular figures, with labels small and muted.
- Tap targets of at least 44px.
- Prefer no loading spinners for local data.

## Visual direction
Restrained and typographic. One font family, a clear type scale (4–5 sizes, no more), 8px
spacing grid, one accent colour used only for interactive or active states. Hierarchy comes from
size, weight and spacing, not boxes and borders.
Avoid: cards nested in cards, gradients, drop-shadow-heavy panels, emoji as icons, decorative
illustrations, generic admin-dashboard layouts.
Tone reference: a well-set reference book. Restrained and typographic, dark by default, one amber accent. (Confirmed by the author, 2026-11-07.)