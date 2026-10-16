# Translation gap register

Maintain this file when gaps are noticed during theme work. Consult it before future translation audits. Entries are observations, not permission to change unrelated copy or commercial terms.

## Open

| ID | Area | Language | Observation | Next step |
|---|---|---|---|---|
| TR-003 | Location/opening-hours source | German | Weekday labels are Monday–Sunday and weekend values Closed in the German source settings. Location modal source title is Our location. | Localize source via theme settings/GitHub after checking other locales remain intact. Current task covers EN/FR; times must remain unchanged. |
| TR-004 | Google reviews widget | EN/FR | Exzellent observed in EN product page while other widget labels were English; customer review text remains in its original language. | Check app-provided widget localization. Do not rewrite customer reviews. |
| TR-005 | Homepage rental FAQ | EN | Rendered English says All accessories have a minimum duration of 6 months; German theme source says products without selectable duration have minimum 6 months. Potential stale/mismatched translation. | Compare latest source and translation before correcting; preserve actual rental policy. |
| TR-006 | Location popup wording | FR | Existing title Notre site is translated but could more clearly say Notre magasin for the physical store. | Optional wording review, not a missing translation. |

## Completed

| ID | Area | Result | Date |
|---|---|---|---|
| TR-001 | PDP Cashback banner/calculator/table | 90 missing translations registered: 45 EN and 45 FR. Explainer page/SEO already translated and checked. See cashback-translations.md. | 2026-10-16 |
| TR-002 | Location bar and popups | Added three English translations (Store in Zug, Opening hours trigger/title). French labels/weekdays/Closed already translated; preserved. Replaced two hardcoded popup Close labels with existing translated accessibility.close. See location-translation-record-2026-10-16.json. | 2026-10-16 |

Resource: live theme 201053864310, still named loopi_cashback_era/dev after publication. Translation API changes are theme-ID-bound; documentation records are not automatic redeployment scripts.
