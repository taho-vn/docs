# Taho documentation instructions

## Project

- This repository contains the public Taho documentation site built with Mintlify.
- Pages are MDX files with YAML frontmatter.
- Site configuration lives in `docs.json`.
- Use the installed Mintlify skill before changing pages, navigation, components, or configuration.
- Consult the current Mintlify documentation for platform behavior.

## Source-of-truth rule

The current application source code is the only source of truth for current behavior.

Before documenting behavior:

1. Inspect the relevant UI implementation or route.
2. Trace the server handler.
3. Trace the called service or repository.
4. Confirm database persistence and side effects.
5. Use tests only as supporting evidence.

Trace important workflows as:

```text
UI or route -> handler -> service or repository -> database -> side effects
```

Do not infer missing behavior, intended architecture, or business rules. Do not treat names, labels, comments, TODOs, old documentation, or non-executing tests as proof.

When evidence is missing, write exactly:

```text
Not confirmed by current source code.
```

When UI exists without a corresponding backend workflow, write exactly:

```text
UI exists, but corresponding backend workflow was not found.
```

When source files contradict each other, document the contradiction. Do not resolve it through interpretation.

## Classification

- `Implemented`: the complete claimed behavior is directly supported by executable code.
- `Partial`: implementation exists, but the complete workflow is not present.
- `Placeholder`: a visible route, control, or action exists without a real corresponding workflow.
- `Not Found`: supporting implementation was not found.

Never classify behavior as `Implemented` from UI text alone.

## Source traceability

- Verify every behavioral claim against current executable source before publishing.
- Do not add a visible **Evidence** section to published pages. Keep source paths in the review record or change description.
- State where the call chain stops for `Partial`, `Placeholder`, and `Not Found` findings.
- Existing documentation is secondary evidence. Current executable source code wins on conflict.

## Public content boundary

This repository is public. Never publish:

- credentials, tokens, cookies, secrets, or secret values;
- real resident, employee, customer, contact, or financial records;
- production hostnames, private network details, or operational access instructions;
- values copied from `.env`, `.env.local`, logs, databases, or generated evidence artifacts.

Environment variable names and source-level validation rules may be documented when the code exposes them. Use placeholders for values.

## Terminology

- Use the Vietnamese UI label when describing a visible screen or action.
- Preserve code identifiers, route paths, model names, and environment variable names in English.
- Use “tòa nhà” for the active operational scope represented by `activeTowerId`.
- Use “bảng kê” for records persisted through `Bills` and `BillLines`.
- Use “phiếu thu/chi” for records persisted through `Receipts`.
- Do not invent a Vietnamese business term when the code provides no equivalent.

## Writing style

- Use active voice and second person for procedures.
- Keep sentences concise.
- Use sentence case for headings.
- Bold UI labels: Click **Settings**.
- Use code formatting for file names, commands, paths, models, and identifiers.
- Lead with observed behavior, not product positioning.
- Avoid marketing language, filler, recommendations, and future-state content.
- Use root-relative internal links without file extensions.
- Give every page `title` and `description` frontmatter.
- Add every published page to `docs.json` navigation.

## Audience-specific structure

### Operations pages

Write for a building operator who does not read source code.

1. Start with the task the reader can complete.
2. Name the exact menu and visible screen.
3. State permissions or prerequisites in plain language.
4. Use `<Steps>` for a sequence of UI actions.
5. Explain the visible result after save or submit.
6. Put routes, handlers, models and intent names in a **Dành cho kỹ thuật** accordion when they help explain the behavior.
7. Tell the reader when a visible action is unavailable if that affects the procedure. Keep implementation gaps and release tracking in `reference/release-status.mdx`, not in the task instructions.

Do not open an operations page with a route, model or internal function name.

### Product specification pages

For every important workflow, cover only source-confirmed items:

- purpose;
- actor and permission;
- preconditions;
- input;
- successful path;
- state changes;
- validation and rejection conditions;
- persistence and side effects;
- related routes, models and tests.

Present important workflows in this reader order:

1. A Mermaid flowchart showing source-confirmed branches and stopping points.
2. A PM/BA/QA view with actor, User Story and Given/When/Then Acceptance Criteria.
3. An Engineering view with the call path, transaction boundary, persistence and side effects.

In a User Story, the actor, capability and outcome must all be proven by current code. If the product value after “để” is not provable, use `Not confirmed by current source code.` instead of inventing it.

### Engineering pages

Start with the component's responsibility. Then show its call path, important files, runtime boundaries, failure behavior and verification commands. Explain why a code identifier matters before listing it.

## Language clarity

- On business workflow pages, draw source-confirmed state transitions with Mermaid instead of arrow text blocks.
- Explain each listed state in a table using Vietnamese business language; keep exact stored values in code formatting.
- Highlight material business restrictions with `<Warning>`, `<Info>`, or `<Note>` next to the relevant workflow.
- Do not use API response-field components merely to decorate business states.

- Prefer Vietnamese product language for prose.
- Keep English only for exact identifiers and common technical terms that appear in source.
- Define an identifier the first time it appears.
- Do not mix English verbs into Vietnamese prose when a clear Vietnamese verb exists.
- A table or list must answer a reader question, not merely inventory names.

## Final validation

Before finishing a section, verify that every behavioral claim points to current code. Check that no intent was inferred, no future behavior is presented as current, no external knowledge fills a product gap, no contradiction is hidden, and no sensitive value appears.

When `prisma/schema.prisma` changes, regenerate `reference/data-dictionary.mdx` with `npm run generate:data-dictionary`. Do not edit the generated model and field tables by hand.

Run:

```bash
npm run check
npm run check:source
mint validate
mint broken-links --check-anchors --check-redirects
mint a11y
```
