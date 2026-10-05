export const DEFAULT_CONSTANTS = Object.freeze({
  lectureWeight: 2,
  labWeight: 1.5,
  workWeeks: 15,
  weeklyHours: 35,
});

export function calculateFtET(
  { lecture = 0, practical = 0, project = 0, sections = 1, weeks } = {},
  constants = DEFAULT_CONSTANTS,
) {
  const values = [lecture, practical, project, sections, weeks ?? constants.workWeeks];
  if (values.some((value) => !Number.isFinite(Number(value)))) return 0;
  const [lectureHours, practicalHours, projectHours, sectionCount, weekCount] = values.map(Number);
  const denominator = Number(constants.weeklyHours) * Number(constants.workWeeks);
  if (!denominator) return 0;
  return (
    ((lectureHours * Number(constants.lectureWeight) +
      practicalHours * Number(constants.labWeight) +
      projectHours) *
      sectionCount *
      weekCount) /
    denominator
  );
}

export function calculateTeacherFtET(rows) {
  return rows.reduce((total, row) => total + (Number(row.ftet) || 0), 0);
}

export function average(values) {
  const numbers = values.filter((value) => value != null && value !== "").map(Number).filter(Number.isFinite);
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null;
}

export function averageCollegeFtET(programValues) {
  const collegePrograms = new Set(["comp", "de", "dbiz", "mscomp"]);
  return average(
    Object.entries(programValues)
      .filter(([program, value]) => value != null && value !== "" && collegePrograms.has(program.toLowerCase()) && Number.isFinite(Number(value)))
      .map(([, value]) => value),
  );
}

export function calculateFtes(credits, students) {
  const creditValue = Number(credits);
  const studentCount = Number(students);
  return Number.isFinite(creditValue * studentCount) ? (creditValue * studentCount) / 18 : 0;
}

export function calculateTeachingLoad(lectureHours, practicalHours, sections = 1) {
  return (Number(lectureHours || 0) + Number(practicalHours || 0) / 2) * Number(sections || 0);
}
