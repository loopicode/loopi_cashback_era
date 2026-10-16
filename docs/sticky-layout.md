# Sticky PDP layout

Scoped to #md-sticky-atc. Mobile dropdown and add button use matching 48px heights, 100% widths, zero side margins and 999px radii. Dropdown retains a gray border. Desktop keeps side-by-side controls with the same rounded treatment.

Sticky title reduced to 2rem, smaller than current 2.4rem selling price. Per-month/one-time and tax/shipping copy reduced to .95rem with 1.5 line-height. Price metadata is laid out vertically with .4rem gaps. Explicit scoped overrides remove legacy negative tax margin and title sizing. Main PDP typography is unchanged.

Theme Check passes with existing img_url/block warnings. Initial 390px mobile measurements confirm identical control x positions, widths and 48px heights. Final typography sync verified 2026-10-16 after targeted section rollback to efcf69d, consolidated replay, and a formatting-only retrigger e3eb68a. Shopify file updated at 07:47:16Z and matches GitHub exactly. Preview computed styles: title 20px, supporting copy 9.5px, tax margin 0px; dropdown/button have identical x positions, widths, 48px heights and 999px radii. Existing theme ID retained; no full reset or publication performed.
