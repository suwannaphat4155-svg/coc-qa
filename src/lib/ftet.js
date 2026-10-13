export const DEFAULT_CONSTANTS = Object.freeze({
  lectureWeight: 2,
  labWeight: 1.5,
  workWeeks: 15,
  weeklyHours: 35,
});

export function calculateFtET(
  { lecture = 0, practical = 0, project = 0, sections = 1, weeks, isCoTeach = false, isCoordinatorLoad = false } = {},
  constants = DEFAULT_CONSTANTS,
) {
  if (isCoTeach || isCoordinatorLoad) return 0;
  const values = [lecture, practical, project, sections, weeks ?? constants.workWeeks];
  if (values.some((value) => !Number.isFinite(Number(value)))) return 0;
  const [lectureHours, practicalHours, projectHours, sectionCount, weekCount] = values.map(Number);
  const denominator = Number(constants.weeklyHours) * Number(constants.workWeeks);
  if (!Number.isFinite(denominator) || denominator <= 0) return 0;
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
  const values = ["comp", "de", "dbiz", "mscomp"].map((program) => {
    const entry = Object.entries(programValues).find(([name]) => name.toLowerCase() === program);
    return entry?.[1];
  });
  if (values.some((value) => value == null || value === "" || !Number.isFinite(Number(value)))) return null;
  return average(values);
}

export function calculateFtes(credits, students, level = "bachelor") {
  const creditValue = Number(credits);
  const studentCount = Number(students);
  const divisor = level === "graduate" ? 12 : 18;
  return Number.isFinite(creditValue * studentCount) ? (creditValue * studentCount) / divisor : 0;
}

export function calculateTeachingLoad(lectureHours, practicalHours, sections = 1) {
  return (Number(lectureHours || 0) + Number(practicalHours || 0) / 2) * Number(sections || 0);
}
