import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const workbookPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : fs.readdirSync(process.cwd()).find((name) => name.endsWith(".xlsx"));

if (!workbookPath || !fs.existsSync(workbookPath)) {
  throw new Error("No .xlsx workbook found in the workspace root.");
}

const workbook = XLSX.readFile(workbookPath, { cellDates: true });
console.log(`Workbook: ${workbookPath}`);
console.log(`Sheets: ${workbook.SheetNames.length}`);

for (const originalName of workbook.SheetNames) {
  const sheet = workbook.Sheets[originalName];
  const range = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]) : null;
  const rows = range
    ? XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false })
    : [];
  const populated = rows
    .map((row, index) => ({
      row: index + 1,
      cells: row
        .map((cell, column) => ({ column: XLSX.utils.encode_col(column), value: cell }))
        .filter(({ value }) => String(value ?? "").trim() !== ""),
    }))
    .filter(({ cells }) => cells.length > 0);
  const headerRows = populated
    .filter(
      ({ row, cells }) =>
        row <= 25 &&
        cells.length > 1 &&
        cells.some(({ value }) => /อาจารย์|รหัสวิชา|หลักสูตร|FTET|จำนวน|หน่วยกิต|วิธีที่/i.test(String(value))),
    )
    .slice(0, 4);
  console.log(
    JSON.stringify({
      name: originalName,
      trimmedName: originalName.trim(),
      formattedDimensions: range
        ? { rows: range.e.r - range.s.r + 1, columns: range.e.c - range.s.c + 1 }
        : { rows: 0, columns: 0 },
      effectiveDimensions: {
        rows: populated.length,
        columns: Math.max(0, ...populated.flatMap(({ cells }) => cells.map(({ column }) => XLSX.utils.decode_col(column) + 1))),
      },
      headerRows,
      firstRows: populated.slice(0, 7),
    }),
  );
}
