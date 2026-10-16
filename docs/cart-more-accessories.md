# Additional cart accessories disclosure

2026-10-16. Fix commit 35870780791e7270e0a2bf7cb37f9e6f62af3e55.

The native details disclosure already opened on click, but its additional cards remained below the visible part of the capped recommendation scroll area. This looked like an unresponsive control.

The drawer recommendation area now expands from min(26vh,22rem) to min(45vh,36rem) while the details is open. Its toggle handler aligns the additional-accessories section with the top of that area's own scrollport; it does not scroll the product page. A plus/minus indicator and keyboard focus outline make its state clearer. Recommendation rules are unchanged.

Dev preview smoke test with a Butterfly 2 in an initially empty cart: open control, verify open=true and minus indicator; first additional article appears inside expanded viewport; click again verifies open=false. Test product removed afterward. No purchase. All 39 accessory recommendation tests pass, and Theme Check passes both changed assets.
