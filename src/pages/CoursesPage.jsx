import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDashboard } from "../context/DashboardContext.jsx";
import { getAnnualSeries, getTermSeries } from "../lib/analytics.js";
import { formatFtET, formatYear } from "../lib/format.js";
import { ChartTooltip, ExportButton, ExportPngButton, PageHeading, Panel } from "../components/Ui.jsx";

const colors = { Comp: "#168cba", DE: "#16a394", Dbiz: "#e1a52c", AISE: "#8864c5", MsComp: "#d06484", CoC: "#163250" };

export default function CoursesPage() {
  const { snapshot, settings } = useDashboard();
  const [period, setPeriod] = useState("annual");
  const [selected, setSelected] = useState(["Comp", "DE", "Dbiz", "AISE", "MsComp", "CoC"]);
  const [fromYear, setFromYear] = useState(2562);
  const [toYear, setToYear] = useState(2567);
  const annual = getAnnualSeries(snapshot);
  const terms = getTermSeries(snapshot);
  const years = annual.years;
  const fullData = period === "annual" ? annual.data : terms.data;
  const data = fullData.filter((row) => row.year >= fromYear && row.year <= toYear);
  const latest = [...data].reverse().find((row) => selected.some((program) => row[program] != null));
  const exportRows = [["ปี", "เทอม", ...selected]].concat(data.map((row) => [row.year, row.semester ?? "ค่าเฉลี่ยปี", ...selected.map((program) => row[program] ?? "")]));
  const toggle = (program) => setSelected((current) => current.includes(program) ? current.filter((item) => item !== program) : [...current, program]);

  return <>
    <PageHeading title="FTET รายหลักสูตร" description="เปรียบเทียบ FTET รายปีหรือรายเทอมจากตารางสรุปใน workbook โดยช่องว่างในต้นทางจะแสดงเป็นไม่มีข้อมูล ไม่แทนด้วยศูนย์" action={<div className="flex gap-2"><ExportButton filename="ftet-by-program.csv" rows={exportRows} /><ExportPngButton selector="#course-ftet-chart svg" filename="ftet-by-program.png" /></div>} />
    <Panel title="ตัวกรองข้อมูล" className="mb-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-white/5">{[["annual", "รายปี"], ["term", "รายเทอม"]].map(([key, label]) => <button key={key} onClick={() => setPeriod(key)} className={`rounded-md px-4 py-2 text-xs font-medium ${period === key ? "bg-white text-teal shadow-sm dark:bg-[#20344e]" : "text-slate-500"}`}>{label}</button>)}</div>
        <label className="flex items-center gap-2 text-xs text-slate-500">ปีเริ่ม <select className="input !w-auto !min-h-9" value={fromYear} onChange={(event) => setFromYear(Number(event.target.value))}>{years.map((year) => <option key={year} value={year}>{formatYear(year, settings.yearFormat === "buddhist")}</option>)}</select></label>
        <label className="flex items-center gap-2 text-xs text-slate-500">ปีสิ้นสุด <select className="input !w-auto !min-h-9" value={toYear} onChange={(event) => setToYear(Number(event.target.value))}>{years.map((year) => <option key={year} value={year}>{formatYear(year, settings.yearFormat === "buddhist")}</option>)}</select></label>
        <span className="ml-auto text-xs text-slate-400">เลือกเส้นกราฟ</span>
        {annual.programs.map((program) => <label key={program} className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={selected.includes(program)} onChange={() => toggle(program)} />{program}</label>)}
      </div>
    </Panel>
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title={period === "annual" ? "แนวโน้ม FTET รายปี" : "แนวโน้ม FTET รายเทอม"} subtitle="หน่วยเป็น FTET ต่ออาจารย์; hover กราฟเพื่อดูค่ารายหลักสูตร">
        <div className="h-[350px]" id="course-ftet-chart">{data.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ left: -14, right: 14, top: 10 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9eef3" /><XAxis dataKey={period === "annual" ? "year" : "period"} tickFormatter={(value) => period === "annual" ? formatYear(value, settings.yearFormat === "buddhist") : value.replace("256", "25")} /><YAxis domain={[0, "auto"]} tickFormatter={(value) => Number(value).toFixed(2)} /><Tooltip content={<ChartTooltip />} /><Legend />{selected.map((program) => <Line key={program} type="monotone" dataKey={program} name={program} stroke={colors[program]} strokeWidth={program === "CoC" ? 3 : 2} strokeDasharray={program === "CoC" ? "6 3" : undefined} connectNulls={false} dot={{ r: 3 }} activeDot={{ r: 5 }} />)}<ReferenceLine y={settings.target} stroke="#ef6a52" strokeDasharray="5 4" label={{ value: "เป้าหมาย", fill: "#ef6a52", fontSize: 11 }} /></LineChart></ResponsiveContainer> : <p className="pt-16 text-center text-sm text-slate-400">ไม่มีข้อมูลในช่วงปีที่เลือก</p>}</div>
      </Panel>
      <Panel title="เทียบหลักสูตรในช่วงปลายที่เลือก" subtitle={`ค่าอ้างอิง ${latest ? (period === "annual" ? `ปี ${formatYear(latest.year, settings.yearFormat === "buddhist")}` : `${latest.year}_${latest.semester}`) : "—"}`}>
        <div className="h-[350px]">{latest ? <ResponsiveContainer width="100%" height="100%"><BarChart data={selected.filter((program) => latest[program] != null).map((program) => ({ program, value: latest[program] }))} margin={{ left: -14, right: 12, top: 12 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="program" /><YAxis /><Tooltip content={<ChartTooltip unit="" />} /><Bar dataKey="value" name="FTET" radius={[6, 6, 0, 0]}>{selected.filter((program) => latest[program] != null).map((program) => <Cell key={program} fill={colors[program]} />)}</Bar><ReferenceLine y={settings.target} stroke="#ef6a52" strokeDasharray="5 4" /></BarChart></ResponsiveContainer> : <p className="pt-16 text-center text-sm text-slate-400">ไม่มีข้อมูล</p>}</div>
      </Panel>
    </div>
    <Panel title="ตารางข้อมูลและ heatmap" subtitle="สีพื้นหลังช่วยเห็นระดับค่า แต่ตัวเลขจริงยังแสดงครบในทุกช่อง" className="mt-5">
      <div className="table-wrap"><table className="data-table"><thead><tr><th>หลักสูตร / ปี</th>{data.map((row, index) => <th key={`${row.year}-${row.semester ?? index}`}>{period === "annual" ? formatYear(row.year, settings.yearFormat === "buddhist") : `${formatYear(row.year, settings.yearFormat === "buddhist")}/${row.semester}`}</th>)}</tr></thead><tbody>{selected.map((program) => <tr key={program}><td className="font-semibold">{program}</td>{data.map((row, index) => { const value = row[program]; const opacity = value == null ? 0 : Math.min(0.24, Math.max(0.04, Number(value) * 0.3)); return <td key={`${row.year}-${row.semester ?? index}`} style={value == null ? undefined : { backgroundColor: `${colors[program]}${Math.round(opacity * 255).toString(16).padStart(2, "0")}` }}>{formatFtET(value, 3)}</td>; })}</tr>)}</tbody></table></div>
      <div className="mt-3 text-xs text-slate-400">หมายเหตุ: หลักสูตรปี 2561 ใช้ชื่อ IT / SE / EBiz และคงเป็นเส้นแยกจากชื่อใหม่ตามการเปลี่ยนชื่อหลักสูตร</div>
    </Panel>
  </>;
}
