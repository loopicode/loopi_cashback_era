# Cart press feedback

Commit 8e420c6ddad756a9e87e2e4a35cd1310e79ccbff adds a 180ms pressure animation (scale 1 -> 0.96 -> 1) to cart icon, product add controls including sticky/quick add, accessory add, checkout controls, native Shopify payment buttons exposed in the document, drawer buttons, removal and quantity controls. Closed third-party iframes are outside this event delegation.

One delegated pointerdown handler supports mouse/touch; keyboard-generated click uses the same effect without repeating the pointer animation. Disabled/aria-disabled controls are excluded. Prior animation on the same control is canceled on another press. Reduced-motion preference uses opacity feedback without scaling.

No new loader, vibration, delay to submission, or blocking mechanism is added. Existing loaders and duplicate-submission guards remain unchanged. Animation is feedback, not confirmation that the request succeeded.

Validation: Theme Check passes changed JavaScript. Local behavior checks pass for pointer/keyboard dispatch, avoiding duplicate pointer/click animation, disabled controls, reduced-motion fallback and replay cancellation. Dev browser smoke test confirms cart icon still opens drawer and no loopi-cart console errors were captured. No checkout or purchase performed.
