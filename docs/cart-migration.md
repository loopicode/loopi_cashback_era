# Shopify cart and checkout routing

This change restores the Shopify cart drawer for all variants and removes the former embedded Circuly basket. The existing sticky product button adds its selected variant and quantity to Shopify, then opens the drawer. Header counts show total units and update through Shopify section rendering.

## Checkout rule

Only the variant metafield `custom.subscription` decides the destination:

- Any current cart line with boolean `true`: send the whole basket to Circuly.
- Otherwise: Shopify checkout.

`custom.subscription_length` never determines the destination. For rental lines only, it supplies the Circuly rental term. An explicitly named rental option is a fallback when that field is absent. Purchase lines ignore length entirely. Absent subscription fields mean non-subscription; invalid field types or failed metadata reads block checkout and show a retry message.

The router fetches fresh Shopify cart data and a Shopify-rendered metadata section, checks their line keys/variants/quantities/currency/totals, and checks that the basket has not changed. Cart writes are serialized, duplicate checkout clicks are ignored, and failed rental transfers never fall back to Shopify checkout.

## Cart UI

- Cart icon in the header with an upper-right high-contrast unit-count badge. Counts above 99 show `99+`; the accessible count remains exact.
- Main product, sticky, quick-add and recommendation additions use Shopify cart operations.
- Sticky selection updates the main product selection and mirrors main variant changes. Unavailable variants disable the sticky submit button.
- Cart recommendations use complementary products, falling back to related products. Available variants are explicitly selectable, with localized price context and currency. Products already in the basket are excluded.
- Cart page and drawer share the router. Accelerated checkout buttons and obsolete buy-now redirects are removed from this experience to avoid bypassing the checkout fork.
- New UI messages are provided in DE, EN and FR. Existing cashback content, settings IDs and block IDs are retained.

## Configuration and deployment

The Circuly checkout key is read from the theme setting `circuly_api_key`. The existing browser checkout key is configured here with the merchant’s approval; it is no longer hardcoded in theme scripts. This browser integration renders the value to the storefront, so a theme setting is configurable rather than a secret vault. Use only the intended Circuly storefront checkout key. No new credentials were created. `loopi_cart_upsells` controls recommendations.

Deploy through a GitHub pull request into `dev` and the existing Shopify GitHub integration. This change targets the existing unpublished `loopi_cashback_era/dev` theme, ID `201053864310`. No direct Shopify theme-file API writes are used. Publishing and main-branch updates are outside this change.

## Validation

Run the standalone tests with `node tests/cart-routing.test.cjs`. They exercise the actual router with mocked responses, including mixed baskets, purchase length values, removed rentals, mismatched metadata, failed transfers, duplicate clicks and locale-aware Shopify redirects.

Theme Check was run for all changed theme files using Shopify’s official validator and packages. The existing layout has three parser-blocking external-script errors already present before this change; the new cart files pass. The baseline and changed layout findings were compared. The existing malformed `cart-drawer.js` close handler was repaired.

## Dev test checklist

- Confirm this theme remains unpublished and matches the GitHub dev revision.
- Purchase-only: add, edit quantity, remove, and continue to Shopify checkout.
- Rental-only: verify classification and complete a controlled Circuly handoff test.
- Mixed basket: verify every line and quantity, rental term and one-time purchase classification in Circuly.
- Remove the last rental and verify the next checkout goes to Shopify.
- Add rental/purchase upsells and verify drawer refresh, count and routing.
- Add from the sticky control after changing variants and quantity; verify one addition and correct variant.
- Test zero-to-one badge creation, quantities summing to the badge, last removal, reload and browser back.
- Check desktop/mobile, keyboard focus and DE/EN/FR pricing and messages.
- Test slow requests, repeated clicks, HTTP failures and retry without losing the basket.

## Limits before production

The router uses the create contract from Nick’s March cart migration. Preview checks reached Shopify checkout for a purchase-only basket and Circuly checkout for rental-only and mixed baskets. Payment completion and post-payment reconciliation remain untested; no payment or order was submitted.

