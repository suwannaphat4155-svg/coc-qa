import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Search } from "lucide-react";
import { useDashboard } from "../context/DashboardContext.jsx";
import { aggregateTeachers, getPrimaryDetails, getTeacherYearTrend, getLatestTermTeacherStats } from "../lib/analytics.js";
import { formatFtET, formatYear } from "../lib/format.js";
import { ChartTooltip, PageHeading, Panel } from "../components/Ui.jsx";

const programColor = { Comp: "#168cba", DE: "#16a394", Dbiz: "#e1a52c", DBiz: "#e1a52c", MsComp: "#d06484", AISE: "#8864c5" };

export default function TeachersPage() {
  const { snapshot, settings } = useDashboard();
  const [search, setSearch] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const allDetails = getPrimaryDetails(snapshot);
  const latestRows = getLatestTermTeacherStats(allDetails);
  const result = latestRows.filter((row) => row.teacher.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.ftet - a.ftet);
  const selected = selectedTeacher || result[0]?.teacher || "";
  const trend = getTeacherYearTrend(allDetails, selected);
  const subjectRows = allDetails.filter((row) => row.teacher === selected).sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || (a.semester ?? 0) - (b.semester ?? 0));
  const histogram = useMemo(() => {
    const buckets = new Map();
    latestRows.forEach(({ ftet }) => {
      const low = Math.floor(ftet * 10) / 10;
      const label = `${low.toFixed(1)}–${(low + 0.1).toFixed(1)}`;
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    });
    return [...buckets.entries()].map(([range, count]) => ({ range, count }));
  }, [latestRows]);
  const mostRecent = latestRows[0];
  const hasDetails = subjectRows.length > 0;

  return <>
    <PageHeading title="FTET รายอาจารย์" description="จัดอันดับจากผลรวม FTET ที่คำนวณใหม่จากรายวิชาในเทอมล่าสุดที่มีข้อมูลรายละเอียด พร้อมแนวโน้มและ breakdown รายบุคคล" />
    <div className="mb-5 grid gap-4 sm:grid-cols-[1fr_auto]">
      <label className="relative"><Search size={17} className="absolute left-3 top-3 text-slate-400" /><input className="input pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่ออาจารย์..." /></label>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 dark:border-white/10 dark:bg-[#14243a]">เกณฑ์ที่ตั้งไว้ <b className="text-ink dark:text-white">{formatFtET(settings.teacherThreshold, 3)} FTET</b></div>
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
      <Panel title="อันดับ FTET รายอาจารย์" subtitle={mostRecent ? `เทอม ${formatYear(mostRecent.year, settings.yearFormat === "buddhist")}/${mostRecent.semester}` : "ข้อมูลจากแท็บรายละเอียด"}>
        <div className="h-[330px]">{result.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={result.slice(0, 20)} layout="vertical" margin={{ left: 5, right: 24, top: 4 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis type="category" dataKey="teacher" width={145} tick={{ fontSize: 10 }} /><Tooltip content={<ChartTooltip unit="" />} /><Legend /><Bar dataKey="ftet" name="FTET รวมรายวิชา" radius={[0, 5, 5, 0]}>{result.slice(0, 20).map((row) => <Cell key={row.teacher} fill={row.ftet > settings.teacherThreshold ? "#d05b50" : row.programs[0] ? programColor[row.programs[0]] ?? "#64748b" : "#64748b"} />)}</Bar></BarChart></ResponsiveContainer> : <p className="pt-16 text-center text-sm text-slate-400">ปีที่เลือกไม่มีข้อมูลรายละเอียดรายอาจารย์</p>}</div>
        <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-white/10">{Object.entries(programColor).map(([program, color]) => <span className="inline-flex items-center gap-1.5" key={program}><i className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />{program}</span>)}<span className="inline-flex items-center gap-1.5 text-rose-700"><i className="h-2.5 w-2.5 rounded-sm bg-rose-600" />เกินเกณฑ์ {formatFtET(settings.teacherThreshold, 3)}</span></div>
      </Panel>
      <Panel title="การกระจาย FTET" subtitle="Histogram ของ FTET รวมต่ออาจารย์ในเทอมล่าสุดที่มีข้อมูล">
        <div className="h-[330px]">{histogram.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={histogram}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="range" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="count" name="จำนวนอาจารย์" fill="#16a394" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="pt-16 text-center text-sm text-slate-400">ไม่มีข้อมูลสำหรับทำ histogram</p>}</div>
      </Panel>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.4fr]">
      <Panel title="ข้อมูลรายบุคคล" subtitle="เลือกชื่อจากอันดับด้านล่างเพื่อดูแนวโน้มและรายการสอน">
        <select className="input" value={selected} onChange={(event) => setSelectedTeacher(event.target.value)}><option value="">เลือกอาจารย์</option>{[...new Set(allDetails.map(({ teacher }) => teacher))].sort().map((name) => <option value={name} key={name}>{name}</option>)}</select>
        {!hasDetails && <p className="mt-3 text-xs text-amber-700">ปี 2564–2566 มีเฉพาะตารางสรุป จึงไม่มีข้อมูลรายบุคคลในปีดังกล่าว</p>}
        {hasDetails && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/5"><div className="font-semibold">{selected}</div><div className="mt-1 text-xs text-slate-500">พบข้อมูล {subjectRows.length} แถว จาก {new Set(subjectRows.map(({ sourceSheet }) => sourceSheet)).size} แท็บ</div><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><span>บรรยาย <b>{subjectRows.reduce((s, x) => s + x.lecture, 0)}</b> ชม.</span><span>ปฏิบัติ <b>{subjectRows.reduce((s, x) => s + x.practical, 0)}</b> ชม.</span><span>โครงงาน <b>{subjectRows.reduce((s, x) => s + x.project, 0)}</b></span></div></div>}
      </Panel>
      <Panel title="แนวโน้ม FTET รายบุคคล" subtitle={selected || "เลือกอาจารย์เพื่อดูแนวโน้ม"}>
        <div className="h-[250px]">{trend.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" tickFormatter={(year) => formatYear(year, settings.yearFormat === "buddhist")} /><YAxis /><Tooltip content={<ChartTooltip unit="" />} /><Legend /><Line type="monotone" dataKey="ftet" name="FTET รวมทั้งปี" stroke="#16a394" strokeWidth={2.5} dot={{ r: 4 }} /></LineChart></ResponsiveContainer> : <p className="pt-16 text-center text-sm text-slate-400">ไม่มีข้อมูลแนวโน้มสำหรับอาจารย์ที่เลือก</p>}</div>
      </Panel>
    </div>
    <Panel title="รายการรายวิชา" subtitle={selected ? `อาจารย์ ${selected} · FTET เป็นค่าคำนวณใหม่ต่อแถว` : "ยังไม่มีรายละเอียดที่เลือก"} className="mt-5">
      <div className="table-wrap max-h-[430px]"><table className="data-table"><thead><tr><th>ปี/เทอม</th><th>รหัสวิชา</th><th>ชื่อวิชา</th><th>บรรยาย</th><th>ปฏิบัติ</th><th>โครงงาน</th><th>FTET</th><th>เกณฑ์</th><th>อ้างอิง</th></tr></thead><tbody>{subjectRows.map((row) => <tr key={row.id}><td>{formatYear(row.year, settings.yearFormat === "buddhist")}/{row.semester}</td><td>{row.courseCode}</td><td>{row.subject}</td><td>{row.lecture}</td><td>{row.practical}</td><td>{row.project}</td><td>{formatFtET(row.ftet)}</td><td><span className={`rounded-full px-2 py-1 text-[10px] ${row.ftet > settings.teacherThreshold ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{row.ftet > settings.teacherThreshold ? "เกิน" : "ต่ำกว่า/เท่ากับ"}</span></td><td>{row.sourceSheet}#{row.sourceRow}</td></tr>)}</tbody></table>{!subjectRows.length && <p className="p-6 text-center text-sm text-slate-400">ไม่มีข้อมูลรายวิชา</p>}</div>
      <p className="mt-3 text-[11px] text-slate-400">ธงเกณฑ์: ค่าต่ำกว่า/สูงกว่า {formatFtET(settings.teacherThreshold, 3)} FTET สามารถเปลี่ยนเกณฑ์ได้ที่หน้า Settings</p>
    </Panel>
  </>;
}
