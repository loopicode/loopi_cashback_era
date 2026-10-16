# Preview console flood: empty legacy ticker

Reported and reproduced on the unpublished dev preview on 15 October 2026.

## Cause

The homepage had zero .ticket-wrapper elements. The legacy ticker in assets/custom-scripts.js still called mqRotate with an empty array. Its final mqr[0].TO assignment threw TypeError: Cannot set properties of undefined (setting 'TO'). The loaded preview identified the function as mqRotate2. The callback had already scheduled its next 30ms timeout, so the same error kept recurring.

The captured sample contained 150 identical errors in five seconds. This source is separate from the accessory/cart code.

## Fix

Skip initialization when the page contains no ticker wrapper. Also stop rotation when no ticker was initialized (including wrappers lacking .ticker-text). Do not suppress console errors or disable tracking.

## Validation

- JavaScript syntax passed.
- Theme Check passed assets/custom-scripts.js.
- Five regression cases passed against the actual ticker block: absent wrapper, missing text, moving valid ticker, pointer pause/resume, and non-home page.
- Browser verification completed on 16 October 2026: Shopify read-only API confirmed both guards in the unpublished dev theme file; the fresh Chrome preview loaded custom-scripts.js version 101007179200775894331792086133.
- After more than 30 seconds, no JavaScript error was captured and no recurring ticker error remained. The homepage still had zero ticker wrappers, reproducing the original trigger.

## Remaining warnings

The fresh preview load produced two Meta Pixel warnings, both from connect.facebook.net/en_US/fbevents.js:
- Duplicate Pixel ID 1274063213027615: review pixel initialization across the tracking manager, GTM and Shopify integration, then keep one intended owner.
- Pixel unavailable on this website because of traffic permission settings: this occurred on the shopifypreview.com host. Check the real storefront separately before changing production permissions; the warning does not by itself prove that live-store tracking is blocked.

The previously recorded tracking-manager custom-conversion helper error did not appear during this fresh homepage observation. This is a scoped browser observation, not an assertion that all third-party tracking flows are error-free. No analytics configuration or live theme was changed.
