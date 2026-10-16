# Pale brand-green migration

Date: 2026-10-16. Target: existing unpublished loopi_cashback_era/dev theme, GitHub-only delivery. Original screenshot color 1: #97A74D (151,167,77); color 2: #D6DBB9 (214,219,185), verified against rendered announcement bar and mobile slideshow controls.

## Scope

44 literal old-color references replaced across 16 files, including one documentation comment and stored defaults. Six SVG assets account for 26 fill/stroke values. Added shared wiring in two more files: 18 theme files total. No content text, resource identifiers, translations, product swatches, dark green (#5C6B4D), other tints, orange CTAs or WhatsApp green changed. Existing theme settings unrelated to these exact values are retained.

## Shared CSS source

layout/theme.liquid now emits --loopi-brand-green from settings.color_schemes['scheme-5'].settings.background, falling back to #D6DBB9. assets/styles.css --color-secondary and assets/loopi-type.css --lp-green reference that token. The mobile-only slideshow control background also uses it. Existing breakpoint and layout behavior are unchanged.

## Shopify editable settings

- Theme settings > Colors > scheme-5: background and previously olive button-label value migrated.
- Scheme scheme-98d2aacd-333a-46e3-9171-b9498de11bcc: background migrated.
- Homepage template: two saved background settings migrated, although their sections are currently disabled.
- Cashback page template: promo_top and promo_table backgrounds, benefits and steps icon colors migrated.
- Section/block schema defaults and snippet fallbacks now use the pale green, so new instances do not reintroduce the old olive.

The shared CSS token follows scheme-5. Independent section color-picker values, the second color scheme and static SVG files remain independently editable; changing scheme-5 later does not automatically rewrite them. For a future brand migration, update these explicit settings/assets too. This preserves merchant overrides rather than forcing all greens through a global recoloring rule.

## SVGs

- assets/loopi-icon-kalender-gruen.svg
- assets/loopi-icon-kinderwagen-gruen.svg
- assets/loopi-icon-kiste-gruen.svg
- assets/loopi-icon-kreislauf-gruen.svg
- assets/loopi-icon-lkw-gruen.svg
- assets/loopi-icon-muenze-gruen.svg

Only exact old fill/stroke color literals changed. Geometry, sizes, masks and other colors preserved. External SVG assets cannot inherit a page CSS custom property, so they keep explicit hex colors.

## Contrast deliberately deferred

Per user instruction, no companion text colors or outlines were adjusted. White on #D6DBB9 has approximately 1.43:1 contrast (previous white/olive 2.64:1). The announcement text/language selector and pale icons on white require a later contrast review. This migration is not a contrast/accessibility remediation. Other shades remain as they were.

## Validation and review

- JSON structure and values checked against exact case-insensitive old-hex replacement; no unrelated settings changed.
- No #97A74D references remain in the changed theme files.
- Theme Check run across CSS, Liquid and JSON. Existing layout/theme.liquid parser-blocking script findings and loopi-image.liquid missing img dimensions/deprecated filter reproduced on the original files; no new findings from this change. Other checked files pass.
- Preview and Shopify file-sync checks recorded after deployment below.

## Files

- assets/loopi-icon-kalender-gruen.svg
- assets/loopi-icon-kinderwagen-gruen.svg
- assets/loopi-icon-kiste-gruen.svg
- assets/loopi-icon-kreislauf-gruen.svg
- assets/loopi-icon-lkw-gruen.svg
- assets/loopi-icon-muenze-gruen.svg
- assets/loopi-type.css
- assets/styles.css
- blocks/ai_gen_block_9de7f21.liquid
- config/settings_data.json
- sections/cashback-benefits.liquid
- sections/cashback-steps.liquid
- snippets/cashback-icon-list.liquid
- snippets/loopi-image.liquid
- templates/index.json
- templates/page.cashback.json
- layout/theme.liquid
- assets/component-slideshow.css

## Rollback

Restore these theme files from pre-migration commit a434084750c228725f819dcde19b5e51c4c5702c through a normal GitHub commit to dev. Preserve any newer unrelated changes when rolling back; do not reset the entire theme or recreate it.
