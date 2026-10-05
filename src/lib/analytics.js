import { average, averageCollegeFtET, calculateTeacherFtET } from "./ftet.js";

const canonicalProgram = (program) => (String(program).toLowerCase() === "dbiz" ? "Dbiz" : program);

export function getAnnualSeries(snapshot) {
  const records = snapshot?.summaries?.annual ?? [];
  const legacy = (snapshot?.summaries?.legacy ?? []).filter((record) => record.year === 2561 && record.semester == null);
  const grouped = new Map();
  records.forEach((record) => {
    if (record.semester != null) return;
    const program = canonicalProgram(record.program);
    const key = `${record.year}:${program}`;
    grouped.set(key, record.value);
  });
  legacy.forEach(({ year, program, value }) => grouped.set(`${year}:${program}`, value));
  const years = [...new Set([...records, ...legacy].map(({ year }) => year).filter(Boolean))].sort((a, b) => a - b);
  const programs = ["Comp", "DE", "Dbiz", "AISE", "MsComp"];
  const data = years.map((year) => {
    const row = { year };
    programs.forEach((program) => {
      row[program] = grouped.get(`${year}:${program}`) ?? null;
    });
    const sourceCollege = grouped.get(`${year}:CoC`);
    row.CoC = year === 2561 && sourceCollege != null ? sourceCollege : averageCollegeFtET(row);
    return row;
  });
  return { years, programs: [...programs, "CoC"], data };
}

export function getTermSeries(snapshot) {
  const records = snapshot?.summaries?.terms ?? [];
  const legacy = (snapshot?.summaries?.legacy ?? []).filter((record) => record.year === 2561 && record.semester != null);
  const grouped = new Map();
  [...records, ...legacy].forEach((record) => {
    const program = canonicalProgram(record.program);
    if (record.semester == null || !record.year) return;
    const key = `${record.year}:${record.semester}`;
    const row = grouped.get(key) ?? { year: record.year, semester: record.semester };
    row[program] = record.value;
    grouped.set(key, row);
  });
  const data = [...grouped.values()].sort((a, b) => a.year - b.year || a.semester - b.semester);
  data.forEach((row) => {
    row.CoC = averageCollegeFtET(row);
    row.period = `${row.year}_${row.semester}`;
  });
  return { data, programs: ["Comp", "DE", "Dbiz", "AISE", "MsComp", "CoC"] };
}

export function getPrimaryDetails(snapshot) {
  const records = (snapshot?.details ?? []).filter((record) => {
    const sheetName = record.sourceSheet ?? "";
    return /^FTET|^FTE_/.test(sheetName) && !/Met\d|วิชาโปรเจค|วิชาบรรยาย/.test(sheetName);
  });
  const genericTerms = new Set(
    records
      .filter((record) => record.year !== 2561 && !/(?:^|[_ -])(Comp|DE|DBiz|Dbiz|AISE|MsComp|IT|SE|EBiz)(?:$|[_ -])/i.test(record.sourceSheet))
      .map((record) => `${record.year}:${record.semester}`),
  );
  return records.filter((record) => {
    if (record.year === 2561) {
      return /(?:^|[_ -])(IT|SE|EBiz)(?:$|[_ -])/i.test(record.sourceSheet);
    }
    return genericTerms.has(`${record.year}:${record.semester}`)
      ? !/(?:^|[_ -])(Comp|DE|DBiz|Dbiz|AISE|MsComp|IT|SE|EBiz)(?:$|[_ -])/i.test(record.sourceSheet)
      : true;
  });
}

export function aggregateTeachers(records) {
  const groups = new Map();
  records.forEach((row) => {
    const key = `${row.teacher}|${row.year}|${row.semester}`;
    const group = groups.get(key) ?? {
      teacher: row.teacher,
      year: row.year,
      semester: row.semester,
      ftet: 0,
      subjects: [],
      lecture: 0,
      practical: 0,
      project: 0,
      programs: new Set(),
      rows: [],
    };
    group.ftet += Number(row.ftet) || 0;
    group.lecture += Number(row.lecture) || 0;
    group.practical += Number(row.practical) || 0;
    group.project += Number(row.project) || 0;
    (row.programs ?? []).forEach((program) => group.programs.add(program));
    group.subjects.push(row.subject || row.courseCode);
    group.rows.push(row);
    groups.set(key, group);
  });
  return [...groups.values()].map((group) => ({
    ...group,
    programs: [...group.programs],
    subjects: [...new Set(group.subjects.filter(Boolean))],
  }));
}

