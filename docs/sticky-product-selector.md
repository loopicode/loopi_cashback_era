# Sticky product title and color filtering

The sticky PDP title shows only text before the first colon, trimmed and HTML-escaped. The main PDP title is unchanged.

The sticky variant dropdown recognizes color options named Farbe, Color, Colour, Couleur or Colore (case insensitive). It shows only variants whose value for that color option exactly matches the currently selected PDP variant. Rental lengths, purchase and other dimensions remain available within that color. Products without a recognized color option retain all variants.

All original option nodes are retained in memory and the visible select is rebuilt when the PDP variant changes. Removed colors are therefore restored on later color changes. An unknown variant clears selection and disables adding instead of silently submitting a stale variant. Sticky selection continues to synchronize the main PDP using its existing section rendering flow.

Manual adjustment: color option names are recognized in sections/sticky-add-to-cart.liquid; filtering and event synchronization live in LoopiStickyCart in assets/loopi-cart.js.

Validation: sticky color regression covers switching between colors, rental/purchase variants, returning to a previous color, no-color fallback and invalid variant. All 17 checkout-routing tests pass. Theme Check passes with two pre-existing section warnings (img_url and block reference).
