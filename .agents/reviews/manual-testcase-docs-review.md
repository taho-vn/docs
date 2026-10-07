# Manual testcase documentation review

Reviewed on 2026-10-07 against application branch `codex/refactor-source-architecture`, HEAD `593ba31244da984c7d78901bf90d50573fac5c80` and its existing working tree. Application code was not edited. No application UAT, live Zalo integration, production database checks or migrations were run.

## Workbook handling

- Read `Taho_Manual_Test_MVP_2026-09-30.xlsx` from the application's outputs directory.
- `Manual_Checklist`: 166 unique IDs. `Chot_MVP`: 98 selected IDs. Catalogue reconciles all IDs exactly once against the first sheet and membership against the second sheet.
- Published only ID, testcase objective and MVP membership. Omitted credentials, fixtures, actual results, testers, test dates, evidence links, internal source comments and plan excerpts. Original workbook unchanged and not copied to the public repository.
- Some cached date cells in `Chot_MVP` contain numeric `NaN`, which caused openpyxl extraction to fail. Read OOXML directly for analysis; did not repair the workbook or treat cached dates as valid evidence.
- Goal names remain historical testcase objectives. The catalogue does not classify all 166 workflows as implemented, and route smoke cases do not establish mutation correctness.

## Confirmed corrections and call paths

| Cases | Source trace (relative to application repository) | Documentation correction |
| --- | --- | --- |
| IMP-01–04, RES-04, RTE-019 | `app/admin/_features/imports/ImportForms.client.tsx`, `ImportsPage.tsx`, `crud/CrudPage.tsx` -> `app/admin/import/route.ts` -> `src/modules/admin/admin-repository.ts`, `financial-imports.ts` -> import history and workflow tables; resident branch -> `src/modules/residents/resident-import-reconciliation.ts` -> transaction claiming preview and creating reconciliation items | Import form is active. Generic imports preview then commit; financial modules commit automatically after valid parse. Resident commit does not create resident/membership before reconciliation decisions. |
| LOCK-02, PAY | Receipt UI -> `app/admin/workflow/route.ts` -> `src/modules/billing/receipt-service.ts`, `financial-controls.ts`, `internal/bill-balances.shared.ts` -> Receipts, allocations, Bills/BillLines, ledgers and audit | Receipt creation checks accounting period, not each source bill cycle. Cancellation checks receipt accounting period plus dependent bills for excess-applied allocations. |
| BUG-01, MINI-13/15 | `resident-miniapp/src/App.tsx`, `api.ts` -> `app/api/resident/portal/route.ts` -> `src/modules/resident-miniapp/resident-miniapp.ts` -> Prisma Bills/Receipts reads | Approved status filter precedes take 24. Debt is reduced over the limited bills returned, not an all-bills aggregate. Cancelled/deleted receipts are excluded. |
| BUG-02, REQ | `app/admin/_features/requests/ResidentRequestViews.tsx` -> `app/admin/resident-workflow/route.ts` -> `src/modules/admin/admin-repository.ts` -> Feedback update with current status condition; service request uses generic update | Only completed feedback reopen guard is confirmed. The earlier full transition matrix, open-task completion block and shared audit transaction are unsupported; referenced request-workflow files do not exist. |
| BUG-03 | Bill UI -> `app/admin/workflow/route.ts` -> billing service writes canonical apartment code; `prisma/schema.prisma`, `prisma/migrations/20261006160000_bill_apartment_integrity/migration.sql` | FK is `(tower_id, apartment)` to apartment `(tower_id, code)`, not a Bills.apartment_id field. Migration checks duplicates and invalid references before adding FK. Deployment status unverified. |
| VEH-01/02 | Vehicle workspace -> `app/admin/apartment-vehicles/route.ts` -> `src/modules/operations/apartment-vehicles.ts`, `apartment-vehicles.shared.data.ts` -> transaction writing Vehicles, ServiceApartments and audit | Pending/non-active vehicle does not create active assignment; activation requires billing start date. Apartment reference check does not require active status; new service must be active, existing inactive service may be retained when editing. |
| MINI-04–12 | `ResidentMiniappAccessWorkspace.client.tsx`, `resident-miniapp/src/App.tsx` -> admin miniapp action / resident portal -> `resident-miniapp.ts` -> ResidentMiniappLinks upsert/read/update and audit transaction | Approval/rejection/revocation do not create resident/membership. Reject requires reason. Link submission reuses account+apartment row, resetting pending. Portal falls back to first approved link for unmatched apartment ID; no false 403 promise. |
| MINI-17, GAP-12 | Mini App feedback form -> resident portal POST -> create request sets miniapp_zalo_user_id -> portal GET filters identity plus apartment/tower -> Feedback/ServiceRequests | Privacy filter uses Zalo creator ID, not phone. Creator account FK remains unconfirmed. |
| MINI-01–03, GAP-01 | `resident-miniapp/src/platform/zalo.ts`, `api.ts` -> resident auth Zalo route -> `resident-miniapp-auth.ts` -> signed session; external verifier request | Identity verification exists; verifiedPhone is explicitly empty and no phone permission request exists. Historical phone-proof expectations contradict current implementation. |
| MINI-18, GAP-02–13 | Mini App App/api plus resident auth/portal route and resident-miniapp service; schema and exposed routes | Documented stopping points: direct create without idempotency, no rotation/logout flow, no per-flow tower flags, metadata-only notices, no read state, incomplete fee UI, no Mini App attachments/detail conversation, no second-link action in approved portal. |

Tests were supporting source targets only, not executed: resident-miniapp-access/auth, resident-request-api/workflows, financial-workflows, bill-apartment-integrity, import-spreadsheet, resident-membership-workflows, apartment-vehicle-workflows.

## Scope of review

Compared workbook objectives across Admin, mobile UI, Mini App, gaps and release gates with the existing documentation. Corrected confirmed discrepancies above and linked remaining case goals to existing topic pages. This is not a fresh runtime pass/fail assessment of all testcase IDs.

Removed old hard-coded source snapshot and unsupported 475/475 release assertion. Automated test commands remain verified against package.json. Existing data dictionary was already regenerated from the current schema in the preceding AI documentation update; application schema was not changed in this review.
