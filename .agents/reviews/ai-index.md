# AI index review

Reviewed executable application source on 2026-10-07. No live OpenAI or application database test was performed. Source paths below are relative to the application repository; this record is excluded from the published site.

## Claim trace

- Chat UI, history, Markdown, citations, cancellation: `app/admin/_features/ai/AiAssistantWorkspace.client.tsx` -> `app/admin/ai/chat/route.ts` -> `src/modules/ai/ai-chat.ts`, `ai-tools.ts`, `ai-repository.ts` -> Prisma `AiChatThreads`, `AiChatMessages`, `AiRateLimits`. Conversation creation precedes the exchange transaction. Cancellation describes client request abort, not a guarantee of rollback.
- Knowledge form and management visibility: `app/admin/_features/ai/AiPage.tsx`, `KnowledgeUploadForm.client.tsx` -> `app/admin/ai/knowledge/route.ts` -> `src/modules/ai/ai-knowledge.ts`, `ai-knowledge.shared.ts`, `ai-openai.ts`, `ai-repository.ts` -> Prisma `AiKnowledgeDocuments`, `AiKnowledgeChunks`, `AuditLogs`. Upload and archive each write their audit log within their own database transaction. Embeddings are generated before upload persistence.
- Record search: chat route -> `src/modules/ai/ai-tools.ts` -> `ai-taho-data.ts`, `ai-taho-data.shared.ts` -> Prisma read delegates for Apartments, Residents, Bills, Debits, Receipts, ServiceRequests. Access is checked per area; `tower_id` is applied before `findMany`, and fields are filtered twice. No business writes in the exposed tool.
- MCP: `app/api/mcp/route.ts` -> `src/modules/ai/ai-mcp.ts` -> same tool and repository paths. Knowledge embedding failure falls back to lexical scoring. Record tool is registered only when accessible areas exist.
- Limits and external processing: `src/modules/ai/ai-rate-limit.ts`, `ai-repository.ts`, `ai-repository.shared.ts`, `ai-chat.ts`, `ai-openai.ts`. OpenAI Responses request uses `store: false`; content is still sent for processing.
- Gaps: UI debt summary suggestion reaches ordinary chat; `ai-taho-data.ts` has empty `summarize()` and `ai-tools.ts` exposes only search. PDF extraction in `ai-knowledge.ts` has no OCR branch. Retrieval caps candidates before ranking. `ai-chat.ts` validates citation membership, not claim accuracy.

## Source mismatch outside published overview claims

The tool allowlist in `ai-tools.ts` includes resident `status` and service request `request_code`, while the database selection in `ai-taho-data.shared.ts` does not select those fields. The latter selects `details` and bill `current_amount`, which the former filters out. The overview promises only the common fields, not the unmatched fields.

## Generated reference

The source check detected an outdated Prisma schema fingerprint in the existing data dictionary. Regenerated with `npm run generate:data-dictionary`; application schema was not edited.