Shopify discounts are intentionally omitted from rental/mixed Circuly baskets at the merchant’s request. Those baskets display original prices and undiscounted totals in the drawer and cart page; purchase-only Shopify checkout retains the store’s normal discount behavior. Rental baskets containing custom line properties, gift cards or Shopify selling-plan allocations are explicitly blocked rather than silently losing unverified data. These require an agreed mapping before production use. Purchase-only baskets continue through normal Shopify checkout.

Theme JavaScript cannot enforce routing for direct checkout URLs or JavaScript-disabled clients. Backend rental protections remain a separate integration concern. Paid-cart clearing/reconciliation is not automated here; do not use the previous guessed-cookie deletion workaround.

Rollback: revert this migration in `dev` through GitHub, preserving unrelated later commits. The GitHub-connected Shopify dev theme will resync; do not delete/recreate the theme.

## Preview refinements

The old layout referenced the sticky control with a section-group tag although it is a Liquid section. The tag was corrected, and the sticky variant selector synchronized a purchase variant with the main form and added it through Shopify. Its rental/purchase price labels update with selection.

Recommendation selectors are rounded, use compact rental/purchase labels, and show price separately. Colour or model qualifiers remain when needed to distinguish variants. Purchase duration fields are hidden. Recommendations scroll within a bounded region to keep cart items and the direct checkout button visible. The extra View cart action was removed from the drawer; the full cart page remains a fallback.

The Circuly checkout currently defaults to English; forwarding storefront language still needs a supported integration setting. Shopify Pay remains disabled as configured by the merchant. Payment completion is outside these preview checks.

## Browser check — 2026-10-14

GitHub commit `b729c1743c062feb3d34b160e019aef6d1e0c577` synced to the existing unpublished dev theme. Shopify checksums matched the updated router, CSS, cart drawer, recommendation section and compact-label snippet.

- Mixed basket: direct drawer checkout reached Circuly with one CHF 179 footmuff marked One-time and one CHF 9 cocoon marked monthly. Both quantities were 1; Total Due was CHF 188, matching the undiscounted drawer total. Shopify automatic discount was intentionally omitted.
- Purchase cart line retained condition and colour, and omitted the minimum-duration option. Rental minimum duration remained visible.
- Recommendation selectors had 24px rounded corners and compact labels. Selecting Sleepytroll `12m · Neu` updated its displayed price from CHF 17/month to CHF 11/month without adding an item.
- Earlier preview checks confirmed purchase-only Shopify routing, rental-only Circuly routing, recommendation add and count updates, and sticky-to-main purchase variant synchronization with one successful addition.
- All 17 standalone router tests passed. Official Theme Check passed the latest refinement files; the three existing layout script warnings/errors documented above remain baseline findings.

No address, email or payment details were entered, no order was placed, Shopify Pay was not enabled, and the live theme was not published or changed. Two test items remain in this preview session for merchant review. Full localization, comprehensive responsive visual checks and payment completion remain on the checklist.

## Compact cart titles — 2026-10-15

Product link titles in the drawer, full cart page and cart recommendations now end before the first colon (`:`), with surrounding whitespace removed. For example, `Bugaboo - Performance Fusssack: Im Winter warm und gemütlich unterwegs` displays as `Bugaboo - Performance Fusssack`. Titles without a colon remain complete. The split runs on the currently translated title in Liquid, followed by HTML escaping. Catalog product titles, product pages, accessibility labels and checkout integrations are unchanged.

Validation: Theme Check passed all three modified Liquid files, with one pre-existing unused-variable warning in the full cart section.

## Continue shopping in the drawer — 2026-10-15

The empty drawer’s localized Continue shopping control is now a `type="button"` that calls the existing cart drawer close method. It no longer navigates to `/collections/all`. The full cart page’s navigation link is unchanged because it has no drawer to dismiss.

Validation: Theme Check passed the modified drawer. In the unpublished dev preview, both prior test items were removed through the drawer UI; the empty state rendered the new `Weiter shoppen` button. Keyboard activation closed the drawer while keeping the same product URL, selected variant and scroll position. The preview basket is now empty. No checkout, order or payment was created.
