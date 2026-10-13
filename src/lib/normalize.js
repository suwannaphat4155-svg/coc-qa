import { calculateFtET, averageCollegeFtET } from "./ftet.js";
import { teacherAliases } from "../config/aliases.js";

const TEXT_ZERO_PATTERNS = {
  isCoTeach: /เรียนร่วมกับ/i,
  isCoordinatorLoad: /คิดโหลดประสานงาน|ประสานงาน/i,
};

const normalizeText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const isRefError = (value) => /#REF!|#VALUE!|#N\/A/i.test(String(value ?? ""));
const parseNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = normalizeText(value).replace(/,/g, "");
  if (!text || isRefError(text) || Object.values(TEXT_ZERO_PATTERNS).some((pattern) => pattern.test(text))) return 0;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function normalizeTeacherName(value) {
  let name = normalizeText(value)
    .replace(/\*/g, "")
    .replace(/:\s*$/, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return teacherAliases[name] ?? name;
}

function populated(row) {
  return Array.isArray(row) && row.some((cell) => normalizeText(cell) !== "");
}

function discoverColumns(rows) {
  const top = rows.slice(0, 25);
  const headerRow = top.findIndex(
    (row) =>
      row.some((cell) => /^อาจารย์$/.test(normalizeText(cell))) &&
      row.some((cell) => /^FTET$/i.test(normalizeText(cell))),
  );
  const primary = headerRow >= 0 ? rows[headerRow] ?? [] : [];
  const secondary = headerRow >= 0 ? rows[headerRow + 1] ?? [] : [];
  const findIn = (row, pattern) => row.findIndex((cell) => pattern.test(normalizeText(cell)));
  const findPrimaryOrSecondary = (pattern) => {
    const primaryIndex = findIn(primary, pattern);
    return primaryIndex >= 0 ? primaryIndex : findIn(secondary, pattern);
  };
  const specific = (pattern) => findIn(secondary, pattern);
  return {
    headerRow: headerRow >= 0 ? headerRow : -1,
    teacher: findPrimaryOrSecondary(/^อาจารย์$/),
    code: findPrimaryOrSecondary(/รหัสวิชา/),
    subject: findPrimaryOrSecondary(/ชื่อวิชา/),
    credit: specific(/หน่วยกิต/),
    section: specific(/^section$/i),
    lecture: specific(/ชั่วโมงบรรยาย/),
    practical: specific(/ชั่วโมงปฏิบัติ/),
    project: specific(/โครงงาน/),
    weeks: specific(/สัปดาห์/),
    ftet: findPrimaryOrSecondary(/^FTET$/i),
    ftets: findPrimaryOrSecondary(/^FTETS$/i),
    department: findPrimaryOrSecondary(/^สาขา$/),
    cohort: findPrimaryOrSecondary(/ชั้นปี|รุ่น|หลักสูตร/),
  };
}

function parseYearAndSemester(name) {
  const yearMatch = name.match(/(25\d{2})/);
  const semesterMatch = name.match(/(?:^|[_-])([12])(?:[_-]|$)/);
  return {
    year: yearMatch ? Number(yearMatch[1]) : null,
    semester: semesterMatch ? Number(semesterMatch[1]) : null,
  };
}

function sourceProgram(name) {
  const match = name.match(/(?:^|[_ -])(Comp|DE|DBiz|Dbiz|AISE|MsComp|IT|SE|EBiz)(?:$|[_ -])/i);
  if (!match) return null;
  const value = match[1].toLowerCase();
  return { comp: "Comp", de: "DE", dbiz: "Dbiz", aise: "AISE", mscomp: "MsComp", it: "IT", se: "SE", ebiz: "EBiz" }[value] ?? match[1];
}

function numericOrNull(value) {
  if (value == null || normalizeText(value) === "" || isRefError(value)) return null;
  const num = parseNumber(value);
  return Number.isFinite(num) ? num : null;
}

function inferWeeks(subject, courseCode) {
  const label = `${subject} ${courseCode}`.toLowerCase();
  if (/\bmid[\s-]?term\b|\bfinal\b|กลางภาค|ปลายภาค|ครึ่งภาค/i.test(label)) return 8;
  if (/\bmodule\b|โมดูล/i.test(label)) return 5;
  return null;
}

function normalizeDetail(name, rows) {
  const columns = discoverColumns(rows);
  if (columns.headerRow < 0 || columns.teacher < 0) return [];
  const { year, semester } = parseYearAndSemester(name);
  const defaultProgram = sourceProgram(name);
  const records = [];
  let currentTeacher = "";
  let currentTeacherRaw = "";
  const startAt = Math.max(columns.headerRow + 1, 0);
  for (let rowIndex = startAt; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];
    if (!populated(row)) continue;
    const candidate = normalizeText(row[columns.teacher]);
    if (candidate) {
      currentTeacherRaw = candidate;
      currentTeacher = normalizeTeacherName(candidate);
    }
    const courseCode = normalizeText(row[columns.code]);
    const subject = normalizeText(row[columns.subject]);
    const rawValues = [row[columns.lecture], row[columns.practical], row[columns.project], row[columns.section]];
    const hasLoad = rawValues.some((value) => normalizeText(value) !== "");
    if (!currentTeacher || (!courseCode && !subject && !hasLoad)) continue;
    const flags = {
      isCoTeach: row.some((value) => TEXT_ZERO_PATTERNS.isCoTeach.test(normalizeText(value))),
      isCoordinatorLoad: row.some((value) => TEXT_ZERO_PATTERNS.isCoordinatorLoad.test(normalizeText(value))),
      isRefError: row.some(isRefError),
    };
    const lecture = parseNumber(row[columns.lecture]);
    const practical = parseNumber(row[columns.practical]);
    const project = parseNumber(row[columns.project]);
    const sections = numericOrNull(row[columns.section]) ?? 1;
    const sourceWeeks = numericOrNull(row[columns.weeks]);
    const weeks = inferWeeks(subject, courseCode) ?? (sourceWeeks != null && sourceWeeks > 0 ? sourceWeeks : 15);
    const teacherFtets = numericOrNull(row[columns.ftets]);
    const departments = normalizeText(row[columns.department] ?? "")
      .split(/[,،/]/)
      .map((value) => value.trim())
      .filter(Boolean);
    records.push({
      id: `${name}:${rowIndex + 1}`,
      sourceSheet: name,
      sourceRow: rowIndex + 1,
      year,
      semester,
      teacher: currentTeacher,
      teacherRaw: currentTeacherRaw,
      courseCode,
      subject,
      creditsText: normalizeText(row[columns.credit]),
      section: sections,
      lecture,
      practical,
      project,
      weeks,
      ftet: calculateFtET({
        lecture,
        practical,
        project,
        sections,
        weeks,
        isCoTeach: flags.isCoTeach,
        isCoordinatorLoad: flags.isCoordinatorLoad,
      }),
      sourceFtET: numericOrNull(row[columns.ftet]),
      sourceFtets: teacherFtets,
      programs: departments.length ? departments : defaultProgram ? [defaultProgram] : [],
      rawProgram: normalizeText(row[columns.department] ?? ""),
      isCoTeach: flags.isCoTeach,
      isCoordinatorLoad: flags.isCoordinatorLoad,
      isRefError: flags.isRefError,
    });
  }
  return records;
}

