import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDashboard } from "../context/DashboardContext.jsx";
import { getAnnualSeries, getTermSeries } from "../lib/analytics.js";
import { formatFtET, formatYear } from "../lib/format.js";
import { ChartTooltip, PageHeading, Panel } from "../components/Ui.jsx";

const programs = ["Comp", "DE", "Dbiz", "AISE", "MsComp", "CoC"];

export default function ComparePage() {
  const { snapshot, settings } = useDashboard();
  const annual = getAnnualSeries(snapshot).data;
  const term = getTermSeries(snapshot).data;
  const byYear = useMemo(() => annual.flatMap((row) => {
    const first = term.find((item) => item.year === row.year && item.semester === 1);
    const second = term.find((item) => item.year === row.year && item.semester === 2);
    return programs.map((program) => ({
      period: `${formatYear(row.year, settings.yearFormat === "buddhist")} · ${program}`,
      program,
      term1: first?.[program] ?? null,
      term2: second?.[program] ?? null,
    })).filter((item) => item.term1 != null || item.term2 != null);
  }), [annual, term, settings.yearFormat]);
  const yoy = annual.slice(1).map((row, index) => ({ year: row.year, CoC: row.CoC == null || annual[index].CoC == null ? null : row.CoC - annual[index].CoC }));
  const latest = annual.at(-1);
  const previous = annual.at(-2);
  const message = latest?.CoC != null && previous?.CoC != null
    ? `FTET เฉลี่ยของวิทยาลัย ${latest.CoC >= previous.CoC ? "เพิ่มขึ้น" : "ลดลง"} ${formatFtET(Math.abs(latest.CoC - previous.CoC), 3)} จากปี ${formatYear(previous.year, settings.yearFormat === "buddhist")} เป็นปี ${formatYear(latest.year, settings.yearFormat === "buddhist")}.`
    : "มีข้อมูลไม่เพียงพอสำหรับสรุปแนวโน้มปีต่อปี";

  return <>
    <PageHeading title="เปรียบเทียบแนวโน้ม" description="เทียบเทอม 1 กับเทอม 2 ดูการเปลี่ยนแปลงปีต่อปี และรับข้อความสรุปจากตัวเลขในตารางสรุป" />
    <Panel title="เทอม 1 เทียบเทอม 2 รายหลักสูตร" subtitle="ใช้ค่าจากตารางสรุป FTET รายเทอม">
      <div className="h-[360px]">{byYear.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={byYear}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="period" angle={-30} textAnchor="end" interval={0} height={75} tick={{ fontSize: 10 }} /><YAxis /><Tooltip content={<ChartTooltip unit="" />} /><Legend /><Bar dataKey="term1" name="เทอม 1" fill="#168cba" radius={[4, 4, 0, 0]} /><Bar dataKey="term2" name="เทอม 2" fill="#16a394" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="pt-16 text-center text-sm text-slate-400">ไม่มีข้อมูลรายเทอม</p>}</div>
      <p className="mt-2 text-xs text-slate-400">ชื่อปีและหลักสูตรอยู่บนแกน X; legend แสดงภาคการศึกษาที่ 1 และ 2</p>
    </Panel>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_1fr]">
      <Panel title="การเปลี่ยนแปลง CoC ปีต่อปี" subtitle="ค่าบวกหมายถึงเพิ่มขึ้น; ค่าลบหมายถึงลดลง">
        <div className="h-[300px]">{yoy.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={yoy}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" tickFormatter={(value) => formatYear(value, settings.yearFormat === "buddhist")} /><YAxis /><Tooltip content={<ChartTooltip unit="" />} /><Legend /><Line type="monotone" dataKey="CoC" name="การเปลี่ยนแปลง FTET" stroke="#8864c5" strokeWidth={2.5} dot={{ r: 4 }} /></LineChart></ResponsiveContainer> : <p className="pt-16 text-center text-sm text-slate-400">ข้อมูลไม่เพียงพอ</p>}</div>
      </Panel>
      <Panel title="สรุปอัตโนมัติ" subtitle="คำนวณจาก CoC (เฉลี่ย Comp, DE, Dbiz, MsComp)">
        <div className="rounded-xl bg-teal/5 p-5 text-sm leading-7 text-slate-700 dark:text-slate-200">{message}</div>
        {latest && <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5"><div className="text-xs text-slate-500">ล่าสุด</div><b className="mt-1 block text-xl">{formatFtET(latest.CoC, 3)}</b><span className="text-xs">{formatYear(latest.year, settings.yearFormat === "buddhist")}</span></div><div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5"><div className="text-xs text-slate-500">ปีก่อน</div><b className="mt-1 block text-xl">{formatFtET(previous?.CoC, 3)}</b><span className="text-xs">{formatYear(previous?.year, settings.yearFormat === "buddhist")}</span></div></div>}
      </Panel>
    </div>
  </>;
}
