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
- Browser verification follows the GitHub dev sync.

Other third-party errors will be listed separately after the repeating error no longer fills the console buffer.
