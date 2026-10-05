import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDashboard } from "../context/DashboardContext.jsx";
import { getPrimaryDetails } from "../lib/analytics.js";
import { formatYear } from "../lib/format.js";
import { ChartTooltip, PageHeading, Panel } from "../components/Ui.jsx";

export default function LoadPage() {
  const { snapshot, settings } = useDashboard();
  const [year, setYear] = useState("all");
  const [semester, setSemester] = useState("all");
  const records = getPrimaryDetails(snapshot);
  const years = [...new Set(records.map(({ year }) => year).filter(Boolean))].sort((a, b) => a - b);
  const data = useMemo(() => {
    const groups = new Map();
    records.filter((row) => (year === "all" || row.year === Number(year)) && (semester === "all" || row.semester === Number(semester))).forEach((row) => {
      const period = `${row.year}_${row.semester}`;
      const program = row.programs[0] ?? "ไม่ระบุ";
      const key = `${period}:${program}`;
      const item = groups.get(key) ?? { period, program, label: `${period} · ${program}`, lecture: 0, practical: 0, project: 0 };
      item.lecture += row.lecture * row.section;
      item.practical += row.practical * row.section;
      item.project += row.project * row.section;
      groups.set(key, item);
    });
    return [...groups.values()].sort((a, b) => a.period.localeCompare(b.period));
  }, [records, year, semester]);

  return <>
    <PageHeading title="องค์ประกอบโหลดการสอน" description="เปรียบเทียบชั่วโมงบรรยาย ชั่วโมงปฏิบัติ และโครงงานตามหลักสูตร/เทอมจากรายละเอียดรายวิชา" />
    <Panel title="ตัวกรอง" className="mb-5"><div className="flex flex-wrap gap-3"><select className="input !w-auto" value={year} onChange={(event) => setYear(event.target.value)}><option value="all">ทุกปี</option>{years.map((value) => <option key={value} value={value}>{formatYear(value, settings.yearFormat === "buddhist")}</option>)}</select><select className="input !w-auto" value={semester} onChange={(event) => setSemester(event.target.value)}><option value="all">ทุกเทอม</option><option value="1">ภาค 1</option><option value="2">ภาค 2</option></select><span className="self-center text-xs text-slate-400">คูณจำนวน section แล้ว; เป็นชั่วโมงรวมไม่ใช่ FTET</span></div></Panel>
    <Panel title="สัดส่วนองค์ประกอบโหลด" subtitle="แกน X แสดงปี/เทอมและหลักสูตร · hover เพื่อดูชั่วโมงแต่ละองค์ประกอบ">
      <div className="h-[470px]">{data.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ bottom: 42, left: 0, right: 10 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" angle={-25} textAnchor="end" interval={0} height={60} /><YAxis /><Tooltip content={<ChartTooltip unit=" ชม." />} /><Legend /><Bar dataKey="lecture" name="บรรยาย" stackId="a" fill="#168cba" /><Bar dataKey="practical" name="ปฏิบัติ" stackId="a" fill="#16a394" /><Bar dataKey="project" name="โครงงาน" stackId="a" fill="#e1a52c" /></BarChart></ResponsiveContainer> : <p className="pt-20 text-center text-sm text-slate-400">แท็บรายละเอียดไม่มีข้อมูลในช่วงที่เลือก</p>}</div>
      <div className="mt-3 text-xs text-slate-400">ข้อจำกัด: รายละเอียดปี 2564–2566 ไม่มีใน workbook; กลุ่มหลักสูตรใช้สาขาอาจารย์ตามต้นทาง</div>
    </Panel>
  </>;
}
