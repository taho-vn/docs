# Mini App, OpenAPI and environment documentation review

Reviewed current source on 2026-10-07. Application code, schema and environment files were not modified. Only variable names were extracted from `.env.example`; actual environment values were not copied. Documentation samples contain authored placeholders.

## Mini App call paths

- `package.json` scripts -> `resident-miniapp/vite.config.ts`: root, dev port 5174, strict port, /api proxy to local backend, build output. Build -> `resident-miniapp/scripts/sync-app-config.mjs` changes app-config.json using generated manifest.
- `resident-miniapp/src/App.tsx`, `api.ts`, `platform/zalo.ts`, `demo.ts` distinguish browser demo, DEV preview and default production build. Default Vite build uses production mode; explicit NODE_ENV overrides may alter DEV behavior. Documentation describes the provided scripts' normal mode.
- Auth: frontend SDK -> `app/api/resident/auth/zalo/route.ts` -> `resident-miniapp-auth.ts` external verifier -> signed Taho resident session. No phone proof in the current path; verifiedPhone is empty.
- Portal and link submission: resident portal route -> `resident-miniapp.ts` -> ResidentMiniappLinks upsert and Prisma reads. Current approved-apartment fallback and take limits preserved in API descriptions.
- Admin review: access workspace -> resident-miniapp/action route -> service transaction updating link and AuditLogs. No creation of resident/membership.

## OpenAPI scope

No Swagger/OpenAPI implementation, dependency, route or spec was found in application app/src/scripts/package.json or filename inventory. Added a documentation-owned OpenAPI 3.0.3 spec and eight explicit MDX endpoint pages: resident authentication, portal GET/POST, access review, AI chat GET/POST and knowledge POST/DELETE.

Source tracing includes the handlers above, `app/admin/ai/chat/route.ts`, `app/admin/ai/knowledge/route.ts`, AI chat/repository/tools/OpenAI modules and `src/core/http/api-response.ts`. Confirmed admin header/cookie extraction from access auth.shared.ts. No server URL or actual credentials are included. Spec schemas describe valid canonical request forms; handlers may also coerce primitives. Conditional service-request values are documented as incomplete in the generic values schema, with actual validation remaining in requests module.

CORS OPTIONS exists for resident auth and portal; described in MDX rather than rendered as extra operation pages. Admin missing-session access-review is 403; AI history GET missing permission is 401, unlike AI chat POST's 403. Malformed body errors are documented according to each actual catch handler.

OpenAPI frontend references were checked against current Mintlify documentation. Omitted servers intentionally and explicitly configured simple playground display so no request submission button implies an application target. Mintlify may use api.example.com in generated examples; the index identifies it as a renderer placeholder to replace. Complete HTTP handler inventory remains route-catalog, rather than implying the eight detailed operations cover all 28 handlers.

## Environment consumers

- `prisma.config.ts`, `src/core/db/prisma.ts`: DATABASE_URL, fixed 5000 ms connection timeout; no current DIRECT_URL or TAHO_DB_* consumer in that path. Corrected old pool-env statement.
- `src/modules/access/auth.ts`, admin-bootstrap.ts and resident-miniapp-auth.ts: JWT secret production check, bootstrap validation and Zalo/verifier requirements.
- AI openai/chat consumers: nullish key precedence, whitespace trimming, default models. No copied secret values.
- `src/core/delivery/email-delivery.ts`: delivery flag plus runtime environment, key/from/reply-to/webhook requirements.
- `src/modules/operations/meter-image-storage.ts`, shared.ts: required storage names, aliases, endpoint validation and explicit loopback option.
- `src/bootstrap/initialize-database.ts`: demo flag only outside production.
- Frontend api.ts reads VITE_TAHO_API_URL. Vite root/env behavior confirmed against official Vite docs; sensitive server settings are not exposed as VITE_*.

Current backend example lacks TAHO_ZALO_VERIFIER_URL and TAHO_ZALO_VERIFIER_SHARED_SECRET; frontend API URL is a separate Vite setting. Added their names and authored placeholders to docs without editing the application example.

## Verification boundary

Documentation validation, source drift checks, links/anchors, accessibility and local rendering are checked. This change does not verify live Zalo/OpenAI/Resend/R2 or application database integration.

The first hot-reloaded API preview showed MDX without schema after pages and spec were added together. Restarting the local Mintlify dev server rendered the operation, request body, response schemas and status variants correctly.
