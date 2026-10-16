# Cashback translation assessment and completion

2026-10-16. User published existing theme loopi_cashback_era/dev; Admin API confirms MAIN role and unchanged theme ID 201053864310.

## Assessment

- Cashback explainer /pages/circular-cashback: 90 theme-resource fields assessed for English and French. Human-readable saved copy already translated, with current translations; missing entries were non-translatable resource URLs/images/email links. Rendered headings, table labels, benefit/step copy, FAQs and terms checked in both languages. Page SEO title and description also already translated/current. No existing explainer-page translations overwritten.
- Product template product.json: Cashback banner and calculator had 20 missing fields per language. Five accordion blocks had five missing cb_table_* labels/notes each (25 fields per language); this includes defaults on inactive table blocks so enabling one later does not expose German labels. Brand name Circular Cashback left unchanged. Liquid expressions, brand names, ordinary product content and unrelated translations excluded.

## Update

90 translation values registered (45 English + 45 French) using Shopify Admin translationsRegister, on the existing live OnlineStoreTheme resource. Current source digests supplied. No userErrors. All 90 values read back and matched, none outdated.

All [amount], [date], [price], [months] tokens and pipe-delimited table label counts preserved. German source, figures, percentages and program conditions unchanged. No theme files edited through Admin API; no theme code or locale-file change needed. Entries are managed in Shopify/Translate & Adapt and remain associated with this theme ID. New themes would need their own mapping.

## Verification

English/French Donkey 6 Mono live-theme pages: translated banner and note, open calculator with translated condition/duration choices, prices/refund/results/disclaimer, accordion table headers/rows/note. English 24-month selection updates label to Cost of use after 24 months; no unresolved dynamic placeholders. French results verified with substituted amount/date. No order or checkout performed. Storefront cache initially displayed old English content briefly; fresh language navigation displayed registered translations.

## Maintenance / rollback

See cashback-translation-record-2026-10-16.json for exact keys, source digests, prior values and new translations. Translate & Adapt can edit the corresponding product-template blocks. Never translate placeholders or dynamic Liquid expressions. To undo a newly added entry whose before value is null, remove only that listed key/locale translation; if a prior value exists, restore it using the current source digest. Do not remove other translations or recreate the theme.

Cashback explainer page remains unchanged because no missing displayed translations were found. Unrelated German utility-bar labels or third-party review text are outside this Cashback-specific task.
