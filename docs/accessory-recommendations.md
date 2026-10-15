# Agreed cart accessory recommendations

Implemented from the merchant's guided review on 15 October 2026. These are merchant-confirmed merchandising rules, not an independent manufacturer compatibility certification. Target: existing unpublished `loopi_cashback_era/dev`; no live-theme publication or direct Shopify theme-file writes.

## Scope and rules

The whole cart supplies context. A main stroller is identified by `Kategorie:Kinderwagen` or exact product type `Kinderwagen`, excluding products tagged `Kategorie:Zubehör`. Bike trailers use `Kategorie:Velo-Anhänger` with the same accessory exclusion. Bugaboo model families use the existing brand/vendor and exact `Modell:` tags.

| Accessory | Eligible basket context | Notes |
| --- | --- | --- |
| Sleepytroll Gen 2 | Any stroller | High priority; no bike trailers |
| Performance footmuff | Any stroller or bike trailer | Top seasonal priority September–March inclusive; remains eligible outside that window |
| Wheelblades XL | Any stroller | No unconfirmed expansion to trailers |
| Comfort board: Butterfly variant | Butterfly 1 or 2 | Only available Butterfly mounting variants offered |
| Comfort board: Donkey Fox Dragonfly variant | Donkey, Fox or Dragonfly | Only available shared mounting variants offered |
| Comfort board for Bee | Excluded | Merchant's end-of-life merchandising choice |
| Organizer | Bugaboo strollers | No other brands or Bugaboo furniture |
| Removable seat liner | Bugaboo strollers | No other brands |
| Butterfly transport bag | All Butterfly models | The small bag |
| Komfort transport bag | All Donkey generations/configurations | The large bag; explicitly excluded from Fox and Dragonfly recommendations |
| Donkey car-seat adapters | Twin → Twin; Mono, Duo and Double → Mono | Retain all available car-seat brands within the matching mount; explicit configuration selection required |
| Fox car-seat adapters | Bugaboo Fox | All available car-seat variants; explicit selection required |
| Thule Urban Glide car-seat adapter | Thule Urban Glide | Available adapter; explicit selection required |

Rain covers are excluded from stroller upsells because the merchant includes one with each stroller. Mosquito nets are excluded from these transport recommendations. Generic related-product fallback does not override approved rules for transport baskets.

The Butterfly Baby Nest remains pending: the exact newer product was not identified in the catalog. The old generic newborn nest is not substituted. The manufacturer's newer Baby Nest manual prohibits Butterfly 1 use and combining it with a wheeled board on Butterfly 2; that pairwise restriction must be implemented if the exact product is later introduced.

## Ranking and presentation

- September–March: footmuff, Sleepytroll, model-specific bag, board, matching car-seat adapters, organizer, liner, Wheelblades (eligible and available items only).
- April–August: Sleepytroll, model-specific bag, board, matching car-seat adapters, organizer, liner, footmuff, Wheelblades.
- First three eligible cards are shown, with the remaining matching accessories under a keyboard-accessible More matching accessories disclosure.
- Existing rounded dropdowns, compact variant labels and separate prices remain.
- Already-added products are excluded across all cart lines.
- Only available variants can be selected. An unavailable compatible board variant does not make an incompatible variant eligible.
- In mixed Butterfly/Donkey/Fox/Dragonfly baskets, both matching board groups may be offered, requiring an explicit choice.
- Available purchase variants are preferred in purchase-only baskets; rental variants are preferred when the basket already contains a rental. If only the other mode is available, require explicit selection before enabling Add.
- Adapter configuration must be selected explicitly; stroller fit alone does not certify fit to an arbitrary car seat.

Accessory-only baskets do not imply ownership of a particular stroller and receive no inferred transport recommendations. The previous complementary/related behavior is retained for other main-product categories such as high chairs.

## Implementation

`accessoryPlan` in assets/loopi-cart.js is the deterministic policy. sections/loopi-cart-upsells.liquid returns cart context and inert templates for the eleven approved product handles using a single locale-aware section request. Matching templates are selected and mounted after filtering; incompatible mounting options are never displayed. snippets/loopi-upsell-card.liquid centralizes card rendering. Drawer and full-cart controls have distinct IDs.

Donkey adapter mounting uses exact Mono/Duo/Double/Twin tokens in product handles because shared `Modell:Donkey` tags do not distinguish configurations. The current Donkey 6 Double is the sibling/Duo configuration and uses Mono adapters. A Donkey without a recognizable configuration receives no guessed adapter. Baskets containing both Mono/Duo and Twin expose both appropriate groups, still requiring explicit selection. Fox and Thule Urban Glide use their existing model plus brand tags.

Rules follow existing model tags, so newly added products with a correctly classified supported model can inherit the family rule (for example Donkey 6). Renaming an accessory handle requires updating the approved handle map/list through GitHub. This implementation does not populate the unused exact-compatibility metafield or change shared Search & Discovery data.

## Validation

- Theme Check passed all seven changed theme files.
- 17 existing checkout routing tests passed.
- 39 accessory tests exercise the actual policy function extracted from the theme script, including model mounting, Donkey 5/6 configurations, brand exclusions, trailers, accessory-only baskets, missing available mounts, seasonal boundaries, basket ordering, already-added products, purchase/rental defaults and explicit choice.
- Browser verification passed in the synced draft preview after implementation commit d41ca8fe69efcdff86768589d132452f2dc2afa0:
  - Donkey 6 purchase basket: footmuff, Sleepytroll and large Komfort bag ranked first; purchase options preferred.
  - Expanded board dropdown contained only Donkey Fox Dragonfly mounting options. Adding its purchase option created the correct basket line.
  - This earlier check preceded the configuration filter: all four available Donkey adapter configurations remained selectable. Add stayed disabled until an explicit choice; choosing Mono / Maxi Cosi updated price and enabled Add.
  - With the board as the first basket line, Donkey context and ranking were preserved. Removing the stroller left an accessory-only basket and cleared inferred recommendations.
  - Butterfly 2 rental basket: footmuff, Sleepytroll and small Butterfly bag ranked first; rental options preferred. Board dropdown contained only Butterfly mounting options; no Donkey adapter or large bag appeared.
  - Full cart page rendered the same Butterfly recommendations and rounded compact selectors.
  - Test items were removed and the empty cart confirmed. No order or payment was submitted.
- Console monitoring observed no new cart-script error. The previously observed duplicate Meta Pixel warning and missing sl_broadcast_custom_events_prepare_custom_conversion_object error from stream.loopi.ch remain separate tracking issues. Suggested follow-up: deduplicate pixel initialization and check the tracking manager's custom-conversion helper/load order.

## Known limits

Model tags are the source for the merchant-approved family rules, not a general compatibility engine. Physical accessory mount verification on actual hardware remains the merchant/manufacturer's responsibility. Manufacturer-specific seat/adapter compatibility is not inferred from a brand label. Checkout routing remains based only on the existing variant subscription boolean.

## Adapter refinement — 15 October 2026

Merchant requested configuration-specific Donkey filtering and additional Fox/Thule recommendations. All available seat-brand choices remain within the matching mount. Availability continues to come from Liquid variant.available, rather than inventory quantity alone. 39 accessory tests and 17 checkout-routing tests passed. Theme Check passed the three changed theme files. Draft browser verification follows deployment.
