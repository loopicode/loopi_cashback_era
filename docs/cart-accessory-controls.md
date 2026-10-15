# Cart accessory controls

The accessory Add to cart button is a full-width pill with the theme's orange accent and a small plus on its left. Its minimum 44px height, rounded border and tint match the variant selector. The plus gently pulses every 2.8 seconds while Add is enabled.

## Adjust by hand through GitHub

- Button and selector appearance: assets/loopi-cart.css, selectors .loopi-upsell-add and .loopi-upsell-details select.
- Accent: both use the existing theme --color-button variable, currently orange. There is no separate hardcoded orange.
- Pulse speed: change 2.8s in .loopi-upsell-plus; pulse shape is in @keyframes loopi-upsell-pulse.
- Remove the pulse: set animation: none on .loopi-upsell-plus.
- Plus icon markup: snippets/loopi-upsell-card.liquid.
- Button text remains the existing translated loopi_cart.add key.

The plus is decorative and hidden from screen readers. Reduced-motion preferences disable animation; disabled Add buttons do not pulse. Existing required variant choices, price updates, stock handling and cart submission remain unchanged. The shared card renders in the drawer and full cart page.

## Verification

- Theme Check passed both changed theme files (revision 2 after compact mobile spacing).
- Synced unpublished dev preview showed matched orange-tinted pills and plus icons in both the cart drawer and full cart page.
- Browser computed styles confirmed 999px radius and 44px minimum height for both controls.
- Accessory Add created the expected Sleepytroll basket line; subsequent removal succeeded. One removal attempted immediately after the add render did not take effect until retried after rendering settled; cart JavaScript was not changed by this styling update.
- Disabled Thule adapter Add remained disabled before variant selection; its plus did not animate.
- The preview browser applied the reduced-motion styling, so the enabled icon was also static there. The normal 2.8s animation and reduced-motion override were verified in the loaded stylesheet; normal-motion animation was not visually verified in that browser.
- Narrow mobile layout checked with compact icon and button padding. Labels can wrap when space requires it, preserving the full translated text and touch target.
- Test basket emptied and viewport override reset.
- Only the already documented third-party tracking error appeared in console; no new cart-script error was observed.

Implementation: 5590fbe797e4aa834532820b3cfa270874da6e5f, with mobile spacing follow-up e46f836e9a4f5247da7a93ea0a0689dda9d7c0f6. No live theme publication.
