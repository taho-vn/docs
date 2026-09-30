import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, relative, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const appArg = process.argv.indexOf("--app-source");
const appSource = appArg >= 0 ? resolve(process.argv[appArg + 1] ?? "") : null;
const failures = [];

function walk(directory, predicate = () => true) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if ([".git", ".agents", "node_modules"].includes(entry.name)) return [];
      return walk(path, predicate);
    }
    return predicate(path) ? [path] : [];
  });
}

function display(path) {
  return relative(root, path).split(sep).join("/");
}

const config = JSON.parse(readFileSync(resolve(root, "docs.json"), "utf8"));

function collectNavigationPages(node) {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(collectNavigationPages);
  if (!node || typeof node !== "object") return [];

  return ["pages", "groups", "tabs", "anchors", "dropdowns", "products", "versions", "languages"]
    .flatMap((key) => collectNavigationPages(node[key]));
}

const navigationPages = collectNavigationPages(config.navigation);
const mdxFiles = walk(root, (path) => path.endsWith(".mdx"));
const mdxPages = mdxFiles.map((path) => display(path).replace(/\.mdx$/u, ""));

for (const page of navigationPages) {
  if (!existsSync(resolve(root, `${page}.mdx`))) failures.push(`Navigation target missing: ${page}`);
}
for (const page of mdxPages) {
  if (!navigationPages.includes(page)) failures.push(`MDX page missing from navigation: ${page}`);
}
if (new Set(navigationPages).size !== navigationPages.length) failures.push("Duplicate navigation page found");

const internalLinks = new Set();
for (const file of mdxFiles) {
  const source = readFileSync(file, "utf8");
  for (const field of ["title", "description", "keywords"]) {
    if (!new RegExp(`^${field}:`, "mu").test(source)) failures.push(`${display(file)} missing ${field}`);
  }
  if (/^#{2,3} Evidence\s*$/mu.test(source)) failures.push(`${display(file)} has a visible Evidence section`);
  for (const match of source.matchAll(/\]\((\/[a-z0-9][^\s)#]*)/giu)) internalLinks.add(match[1]);
}
for (const link of internalLinks) {
  if (link === "/") continue;
  if (!existsSync(resolve(root, `${link.slice(1)}.mdx`))) failures.push(`Broken internal page link: ${link}`);
}

const publicFiles = walk(root, (path) => /\.(?:json|md|mdx|mjs|yml|yaml)$/u.test(path));
const sensitivePatterns = [
  /postgres(?:ql)?:\/\/[^\s]+/iu,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  /github_pat_[A-Za-z0-9_]{20,}/u,
  /ghp_[A-Za-z0-9]{20,}/u,
  /sk-[A-Za-z0-9]{20,}/u,
  /AKIA[0-9A-Z]{16}/u,
];
for (const file of publicFiles) {
  const source = readFileSync(file, "utf8");
  if (sensitivePatterns.some((pattern) => pattern.test(source))) failures.push(`Sensitive pattern found: ${display(file)}`);
}

if (appSource) {
  if (!existsSync(appSource)) {
    failures.push(`Application source not found: ${appSource}`);
  } else {
    const schema = readFileSync(resolve(appSource, "prisma/schema.prisma"), "utf8");
    const modelCount = [...schema.matchAll(/^model\s+\w+\s*\{/gmu)].length;
    const handlerCount = walk(resolve(appSource, "app"), (path) => path.endsWith(`${sep}route.ts`)).length;
    const adminData = readFileSync(resolve(appSource, "src/lib/admin-data.ts"), "utf8");
    const draftStart = adminData.indexOf("const routeDrafts = [");
    const draftEnd = adminData.indexOf("export const adminRoutes", draftStart);
    const draftSource = draftStart >= 0 && draftEnd > draftStart
      ? adminData.slice(draftStart, draftEnd)
      : "";
    const adminRouteCount = [...draftSource.matchAll(/\broute\(\{/gu)].length;
    const catalog = readFileSync(resolve(root, "reference/route-catalog.mdx"), "utf8");
    const dictionary = readFileSync(resolve(root, "reference/data-dictionary.mdx"), "utf8");
    const schemaFingerprint = `sha256:${createHash("sha256").update(schema).digest("hex")}`;
    if (!adminRouteCount) failures.push("Unable to count application admin routes");
    if (!catalog.includes(`${adminRouteCount} admin route`)) failures.push(`Route catalog does not state ${adminRouteCount} admin routes`);
    if (!catalog.includes(`${handlerCount} HTTP route handler`)) failures.push(`Route catalog does not state ${handlerCount} HTTP handlers`);
    if (!dictionary.includes(`${modelCount} models`)) failures.push(`Data dictionary does not state ${modelCount} models`);
    if (!dictionary.includes(`schemaFingerprint: "${schemaFingerprint}"`)) {
      failures.push("Data dictionary was not generated from the current Prisma schema");
    }
  }
}

if (failures.length) {
  for (const failure of failures) process.stderr.write(`ERROR ${failure}\n`);
  process.exit(1);
}

process.stdout.write(`OK ${navigationPages.length} navigated MDX pages checked${appSource ? " with application drift checks" : ""}.\n`);
