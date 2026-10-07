# Taho documentation

Public Mintlify documentation generated from the current Taho application source code.

## Information architecture

- Bắt đầu
- Nghiệp vụ (hướng dẫn vận hành và quy trình)
- Kỹ thuật
- Tra cứu

`docs.json` divides the published pages into Bắt đầu, Nghiệp vụ, Kỹ thuật and Tra cứu tabs. Each documentation tab has its own sidebar; page headings provide the on-page table of contents. The homepage uses a separate landing layout.

## Rules

- Current executable source code is the only source of truth for current behavior.
- Do not infer missing workflows or business rules.
- Do not publish credentials, personal data, financial records, production endpoints, or secret values.
- See `AGENTS.md` for the source verification and writing contract.

## Local preview

```bash
npx mint dev
```

## Validation

```bash
npm run check
npm run check:source
npx mint validate
npx mint broken-links --check-anchors --check-redirects
npx mint a11y
```

`check:source` expects the application repository at `../../xbuilding`, relative to this documentation directory. Use `node scripts/check-docs.mjs --app-source <path>` when it is elsewhere.

See `CONTRIBUTING.md` for the evidence workflow, audience-specific page structures, Mintlify component guidance and PR slices.
