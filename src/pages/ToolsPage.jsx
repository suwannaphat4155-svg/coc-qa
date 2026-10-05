import { useMemo, useState } from "react";
import { GraduationCap } from "lucide-react";
import { useDashboard } from "../context/DashboardContext.jsx";
import { calculateFtes, calculateTeachingLoad } from "../lib/ftet.js";
import { formatFtET, formatCount } from "../lib/format.js";
import { PageHeading, Panel } from "../components/Ui.jsx";

function readGuidelines(snapshot) {
  const tab = snapshot?.workbook?.find(({ name }) => name === "สรุปอาจารย์ที่เหมาะสม");
  if (!tab) return null;
  const headerIndex = tab.rows.findIndex((row) => row.some((cell) => /เกณฑ์อาจารย์ที่เหมาะสม/.test(String(cell ?? ""))));
  if (headerIndex < 0) return null;
  const header = tab.rows[headerIndex];
  const bachelorIndex = header.findIndex((cell) => /ปริญญาตรี/.test(String(cell ?? "")));
  const graduateIndex = header.findIndex((cell) => /บัณฑิตศึกษา/.test(String(cell ?? "")));
  if (bachelorIndex < 0 || graduateIndex < 0) return null;
  const locate = (pattern) => {
    const row = tab.rows.find((item) => pattern.test(String(item[0] ?? "")));
    const valueAt = (index) => Number(String(row?.[index + 1] ?? "").replace(/,/g, ""));
    const bachelor = valueAt(bachelorIndex);
    const graduate = valueAt(graduateIndex);
    return Number.isFinite(bachelor) && Number.isFinite(graduate) && bachelor > 0 && graduate > 0
      ? { bachelor, graduate }
      : null;
  };
  const courses = locate(/อาจารย์\s*:\s*รายวิชา/);
  const students = locate(/อาจารย์\s*:\s*นักศึกษาเต็มเวลา/);
  const teachingLoad = locate(/อาจารย์\s*:\s*ภาระงานสอน/);
  return courses && students && teachingLoad ? { courses, students, teachingLoad, source: tab.name } : null;
}

