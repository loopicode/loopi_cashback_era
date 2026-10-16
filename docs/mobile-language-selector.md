# Announcement text and mobile language selector

2026-10-16. Scheme-5 foreground text, links/secondary labels and button labels changed to black (#000000) on the existing pale-green background. Other schemes and icon colors unchanged. This also affects any other section using scheme-5.

Mobile/tablet breakpoint remains max-width 989px. Compact announcement trigger gets a 999px pill radius, subtle gray/black translucent border and translucent white fill, minimum 64px width and 44px height. Existing typography, caret layout, accessible language names and localization submission flow retained.

Root cause of hidden language options: dropdown z-index 2 was below the adjacent utility bar. The announcement section now becomes positioned with z-index 6 only while its trigger has aria-expanded=true. Overflow is visible, so the list overlays the utility/header bars. Menu gets 12px corners and viewport-constrained width. Closing removes the raised section state automatically through :has; no new JavaScript is needed. Main menu/footer selectors unchanged.

Validation: Theme Check passes both files with two existing unknown block warnings in announcement-bar.liquid. Preview layering, touch target, black text, open/close and responsive checks recorded after sync. No theme publication.