function normalizeSummary(sheet, kind) {
  const rows = sheet.rows ?? [];
  const headingIndex = rows.findIndex((row) => row.some((cell) => /หลักสูตร|program/i.test(normalizeText(cell))));
  if (headingIndex < 0) return [];
  const headers = rows[headingIndex] ?? [];
  const output = [];
  for (let index = headingIndex + 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const program = normalizeText(row.find((cell, col) => col === 0 && normalizeText(cell)));
    if (!program || !/^(CoC|Comp|DE|Dbiz|DBiz|AISE|MsComp|IT|SE|EBiz)$/i.test(program)) continue;
    for (let column = 1; column < Math.max(headers.length, row.length); column += 1) {
      const header = normalizeText(headers[column]);
      const value = numericOrNull(row[column]);
      if (!header || value == null) continue;
      const year = Number(header.match(/25\d{2}/)?.[0]) || null;
      const semester = Number(header.match(/(?:^|[_-])([12])(?:$|[_-])/i)?.[1]) || null;
      const isAverage = /AVG|Average|เฉลี่ย/i.test(header);
      output.push({
        sourceSheet: sheet.name,
        kind,
        program,
        year,
        semester: isAverage ? null : semester,
        period: header,
        value,
      });
    }
  }
  return output;
}

export function normalizeWorkbook(tabs, generatedAt = new Date().toISOString()) {
  const normalizedTabs = tabs.map((tab) => ({
    ...tab,
    name: normalizeText(tab.name),
    rows: (tab.rows ?? []).map((row) => (Array.isArray(row) ? row.map((cell) => (cell == null ? null : String(cell))) : [])),
  }));
  const details = normalizedTabs.flatMap((tab) => normalizeDetail(tab.name, tab.rows));
  const annual = normalizedTabs.flatMap((tab) =>
    /62-67 สรุป FTE-All$/.test(tab.name) ? normalizeSummary(tab, "annual") : [],
  );
  const terms = normalizedTabs.flatMap((tab) =>
    /62-67 สรุป FTE-All -เทอม/.test(tab.name) ? normalizeSummary(tab, "term") : [],
  );
  const legacy = normalizedTabs.flatMap((tab) => (/สรุป FTET/.test(tab.name) ? normalizeSummary(tab, "legacy") : []));
  const computedCollege = [];
  for (const year of [...new Set(annual.map(({ year: value }) => value).filter(Boolean))]) {
    const entries = Object.fromEntries(
      annual.filter((entry) => entry.year === year && entry.semester == null).map(({ program, value }) => [program, value]),
    );
    const value = averageCollegeFtET(entries);
    if (value != null) computedCollege.push({ year, value });
  }
  return {
    generatedAt,
    workbook: normalizedTabs.map(({ name, rows }) => ({
      name,
      rowCount: rows.filter(populated).length,
      columnCount: Math.max(0, ...rows.map((row) => row.filter((cell) => cell != null && normalizeText(cell)).length)),
      rows,
    })),
    summaries: { annual, terms, legacy, computedCollege },
    details,
    missingDetailYears: [2564, 2565, 2566],
  };
}

export function parseCsv(text) {
  const result = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) result.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(value);
  if (row.some((cell) => cell.trim())) result.push(row);
  return result;
}

export { numericOrNull, parseYearAndSemester };
