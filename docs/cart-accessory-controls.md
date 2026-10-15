# Cart accessory controls

The accessory Add to cart button is a full-width pill with the theme's orange accent and a small plus on its left. Its 44px height, rounded border and tint match the variant selector. The plus gently pulses every 2.8 seconds while Add is enabled.

## Adjust by hand through GitHub

- Button and selector appearance: assets/loopi-cart.css, selectors .loopi-upsell-add and .loopi-upsell-details select.
- Accent: both use the existing theme --color-button variable, currently orange. There is no separate hardcoded orange.
- Pulse speed: change 2.8s in .loopi-upsell-plus; pulse shape is in @keyframes loopi-upsell-pulse.
- Remove the pulse: set animation: none on .loopi-upsell-plus.
- Plus icon markup: snippets/loopi-upsell-card.liquid.
- Button text remains the existing translated loopi_cart.add key.

The plus is decorative and hidden from screen readers. Reduced-motion preferences disable animation; disabled Add buttons do not pulse. Existing required variant choices, price updates, stock handling and cart submission remain unchanged. The shared card renders in the drawer and full cart page.

Theme Check and draft browser verification are recorded after implementation.