export function getLatestTermTeacherStats(records) {
  const groups = aggregateTeachers(records);
  const latestYear = Math.max(0, ...groups.map(({ year }) => year ?? 0));
  const latestSemester = Math.max(0, ...groups.filter(({ year }) => year === latestYear).map(({ semester }) => semester ?? 0));
  return groups.filter(({ year, semester }) => year === latestYear && semester === latestSemester);
}

export function getSubjectRows(records) {
  const groups = new Map();
  records.forEach((row) => {
    const key = `${row.year ?? ""}|${row.semester ?? ""}|${row.courseCode}|${row.subject}`;
    const item = groups.get(key) ?? {
      year: row.year,
      semester: row.semester,
      courseCode: row.courseCode,
      subject: row.subject,
      ftet: 0,
      teachers: new Set(),
      programs: new Set(),
      lecture: 0,
      practical: 0,
      project: 0,
      coTeach: false,
      coordinator: false,
    };
    item.ftet += Number(row.ftet) || 0;
    if (row.teacher) item.teachers.add(row.teacher);
    (row.programs ?? []).forEach((program) => item.programs.add(program));
    item.lecture += Number(row.lecture) || 0;
    item.practical += Number(row.practical) || 0;
    item.project += Number(row.project) || 0;
    item.coTeach ||= row.isCoTeach;
    item.coordinator ||= row.isCoordinatorLoad;
    groups.set(key, item);
  });
  return [...groups.values()].map((row) => ({
    ...row,
    teachers: [...row.teachers],
    programs: [...row.programs],
    isProject: row.project > 0,
  }));
}

export function summarizeDetailAvailability(snapshot) {
  return (snapshot?.missingDetailYears ?? []).map((year) => ({
    year,
    label: `${year}`,
    available: (snapshot?.details ?? []).some((row) => row.year === year),
  }));
}

export function calculateSummaryDiff(snapshot) {
  const annual = getAnnualSeries(snapshot);
  const legacy = snapshot?.summaries?.legacy ?? [];
  const differences = [];
  legacy.forEach((oldRow) => {
    const year = oldRow.year;
    if (!year || oldRow.semester != null) return;
    const current = annual.data.find((row) => row.year === year)?.[canonicalProgram(oldRow.program)];
    if (current == null) return;
    differences.push({
      year,
      program: oldRow.program,
      legacy: oldRow.value,
      current,
      difference: current - oldRow.value,
    });
  });
  return differences;
}

export function getCollegeLatestValue(snapshot) {
  const { data } = getAnnualSeries(snapshot);
  return data.at(-1)?.CoC ?? null;
}

export function getTeacherYearTrend(records, teacher) {
  return aggregateTeachers(records)
    .filter((row) => row.teacher === teacher)
    .reduce((result, row) => {
      if (!row.year) return result;
      const entry = result.find((item) => item.year === row.year);
      if (entry) entry.ftet += row.ftet;
      else result.push({ year: row.year, ftet: row.ftet });
      return result;
    }, [])
    .sort((a, b) => a.year - b.year);
}

export function groupTeacherRows(records) {
  return aggregateTeachers(records).reduce((list, item) => {
    const existing = list.find((row) => row.teacher === item.teacher && row.year === item.year);
    if (existing) {
      existing.ftet += item.ftet;
      existing.semesters += 1;
    } else {
      list.push({ teacher: item.teacher, year: item.year, ftet: item.ftet, semesters: 1 });
    }
    return list;
  }, []);
}

export function calculateYearChange(rows) {
  if (rows.length < 2) return null;
  return rows.at(-1).CoC - rows.at(-2).CoC;
}

export function teacherMean(records) {
  return average(records.map((record) => calculateTeacherFtET(record.rows)));
}
