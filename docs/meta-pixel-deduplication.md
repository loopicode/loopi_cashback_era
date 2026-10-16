# Meta Pixel deduplication

Applied 2026-10-16 in Google Tag Manager, container GTM-NTDDXRK (www.loopi.ch). Published version 20: **Deduplicate Meta pixel on Shopify storefront**. Previous live version: 19 (Dealoo). No theme code changed or theme published.

## Cause

The legacy Custom HTML base tag `Meta Pixel ID 1274063213027615` (tag 9) had four OR firing triggers and used Once per event. Live DOM inspection found two GTM initialization blocks. Shopify's native Meta integration also configured the same pixel (web pixel 193986760). Limiting GTM to Once per page alone still produced a Duplicate Pixel ID warning in preview.

## Change

- Base tag firing option: **Once per page**.
- Added exception trigger 71: **Block Meta base - native Shopify storefront**.
- Trigger type: Custom Event; event name `.*`; regex enabled; Some Custom Events.
- Condition: Page Hostname matches RegEx (ignore case):

```regex
^(www\.)?loopi\.ch$|^[a-z0-9-]+-60011937992\.shopifypreview\.com$
```

This blocks legacy base initialization on this Shopify storefront and its preview hosts. Existing four firing triggers and tag HTML remain unchanged. Other hosts, including checkout subdomains/Circuly, are not matched by this exception. Do not extend the rule to all subdomains without checking checkout tracking.

The native Shopify Meta integration remains the storefront initializer. Other GTM event tags, consent configuration, server Conversions API, Shoplytics dataset, campaigns and budgets were not changed. Workspace was initially clean; version 20 contains only the base-tag modification and new exception trigger.

## Verification

- GTM workspace preview: Meta base tag shown among tags not fired; GA4 and Clarity still fire. DOM: 0 GTM Meta initialization blocks, 1 Meta SDK script, native Shopify pixel configuration present. No Duplicate Pixel warning.
- After publishing and closing debug windows, a fresh live shop tab: 0 GTM initialization blocks, 1 Meta SDK script, native configuration present; no Duplicate Pixel warning.
- Fresh supplied theme-preview hostname: 0 GTM initialization blocks, native configuration present, no Duplicate Pixel warning. Meta SDK did not load in that preview session, so preview evidence alone does not establish event delivery/consent behavior there.
- An older already-open tab briefly retained the old loaded container; use a fresh page load when checking.
- This is an initialization smoke test, not proof of purchase attribution, browser/server event deduplication or end-to-end Circuly checkout tracking. No test purchase or artificial purchase event was sent.

## Manual adjustment and rollback

GTM > www.loopi.ch > Tags > Meta Pixel ID 1274063213027615 > Triggering > Exceptions. The exception references the hostname rule above. Keep Shopify native Meta enabled if this exception is active. If native integration is removed or a new storefront domain is introduced, revisit ownership before deploying.

For immediate rollback, GTM > Versions > version 19 > Publish. This restores the previous container and the duplicate behavior; review any newer versions before rollback. For a targeted rollback, remove exception 71 from tag 9 and restore Once per event, then preview and publish a new version. No rollback has been performed.

Reference: https://support.google.com/tagmanager/answer/6279951?hl=en
