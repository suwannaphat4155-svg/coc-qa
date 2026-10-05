import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";
import { normalizeWorkbook } from "../src/lib/normalize.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workbookPath = process.env.FTET_WORKBOOK
  ? path.resolve(root, process.env.FTET_WORKBOOK)
  : fs.readdirSync(root).find((name) => name.toLowerCase().endsWith(".xlsx"));

if (!workbookPath || !fs.existsSync(workbookPath)) {
  throw new Error("ไม่พบไฟล์ .xlsx ในโฟลเดอร์หลัก กำหนด FTET_WORKBOOK เพื่อระบุไฟล์");
}

const workbook = XLSX.readFile(workbookPath, { cellDates: true });
const tabs = workbook.SheetNames.map((originalName) => {
  const sheet = workbook.Sheets[originalName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });
  while (rows.length && !rows.at(-1).some((cell) => String(cell ?? "").trim())) rows.pop();
  return { name: originalName.trim(), originalName, rows };
});
const snapshot = normalizeWorkbook(tabs);
snapshot.workbookPath = path.basename(workbookPath);
snapshot.tabCount = tabs.length;
const outputPath = path.join(root, "public", "data", "snapshot.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(snapshot)}\n`, "utf8");
console.log(`ซิงก์ ${snapshot.tabCount} แท็บ (${snapshot.details.length.toLocaleString("th-TH")} แถวรายละเอียด) -> ${path.relative(root, outputPath)}`);
