import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const groups = [
  {
    title: "Tenant và authorization",
    description: "Tòa nhà, tài khoản đăng nhập, hồ sơ nhân sự và grouped RBAC.",
    models: ["Organizations", "Towers", "AuthUsers", "Users", "UserBuildings", "PermissionGroups", "Permissions", "UserPermissionGroups", "PermissionGroupPermissions", "OrganizationAuditLogs", "OrganizationOnboardingRequests"],
  },
  {
    title: "Căn hộ, cư dân và phương tiện",
    description: "Căn hộ, hồ sơ cư dân, membership, reconciliation import và phương tiện.",
    models: ["Apartments", "Residents", "ResidentApartmentMemberships", "ResidentImportReconciliationItems", "ResidentMiniappLinks", "Vehicles", "VehicleCards"],
  },
  {
    title: "Dịch vụ và cấu hình thu phí",
    description: "Dịch vụ, assignment, chỉ số, đối tác, danh mục thu và khóa kỳ.",
    models: ["Services", "ServiceApartments", "Partners", "MeterReadings", "ReceiptCategories", "PaymentCodes", "CycleLocks"],
  },
  {
    title: "Công nợ, thu chi và sổ quỹ",
    description: "Bảng kê, điều chỉnh, phiếu thu, phân bổ, tiền thừa, giao dịch và audit.",
    models: ["Bills", "BillLines", "BillingAdjustments", "BillingAdjustmentLines", "Receipts", "ReceiptAllocations", "ExcessPaymentLedger", "Debits", "ExcessPayments", "AccountingTransactions", "Cashbook", "Bankbook", "AuditLogs"],
  },
  {
    title: "Tương tác cư dân",
    description: "Phản ánh, yêu cầu dịch vụ, nội dung, biểu mẫu, sửa chữa và đánh giá.",
    models: ["Feedback", "Posts", "Polls", "Comments", "ServiceRequests", "RequestComments", "RequestAttachments", "RequestTasks", "FeedbackForms", "Repairs", "InteractionReports", "AppRatings", "ServiceRatings"],
  },
  {
    title: "Nhắc công nợ và email",
    description: "Campaign, notification job, provider event và suppression.",
    models: ["BillingReminderCampaigns", "Notifications", "NotificationEvents", "EmailSuppressions"],
  },
  {
    title: "Import",
    description: "Preview, commit state và lỗi theo dòng của file import.",
    models: ["ImportHistory", "ImportErrors"],
  },
  {
    title: "Cấu hình, nội dung và landing",
    description: "Danh mục cấu hình còn lại, handbook, địa điểm và contact công khai.",
    models: ["Buildings", "Handbook", "BuildingPlaces", "AccountingAccounts", "ReceiptForms", "Configs", "LandingContacts"],
  },
  {
    title: "AI knowledge và chat",
    description: "Tài liệu tri thức, đoạn nội dung, cuộc hội thoại, tin nhắn và giới hạn truy cập AI trong schema.",
    models: ["AiKnowledgeDocuments", "AiKnowledgeChunks", "AiChatThreads", "AiChatMessages", "AiRateLimits"],
  },
];

function argument(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

function escapeCell(value) {
  const text = String(value ?? "").trim();
  if (!text) return "—";
  return `\`${text.replaceAll("|", "\\|").replaceAll("`", "\\`")}\``;
}

function parseModels(schema) {
  const blocks = [...schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gmu)];
  const names = new Set(blocks.map((match) => match[1]));
  return blocks.map((match) => {
    const fields = [];
    const constraints = [];
    let table = "";
    for (const sourceLine of match[2].split(/\r?\n/u)) {
      const line = sourceLine.trim();
      if (!line || line.startsWith("//")) continue;
      const tableMatch = line.match(/^@@map\("([^"]+)"\)$/u);
      if (tableMatch) {
        table = tableMatch[1];
        continue;
      }
      if (line.startsWith("@@")) {
        constraints.push(line);
        continue;
      }
      const fieldMatch = line.match(/^(\w+)\s+(\S+)(?:\s+([\s\S]+))?$/u);
      if (!fieldMatch) throw new Error(`Unable to parse Prisma field line: ${line}`);
      const [, name, type, attributes = ""] = fieldMatch;
      const baseType = type.replace(/[?\[\]]/gu, "");
      fields.push({
        name,
        type,
        attributes,
        relation: names.has(baseType),
      });
    }
    return { name: match[1], table, fields, constraints };
  });
}

function fieldTable(fields, relation) {
  const selected = fields.filter((field) => field.relation === relation);
  if (!selected.length) return relation ? "Không có Prisma relation field.\n" : "Không có scalar database column.\n";
  const heading = relation
    ? "| Field | Prisma type | Relation attributes |\n| --- | --- | --- |"
    : "| Field | Prisma type | Nullable | Default/key/database attributes |\n| --- | --- | --- | --- |";
  const rows = selected.map((field) => relation
    ? `| \`${field.name}\` | \`${field.type}\` | ${escapeCell(field.attributes)} |`
    : `| \`${field.name}\` | \`${field.type}\` | ${field.type.endsWith("?") ? "Có" : "Không"} | ${escapeCell(field.attributes)} |`);
  return `${heading}\n${rows.join("\n")}\n`;
}