export default function ToolsPage() {
  const { snapshot } = useDashboard();
  const [credits, setCredits] = useState(3);
  const [students, setStudents] = useState(36);
  const [sections, setSections] = useState(1);
  const [lecture, setLecture] = useState(2);
  const [practical, setPractical] = useState(2);
  const [undergradCourses, setUndergradCourses] = useState(10);
  const [graduateCourses, setGraduateCourses] = useState(9);
  const [undergradStudents, setUndergradStudents] = useState(0);
  const [graduateStudents, setGraduateStudents] = useState(0);
  const [undergradLoad, setUndergradLoad] = useState(0);
  const [graduateLoad, setGraduateLoad] = useState(0);
  const guidelines = useMemo(() => readGuidelines(snapshot), [snapshot]);
  const ftes = calculateFtes(credits, students);
  const load = calculateTeachingLoad(lecture, practical, sections);
  const numberFor = (type, courses, fullTimeStudents, teachingLoad) => {
    if (!guidelines) return null;
    return Math.max(
      Math.ceil(courses / guidelines.courses[type]),
      Math.ceil(fullTimeStudents / guidelines.students[type]),
      Math.ceil(teachingLoad / guidelines.teachingLoad[type]),
    );
  };
  const undergradCount = numberFor("bachelor", undergradCourses, undergradStudents, undergradLoad);
  const graduateCount = numberFor("graduate", graduateCourses, graduateStudents, graduateLoad);

  return <>
    <PageHeading title="เครื่องมือ FTES และอัตรากำลัง" description="คำนวณ FTES/Teaching Load และประมาณจำนวนอาจารย์ที่เหมาะสม โดยอ่านเกณฑ์อัตราส่วนจากแท็บใน workbook ไม่กำหนดค่าเอง" />
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="คำนวณ FTES รายวิชา" subtitle="สูตรจากต้นทาง: (หน่วยกิต × จำนวนนักศึกษา) ÷ 18">
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-slate-500">หน่วยกิต<input className="input mt-1" type="number" min="0" value={credits} onChange={(e) => setCredits(Number(e.target.value))} /></label><label className="text-xs text-slate-500">จำนวนนักศึกษา (คน)<input className="input mt-1" type="number" min="0" value={students} onChange={(e) => setStudents(Number(e.target.value))} /></label></div>
        <div className="mt-4 rounded-xl bg-teal/5 p-4"><div className="text-xs text-slate-500">FTES</div><div className="mt-1 text-3xl font-bold text-teal">{formatFtET(ftes, 3)}</div><div className="mt-2 text-xs text-slate-500">{credits} × {students} ÷ 18 = {formatFtET(ftes, 4)}</div></div>
      </Panel>
      <Panel title="คำนวณ Teaching Load" subtitle="สูตรจากต้นทาง: (ชั่วโมงบรรยาย + ชั่วโมงปฏิบัติ ÷ 2) × section">
        <div className="grid gap-3 sm:grid-cols-3">{[["บรรยาย (ชม.)", lecture, setLecture], ["ปฏิบัติ (ชม.)", practical, setPractical], ["Section", sections, setSections]].map(([label, value, setValue]) => <label key={label} className="text-xs text-slate-500">{label}<input className="input mt-1" type="number" min="0" value={value} onChange={(e) => setValue(Number(e.target.value))} /></label>)}</div>
        <div className="mt-4 rounded-xl bg-blue-50 p-4 dark:bg-blue-400/10"><div className="text-xs text-slate-500">Teaching Load</div><div className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">{formatFtET(load, 2)} ชั่วโมง</div><div className="mt-2 text-xs text-slate-500">({lecture} + {practical}/2) × {sections}</div></div>
      </Panel>
    </div>
    <Panel title="จำนวนอาจารย์ที่เหมาะสม" subtitle={guidelines ? `ใช้เกณฑ์จากแท็บ “${guidelines.source}”` : "เกณฑ์ที่จำเป็นไม่พบในแท็บ source"} className="mt-5">
      {guidelines ? <>
        <div className="grid gap-3 sm:grid-cols-3">{[["จำนวนรายวิชา ป.ตรี", undergradCourses, setUndergradCourses], ["FTES ป.ตรี", undergradStudents, setUndergradStudents], ["Teaching Load ป.ตรี", undergradLoad, setUndergradLoad], ["จำนวนรายวิชา บัณฑิตฯ", graduateCourses, setGraduateCourses], ["FTES บัณฑิตฯ", graduateStudents, setGraduateStudents], ["Teaching Load บัณฑิตฯ", graduateLoad, setGraduateLoad]].map(([label, value, setValue]) => <label key={label} className="text-xs text-slate-500">{label}<input className="input mt-1" type="number" min="0" step="0.1" value={value} onChange={(e) => setValue(Number(e.target.value))} /></label>)}</div>
        <div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5"><div className="text-xs text-slate-500">ปริญญาตรี · จำนวนขั้นต่ำตามเกณฑ์ที่เข้มที่สุด</div><div className="mt-1 flex items-center gap-2 text-3xl font-bold"><GraduationCap className="text-teal" />{formatCount(undergradCount)} คน</div></div><div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5"><div className="text-xs text-slate-500">บัณฑิตศึกษา · จำนวนขั้นต่ำตามเกณฑ์ที่เข้มที่สุด</div><div className="mt-1 flex items-center gap-2 text-3xl font-bold"><GraduationCap className="text-teal" />{formatCount(graduateCount)} คน</div></div></div>
        <div className="mt-4 table-wrap"><table className="data-table"><thead><tr><th>เกณฑ์อัตราส่วน</th><th>ปริญญาตรี</th><th>บัณฑิตศึกษา</th></tr></thead><tbody><tr><td>อาจารย์ : รายวิชา</td><td>1 : {guidelines.courses.bachelor}</td><td>1 : {guidelines.courses.graduate}</td></tr><tr><td>อาจารย์ : FTES</td><td>1 : {guidelines.students.bachelor}</td><td>1 : {guidelines.students.graduate}</td></tr><tr><td>อาจารย์ : Teaching Load</td><td>1 : {guidelines.teachingLoad.bachelor}</td><td>1 : {guidelines.teachingLoad.graduate}</td></tr></tbody></table></div>
        <p className="mt-3 text-xs text-slate-400">จำนวนอาจารย์ = ค่าสูงสุดของ ceil(รายวิชา/เกณฑ์), ceil(FTES/เกณฑ์) และ ceil(Teaching Load/เกณฑ์) แยกระดับการศึกษา · ตรวจตัวเลขและบริบทก่อนใช้วางแผนอัตรากำลังจริง</p>
      </> : <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">ไม่พบอัตราส่วนจาก workbook จึงไม่แสดงผลประมาณจำนวนอาจารย์ เพื่อหลีกเลี่ยงการใช้เกณฑ์ hardcode</div>}
    </Panel>
  </>;
}
