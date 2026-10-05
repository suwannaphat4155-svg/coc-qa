import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useDashboard } from "../context/DashboardContext.jsx";
import { getPrimaryDetails, getSubjectRows } from "../lib/analytics.js";
import { formatCount, formatFtET, formatYear } from "../lib/format.js";
import { ExportButton, PageHeading, Panel } from "../components/Ui.jsx";

export default function SubjectsPage() {
  const { snapshot, settings } = useDashboard();
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("ทั้งหมด");
  const [flag, setFlag] = useState("ทั้งหมด");
  const [sortBy, setSortBy] = useState("ftet");
  const subjects = getSubjectRows(getPrimaryDetails(snapshot));
  const programs = [...new Set(subjects.flatMap((row) => row.programs))].sort();
  const visible = useMemo(() => subjects.filter((row) => {
    const matchesText = `${row.courseCode} ${row.subject} ${row.teachers.join(" ")}`.toLowerCase().includes(search.toLowerCase());
    const matchesProgram = program === "ทั้งหมด" || row.programs.some((item) => item.toLowerCase() === program.toLowerCase());
    const matchesFlag = flag === "ทั้งหมด" || (flag === "เรียนร่วม" && row.coTeach) || (flag === "ประสานงาน" && row.coordinator) || (flag === "โครงงาน" && row.isProject);
    return matchesText && matchesProgram && matchesFlag;
  }).sort((a, b) => sortBy === "subject" ? a.subject.localeCompare(b.subject) : (b[sortBy] ?? 0) - (a[sortBy] ?? 0)), [subjects, search, program, flag, sortBy]);
  const exportRows = [["ปี", "เทอม", "รหัสวิชา", "ชื่อวิชา", "FTET รวม", "จำนวนอาจารย์", "หลักสูตร", "เรียนร่วม", "ประสานงาน", "โครงงาน"], ...visible.map((row) => [row.year, row.semester, row.courseCode, row.subject, row.ftet, row.teachers.length, row.programs.join("; "), row.coTeach, row.coordinator, row.isProject])];

  return <>
    <PageHeading title="รายวิชาและภาระการสอน" description="ค้นหาและกรองรายวิชาจากแถวรายละเอียด แสดงโหลดรวมจากอาจารย์ที่สอน พร้อมธงเรียนร่วม/ประสานงาน/โครงงาน" action={<ExportButton filename="coc-subjects.csv" rows={exportRows} />} />
    <Panel title="ค้นหารายวิชา" className="mb-5">
      <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <label className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input className="input pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="รหัสวิชา ชื่อวิชา หรืออาจารย์" /></label>
        <select className="input" value={program} onChange={(event) => setProgram(event.target.value)}><option>ทั้งหมด</option>{programs.map((item) => <option key={item}>{item}</option>)}</select>
        <select className="input" value={flag} onChange={(event) => setFlag(event.target.value)}><option>ทั้งหมด</option><option>เรียนร่วม</option><option>ประสานงาน</option><option>โครงงาน</option></select>
        <select className="input" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="ftet">เรียง FTET มาก→น้อย</option><option value="lecture">เรียงชั่วโมงบรรยาย</option><option value="subject">เรียงชื่อวิชา</option></select>
      </div>
    </Panel>
    <Panel title="ตารางรายวิชา" subtitle={`${formatCount(visible.length)} รายการ · ผลรวม FTET จัดกลุ่มตามปีและเทอม`}>
      <div className="table-wrap max-h-[620px]"><table className="data-table"><thead className="sticky top-0 bg-white dark:bg-[#14243a]"><tr><th>ปี/เทอม</th><th>รหัส</th><th>รายวิชา</th><th>อาจารย์</th><th>หลักสูตร</th><th>บรรยาย/ปฏิบัติ/โครงงาน</th><th>โหลดรวม</th><th>ธงข้อมูล</th></tr></thead><tbody>{visible.map((row, index) => <tr key={`${row.year}-${row.semester}-${row.courseCode}-${row.subject}-${index}`}><td>{formatYear(row.year, settings.yearFormat === "buddhist")}/{row.semester}</td><td className="font-medium">{row.courseCode || "—"}</td><td className="max-w-[300px] truncate" title={row.subject}>{row.subject || "—"}</td><td>{row.teachers.length}</td><td>{row.programs.join(", ") || "—"}</td><td>{row.lecture}/{row.practical}/{row.project}</td><td className="font-semibold">{formatFtET(row.ftet)}</td><td className="flex flex-wrap gap-1.5">{row.coTeach && <span className="badge bg-blue-50 text-blue-700">เรียนร่วม</span>}{row.coordinator && <span className="badge bg-amber-50 text-amber-700">ประสานงาน</span>}{row.isProject && <span className="badge bg-violet-50 text-violet-700">โครงงาน</span>}</td></tr>)}</tbody></table>{!visible.length && <p className="p-8 text-center text-sm text-slate-400">ไม่พบรายวิชาที่ตรงกับตัวกรอง</p>}</div>
      <p className="mt-3 text-[11px] leading-5 text-slate-400">การรวมโหลดแสดงผลตามรหัส/ชื่อวิชาในแต่ละปีและเทอม จึงไม่รวมคนละภาคการศึกษาเข้าด้วยกัน · FTET รายแถวจากสูตรคำนวณใหม่</p>
    </Panel>
  </>;
}
