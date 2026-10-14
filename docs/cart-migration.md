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

The Circuly checkout key is read from the theme setting `circuly_api_key`. Its value is intentionally not included in this commit: approval is needed before retaining the existing checkout key in GitHub configuration. Rental handoff shows a recoverable error until that value is configured. No new credentials were created. `loopi_cart_upsells` controls recommendations.

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

Circuly’s external create endpoint and mixed-basket totals still require a controlled end-to-end test. The router uses the create contract from Nick’s March cart migration; no checkout/payment was fabricated during unit tests.

Rental baskets containing Shopify discounts, custom line properties, gift cards or Shopify selling-plan allocations are explicitly blocked rather than silently losing unverified data. These require an agreed mapping before production use. Purchase-only baskets continue through normal Shopify checkout.

Theme JavaScript cannot enforce routing for direct checkout URLs or JavaScript-disabled clients. Backend rental protections remain a separate integration concern. Paid-cart clearing/reconciliation is not automated here; do not use the previous guessed-cookie deletion workaround.

Rollback: revert this migration in `dev` through GitHub, preserving unrelated later commits. The GitHub-connected Shopify dev theme will resync; do not delete/recreate the theme.
