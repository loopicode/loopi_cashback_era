# Dev preview verification

2026-10-16, after implementation commit 0a00cab498a7fd333f6838223e4f2d1b5868b2ea synced through GitHub.

Butterfly 2 PDP: sticky title is `Bugaboo - Butterfly 2`; marketing text after colon omitted. Initial sticky dropdown contains Heritage Black only. Switching PDP color to Deep Indigo changes all sticky options to Deep Indigo; switching back restores Heritage Black options. Selecting `Neu / Heritage Black / 6 Monate` in the sticky dropdown updates the main PDP radio selections to Neu / Heritage Black / 6 Monate; add button enabled. Rental and purchase entries remain in each color group. No item was added and no checkout/purchase was performed.

Console also reports a separate third-party ReferenceError from stream.loopi.ch/manager: `sl_broadcast_custom_events_prepare_custom_conversion_object is not defined`. No changes to that tracking integration were made in this task.

Local regression coverage passed: color switching, returning to previous color, purchase entries, no-color fallback, unknown variant protection, plus 17 cart routing checks. Theme Check valid with two existing non-error warnings in the sticky section.
