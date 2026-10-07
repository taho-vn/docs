# Contributing to Taho documentation

## Source verification workflow

1. Record the application branch, commit and relevant working-tree state.
2. Inspect the affected UI or route.
3. Trace the handler, service or repository, persistence and side effects.
4. Use tests only as supporting evidence.
5. Update the canonical page. Keep the inspected source paths in the review or change description; do not add a visible **Evidence** section.
6. Update route, model, environment or status catalogs when their source changes.
7. When `prisma/schema.prisma` changes, run `npm run generate:data-dictionary`.
8. Run the documentation and optional application drift checks.

Do not infer behavior from labels, comments, TODOs, old documentation or test names.

## Public content boundary

Do not commit credentials, secret values, real resident/customer/employee records, financial records, private endpoints, local absolute paths or deployment access instructions.

## Canonical ownership

| Content | Canonical location |
| --- | --- |
| User-observable current behavior | `operations/`; financial procedures in `finance/` |
| Enforced rules and transitions | `product-specs/` |
| Runtime implementation | `engineering/` |
| Enumerated catalogs and commands | `reference/` |

Link to a canonical concept instead of copying its full definition into multiple pages.

## Reader check

Before requesting review, verify:

- An operator can identify the correct screen without knowing a route path.
- A procedure states its prerequisite, steps and result.
- Internal identifiers are explained or moved to the technical section.
- A developer can follow the request path from entry point to persistence.
- A product rule includes the code condition that enforces it.

## Product workflow template

Use the shared structure in `product-specs/workflow-specifications.mdx` for an important workflow:

1. Classification based on current implementation.
2. One source-confirmed purpose statement.
3. Mermaid flowchart with explicit success, rejection and stopping branches.
4. User Story in the form “Với vai trò / tôi muốn / để”.
5. Acceptance Criteria in Given / When / Then form.
6. Engineering call path from UI or route to persistence and side effects.
7. Repository-relative source paths in the review record.

Do not use User Story wording to introduce product value or behavior that source code does not prove.

## Applying the guide and writing rules

Use the audience separation and component guidance from the writing brief together with `AGENTS.md`. The current application source remains authoritative. Generic examples about payment gateways, monthly cut-off dates, interest, mobile apps or notifications are not evidence of Taho behavior.

When information is missing, inspect the executable call path first. Record `Not confirmed by current source code.` if evidence remains missing. Use `UI exists, but corresponding backend workflow was not found.` for visible controls without a matching backend workflow. Ask for clarification only when the missing input prevents identifying the requested scope or source.

Never request real credentials or personal records to complete an example. Use placeholders for sensitive values; label synthetic examples and keep their fields and validation consistent with source.

### Choose the page structure

| Reader's question | Page structure |
| --- | --- |
| How do I complete this task? | Task and exact menu → prerequisites → UI steps → visible result → rejection and disabled actions → optional technical accordion |
| What behavior should PM, BA and QA expect? | Source-confirmed purpose → Mermaid branches → actor, User Story and Given/When/Then criteria → engineering call path |
| How is this implemented? | Component responsibility → request/call path → input and response contract → transaction and side effects → failure behavior → verification |

Keep backend identifiers out of the main operations procedure; include them in a technical accordion only when useful. Link to the canonical product specification instead of duplicating its complete acceptance criteria.

### Choose components by purpose

| Content need | Component and constraint |
| --- | --- |
| Sequential UI actions | `<Steps>` with exact visible labels in bold; each step tells the reader what to do |
| A source-confirmed condition affecting the task | `<Info>`; put multiple conditions and outcomes in a table |
| A destructive action or verified implementation limitation | `<Warning>`; explain the actual consequence |
| Separate reader views or alternative contracts | `<Tabs>`; do not hide steps that must be performed together in separate tabs |
| Comparable code or payload examples | `<CodeGroup>`; use the handler's actual encoding, not assumed JSON |
| Optional implementation details | `<Accordion title="Dành cho kỹ thuật">` |
| An available, sanitized UI screenshot | `<Frame>` with meaningful image alt text; do not invent an image path or use a mockup as proof of current UI |

Components are conditional on the content. Do not add empty database, API, security or infrastructure sections merely to satisfy a generic template. Close every MDX component. When a Markdown example contains triple-backtick code blocks, wrap the outer example in four backticks.

### Configuration and API reference

Maintain `docs.json` with the current `https://mintlify.com/docs.json` schema. Navigation groups and tabs are different structures: use `navigation.tabs` only when explicitly organizing the site into tabs. Add each published MDX page to navigation and use root-relative links without extensions.

An API reference needs verified methods, request encoding, permissions, fields, responses and errors. Do not fabricate an OpenAPI document from the sample guide. If a source-backed OpenAPI specification is introduced, validate its correspondence to handlers before connecting it to Mintlify. A database dictionary remains generated by `npm run generate:data-dictionary`; do not rewrite its model tables manually.

Mintlify references: [components](https://www.mintlify.com/docs/components), [global settings](https://www.mintlify.com/docs/organize/settings), [navigation](https://www.mintlify.com/docs/organize/navigation).

## Validation

```bash
npm run generate:data-dictionary
npm run check
npm run check:source
npx mint validate
npx mint broken-links --check-anchors --check-redirects
npx mint a11y
```

## PR slices

When changes can be reviewed independently, use these slices:

1. `docs-foundation`: contract, branding, taxonomy and templates.
2. `docs-product-core`: glossary, domain model and module inventory.
3. `docs-finance-workflows`: billing, receipts, debt and adjustments.
4. `docs-resident-operations`: residents, vehicles and requests.
5. `docs-engineering`: architecture, database, integrations, testing and deployment.
6. `docs-ai-readiness`: metadata, cross-links, validation and gap closure.

Do not present a draft slice as complete until its canonical pages and checks pass.