function renderModel(model) {
  const constraints = model.constraints.length
    ? model.constraints.map((constraint) => `- ${escapeCell(constraint)}`).join("\n")
    : "Không có model-level constraint ngoài field attributes trong Prisma schema.";
  return `<Accordion title="${model.name} — ${model.table || "no @@map"}">

**Database columns**

${fieldTable(model.fields, false)}
**Prisma relation fields**

${fieldTable(model.fields, true)}
**Model constraints và mapping**

- Database table: \`${model.table || "Not confirmed by current source code."}\`
${constraints}

</Accordion>`;
}

function renderGroupErDiagram(group, byName) {
  const modelNames = new Set(group.models);
  const relations = [];
  const seen = new Set();

  for (const modelName of group.models) {
    const model = byName.get(modelName);
    if (!model) continue;
    for (const field of model.fields) {
      if (!field.relation) continue;
      const targetModel = field.type.replace(/[?\[\]]/gu, "");
      if (!modelNames.has(targetModel)) continue;

      if (field.type.endsWith("[]")) {
        const pairKey = `${modelName}->${targetModel}:${field.name}`;
        if (!seen.has(pairKey)) {
          seen.add(pairKey);
          relations.push(`  ${modelName} ||--o{ ${targetModel} : "${field.name}"`);
        }
      } else if (!field.type.includes("[")) {
        const targetObj = byName.get(targetModel);
        const hasListInverse = targetObj?.fields.some(
          (f) => f.relation && f.type.replace(/[?\[\]]/gu, "") === modelName && f.type.endsWith("[]"),
        );
        if (!hasListInverse) {
          const pairKey = [modelName, targetModel].sort().join("<->");
          if (!seen.has(pairKey)) {
            seen.add(pairKey);
            relations.push(`  ${modelName} ||--|| ${targetModel} : "${field.name}"`);
          }
        }
      }
    }
  }

  if (!relations.length) return "";
  return `### Sơ đồ quan hệ thực thể (ERD)\n\n\`\`\`mermaid\nerDiagram\n${relations.join("\n")}\n\`\`\`\n\n`;
}

function renderDictionary(models, schemaFingerprint) {
  const byName = new Map(models.map((model) => [model.name, model]));
  const configured = groups.flatMap((group) => group.models);
  const duplicates = configured.filter((name, index) => configured.indexOf(name) !== index);
  const missing = models.map((model) => model.name).filter((name) => !configured.includes(name));
  const unknown = configured.filter((name) => !byName.has(name));
  if (duplicates.length || missing.length || unknown.length) {
    throw new Error(`Invalid domain grouping. Duplicate: ${duplicates}; missing: ${missing}; unknown: ${unknown}`);
  }

  const sections = groups.map((group) => `## ${group.title}

${group.description}

${renderGroupErDiagram(group, byName)}<AccordionGroup>
${group.models.map((name) => renderModel(byName.get(name))).join("\n\n")}
</AccordionGroup>`).join("\n\n");

  return `---
title: "Data dictionary"
description: "Đầy đủ model, database column, Prisma type, nullability, default, relation và constraint từ current schema."
keywords: ["data dictionary", "Prisma models", "database fields", "schema", "relations"]
schemaFingerprint: "${schemaFingerprint}"
---

Trang này được sinh trực tiếp từ \`prisma/schema.prisma\`. Current schema có **${models.length} models**.

<Info>
  **Database columns** là scalar fields được lưu trong table. **Prisma relation fields** dùng để điều hướng relation trong Prisma Client và không tạo thêm column mang cùng tên. Foreign-key columns vẫn nằm trong bảng **Database columns**.
</Info>

## Cách đọc field contract

| Cột | Ý nghĩa |
| --- | --- |
| Field | Tên field trong Prisma model |
| Prisma type | Type và nullability; hậu tố \`?\` là nullable, \`[]\` là relation/list |
| Default/key/database attributes | \`@id\`, \`@default\`, \`@unique\`, native database type hoặc field mapping |
| Relation attributes | Foreign-key fields, referenced fields và delete/update behavior do \`@relation\` khai báo |
| Model constraints | Composite unique, index, primary key và database table mapping |

Model tồn tại trong schema không tự chứng minh workflow tạo/sửa/xóa đã hoàn chỉnh. Xem [Domain model](/product-specs/domain-model) để biết model được executable code sử dụng trong domain nào.

${sections}
`;
}

const appSource = resolve(argument("--app-source", "../../xbuilding"));
const output = resolve(argument("--output", "reference/data-dictionary.mdx"));
const schemaPath = resolve(appSource, "prisma/schema.prisma");
const schema = readFileSync(schemaPath, "utf8");
const models = parseModels(schema);
const schemaFingerprint = `sha256:${createHash("sha256").update(schema).digest("hex")}`;
writeFileSync(output, renderDictionary(models, schemaFingerprint), "utf8");
process.stdout.write(`Generated ${output} from ${models.length} Prisma models.\n`);
