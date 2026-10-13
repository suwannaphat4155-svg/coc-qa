import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Search } from "lucide-react";
import { useDashboard } from "../context/DashboardContext.jsx";
import { aggregateTeachers, getAnnualSeries, getPrimaryDetails, getTeacherYearTrend } from "../lib/analytics.js";
import { formatFtET, formatYear } from "../lib/format.js";
import { ChartTooltip, PageHeading, Panel } from "../components/Ui.jsx";

const programColor = { comp: "#39aebe", de: "#66bdad", dbiz: "#e8b66a", mscomp: "#d991ad", aise: "#9c89d8" };
const canonicalProgram = (value) => ({
  comp: "Comp",
  de: "DE",
  dbiz: "Dbiz",
  aise: "AISE",
  mscomp: "MsComp",
  it: "IT",
  se: "SE",
  ebiz: "EBiz",
}[String(value ?? "").toLowerCase()] ?? value);
const matchesProgram = (row, program) => program === "all" || (row.programs ?? []).some((item) => String(item).toLowerCase() === program.toLowerCase());

export default function TeachersPage() {
  const { snapshot, settings } = useDashboard();
  const [search, setSearch] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedYear, setSelectedYear] = useState("latest");
  const [selectedSemester, setSelectedSemester] = useState("latest");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const allDetails = getPrimaryDetails(snapshot);
  const years = [...new Set([...allDetails.map(({ year }) => year), ...getAnnualSeries(snapshot).years].filter(Boolean))].sort((a, b) => a - b);
  const programs = [...new Set(allDetails.flatMap(({ programs: rowPrograms }) => rowPrograms ?? []).map(canonicalProgram))].sort();
  const latestYear = years.at(-1);
  const activeYear = selectedYear === "latest" ? latestYear : selectedYear === "all" ? null : Number(selectedYear);
  const programRows = allDetails.filter((row) => matchesProgram(row, selectedProgram) && (activeYear == null || row.year === activeYear));
  const semesters = [1, 2];
  const activeSemester = selectedSemester === "latest"
    ? semesters.at(-1)
    : selectedSemester === "all" ? null : Number(selectedSemester);
  const filteredRows = programRows.filter((row) => activeSemester == null || row.semester === activeSemester);
  const ranking = aggregateTeachers(filteredRows).reduce((groups, row) => {
    const group = groups.get(row.teacher) ?? { teacher: row.teacher, ftet: 0, programs: new Set() };
    group.ftet += row.ftet;
    row.programs.forEach((program) => group.programs.add(canonicalProgram(program)));
    groups.set(row.teacher, group);
    return groups;
  }, new Map());
  const result = [...ranking.values()]
    .map((row) => ({ ...row, programs: [...row.programs] }))
    .filter((row) => row.teacher.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.ftet - a.ftet);
  const teacherNames = [...new Set(filteredRows.map(({ teacher }) => teacher))].sort();
  const selected = teacherNames.includes(selectedTeacher) ? selectedTeacher : result[0]?.teacher ?? teacherNames[0] ?? "";
  const subjectRows = filteredRows
    .filter((row) => row.teacher === selected)
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || (a.semester ?? 0) - (b.semester ?? 0));
  const trendRows = allDetails.filter((row) => row.teacher === selected
    && matchesProgram(row, selectedProgram)
    && (activeSemester == null || row.semester === activeSemester));
  const trend = getTeacherYearTrend(trendRows, selected);
  const histogram = useMemo(() => {
    const buckets = new Map();
    result.forEach(({ ftet }) => {
      const low = Math.floor(ftet * 10) / 10;
      const label = `${low.toFixed(1)}–${(low + 0.1).toFixed(1)}`;
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    });
    return [...buckets.entries()].map(([range, count]) => ({ range, count }));
  }, [result]);
  const filterLabel = `${activeYear == null ? "ทุกปี" : formatYear(activeYear, settings.yearFormat === "buddhist")}${activeSemester == null ? " · ทุกภาค" : ` · ภาค ${activeSemester}`}${selectedProgram === "all" ? "" : ` · ${selectedProgram}`}`;
  const totalFtET = subjectRows.reduce((total, row) => total + row.ftet, 0);
  const uncoveredSelectedYear = activeYear != null && years.includes(activeYear)
    && !allDetails.some((row) => row.year === activeYear);

  return <>
    <PageHeading title="ภาระการสอนรายอาจารย์" description="กรองตามปีการศึกษา ภาคเรียน และหลักสูตร เพื่อดู FTET ที่คำนวณจากรายวิชา พร้อมรายละเอียดและแนวโน้มย้อนหลัง" />
    <Panel title="ตัวกรองข้อมูล" subtitle="ค่าเริ่มต้นแสดงปีและภาคล่าสุดที่มีรายละเอียด" className="mb-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs text-slate-500">ปีการศึกษา<select className="input mt-1" value={selectedYear} onChange={(event) => { setSelectedYear(event.target.value); setSelectedSemester("latest"); }}><option value="latest">ปีล่าสุด ({latestYear ?? "—"})</option><option value="all">ทุกปี</option>{years.map((year) => <option value={year} key={year}>{formatYear(year, settings.yearFormat === "buddhist")}</option>)}</select></label>
        <label className="text-xs text-slate-500">ภาคการศึกษา<select className="input mt-1" value={selectedSemester} onChange={(event) => setSelectedSemester(event.target.value)}><option value="latest">ภาคล่าสุด</option><option value="all">ทุกภาค</option>{semesters.map((semester) => <option value={semester} key={semester}>ภาค {semester}</option>)}</select></label>
        <label className="text-xs text-slate-500">หลักสูตร<select className="input mt-1" value={selectedProgram} onChange={(event) => setSelectedProgram(event.target.value)}><option value="all">ทุกหลักสูตร</option>{programs.map((program) => <option value={program} key={program}>{program}</option>)}</select></label>
        <label className="relative text-xs text-slate-500">ค้นหาอาจารย์<span className="absolute left-3 top-9 text-slate-400"><Search size={16} /></span><input className="input mt-1 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="พิมพ์ชื่ออาจารย์" /></label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>ตัวกรองที่ใช้: {filterLabel}</span><span>เกณฑ์ FTET: <b className="text-slate-700 dark:text-slate-200">{formatFtET(settings.teacherThreshold, 3)}</b></span></div>
    </Panel>
    {uncoveredSelectedYear && <div role="status" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">ปี {formatYear(activeYear, settings.yearFormat === "buddhist")} มีข้อมูลสรุปหลักสูตร แต่ไม่มีข้อมูล FTET รายอาจารย์ในไฟล์ต้นทาง</div>}
    <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
      <Panel title="FTET รวมรายอาจารย์" subtitle={`${filterLabel} · ${result.length} อาจารย์`}>
        <div className="h-[330px]">{result.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={result.slice(0, 20)} layout="vertical" margin={{ left: 5, right: 24, top: 4 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#edf0f2" /><XAxis type="number" /><YAxis type="category" dataKey="teacher" width={145} tick={{ fontSize: 10 }} /><Tooltip content={<ChartTooltip unit="" />} /><Legend /><Bar dataKey="ftet" name="FTET รวมรายวิชา" radius={[0, 5, 5, 0]}>{result.slice(0, 20).map((row) => <Cell key={row.teacher} fill={row.ftet > settings.teacherThreshold ? "#d97878" : programColor[String(row.programs[0] ?? "").toLowerCase()] ?? "#7a9bb2"} />)}</Bar></BarChart></ResponsiveContainer> : <p className="pt-16 text-center text-sm text-slate-400">ไม่พบข้อมูลรายอาจารย์ที่ตรงกับตัวกรอง</p>}</div>
      </Panel>
      <Panel title="การกระจาย FTET" subtitle="จำนวนอาจารย์ในแต่ละช่วงของตัวกรอง">
        <div className="h-[330px]">{histogram.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={histogram}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f2" /><XAxis dataKey="range" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="count" name="จำนวนอาจารย์" fill="#8fc9c4" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="pt-16 text-center text-sm text-slate-400">ไม่มีข้อมูลสำหรับทำ histogram</p>}</div>
      </Panel>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.4fr]">
      <Panel title="สรุปอาจารย์" subtitle="สรุปตามตัวกรองที่เลือก">
        <label className="text-xs text-slate-500">เลือกอาจารย์<select className="input mt-1" value={selected} onChange={(event) => setSelectedTeacher(event.target.value)}><option value="">เลือกอาจารย์</option>{teacherNames.map((name) => <option value={name} key={name}>{name}</option>)}</select></label>
        {selected && <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-white/5"><div className="font-semibold">{selected}</div><div className="mt-1 text-xs text-slate-500">{subjectRows.length} รายการสอน · {new Set(subjectRows.map(({ sourceSheet }) => sourceSheet)).size} แท็บ</div><div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-3 dark:border-white/10"><span className="text-xs text-slate-500">FTET รวมในช่วงที่เลือก</span><b className="text-xl text-teal">{formatFtET(totalFtET, 3)}</b></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><span>บรรยาย <b>{subjectRows.reduce((sum, row) => sum + row.lecture, 0)}</b> ชม.</span><span>ปฏิบัติ <b>{subjectRows.reduce((sum, row) => sum + row.practical, 0)}</b> ชม.</span><span>โครงงาน <b>{subjectRows.reduce((sum, row) => sum + row.project, 0)}</b></span></div></div>}
      </Panel>
      <Panel title="แนวโน้ม FTET รายบุคคล" subtitle={`${selected || "เลือกอาจารย์"} · ตามหลักสูตรและภาคที่เลือกในทุกปีที่มีข้อมูล`}>
        <div className="h-[250px]">{trend.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f2" /><XAxis dataKey="year" tickFormatter={(year) => formatYear(year, settings.yearFormat === "buddhist")} /><YAxis /><Tooltip content={<ChartTooltip unit="" />} /><Legend /><Line type="monotone" dataKey="ftet" name="FTET ต่อภาค" stroke="#8f83ca" strokeWidth={2.5} dot={{ r: 4 }} /></LineChart></ResponsiveContainer> : <p className="pt-16 text-center text-sm text-slate-400">ไม่มีข้อมูลแนวโน้มสำหรับอาจารย์ที่เลือก</p>}</div>
      </Panel>
    </div>
    <Panel title="รายการรายวิชา" subtitle={selected ? `อาจารย์ ${selected} · ${filterLabel} · FTET คำนวณจากข้อมูลรายวิชา` : "เลือกอาจารย์เพื่อดูรายการสอน"} className="mt-5">
      <div className="table-wrap max-h-[430px]"><table className="data-table"><thead><tr><th>ปี/เทอม</th><th>รหัสวิชา</th><th>ชื่อวิชา</th><th>บรรยาย</th><th>ปฏิบัติ</th><th>โครงงาน</th><th>section</th><th>สัปดาห์</th><th>FTET</th><th>อ้างอิง</th></tr></thead><tbody>{subjectRows.map((row) => <tr key={row.id}><td>{formatYear(row.year, settings.yearFormat === "buddhist")}/{row.semester}</td><td>{row.courseCode || "—"}</td><td>{row.subject || "—"}</td><td>{row.lecture}</td><td>{row.practical}</td><td>{row.project}</td><td>{row.section}</td><td>{row.weeks}</td><td>{formatFtET(row.ftet)}</td><td>{row.sourceSheet}#{row.sourceRow}</td></tr>)}</tbody></table>{!subjectRows.length && <p className="p-6 text-center text-sm text-slate-400">ไม่มีข้อมูลรายวิชา</p>}</div>
      <p className="mt-3 text-[11px] text-slate-400">แนวโน้มย้อนหลังใช้ภาคและหลักสูตรที่เลือก ส่วนตารางรายวิชาและยอดรวมใช้ปี/ภาค/หลักสูตรตามตัวกรองทั้งหมด</p>
    </Panel>
  </>;
}
