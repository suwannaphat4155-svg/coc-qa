import { useMemo, useState } from "react";
import { Check, Sigma } from "lucide-react";
import { useDashboard } from "../context/DashboardContext.jsx";
import { calculateFtET } from "../lib/ftet.js";
import { formatFtET } from "../lib/format.js";
import { PageHeading, Panel } from "../components/Ui.jsx";

const calculationTabName = "วิธีการคำนวณ";
const comparisonTabName = "สรุป";

export default function MethodPage() {
  const { snapshot, settings } = useDashboard();
  const [lecture, setLecture] = useState(3);
  const [practical, setPractical] = useState(0);
  const [project, setProject] = useState(0);
  const [sections, setSections] = useState(1);
  const [weeks, setWeeks] = useState(settings.constants.workWeeks);
  const [method, setMethod] = useState(1);
  const calc = calculateFtET({ lecture, practical, project, sections, weeks }, settings.constants);
  const parts = useMemo(() => [
    { label: "บรรยาย", value: Number(lecture) * settings.constants.lectureWeight },
    { label: "ปฏิบัติ", value: Number(practical) * settings.constants.labWeight },
    { label: "โครงงาน", value: Number(project) },
  ], [lecture, practical, project, settings.constants]);
  const methodTab = snapshot?.workbook?.find(({ name }) => name === calculationTabName);
  const comparisonTab = snapshot?.workbook?.find(({ name }) => name === comparisonTabName);
  const comparisonRows = comparisonTab?.rows?.filter((row) => row.some((cell) => String(cell ?? "").trim())) ?? [];
  const methodSheets = snapshot?.workbook?.filter(({ name }) => /Met\d/.test(name)) ?? [];
  const activeMethodSheets = methodSheets.filter(({ name }) => new RegExp(`Met${method}(?:\\b|$)`, "i").test(name));

  return <>
    <PageHeading title="วิธีการคำนวณ FTET" description="อธิบายสูตรที่ใช้ใน workbook และจำลอง what-if ได้จากชั่วโมงสอนจริง โดยค่าคงที่แก้ไขได้ใน Settings" />
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <Panel title="สูตรหลัก" subtitle="อ้างอิงแท็บ วิธีการคำนวณ และหัวสูตรในแท็บรายวิชา">
        <div className="rounded-2xl bg-navy p-5 text-white">
          <div className="flex items-center gap-2 text-sm font-semibold"><Sigma size={18} className="text-teal" /> FTET ต่อแถวรายวิชา</div>
          <div className="my-4 overflow-x-auto rounded-xl bg-white/10 px-4 py-5 text-center font-mono text-sm sm:text-base">
            ((บรรยาย × {settings.constants.lectureWeight}) + (ปฏิบัติ × {settings.constants.labWeight}) + โครงงาน) × section × สัปดาห์ ÷ ({settings.constants.weeklyHours} × {settings.constants.workWeeks})
          </div>
          <div className="grid gap-3 sm:grid-cols-3">{parts.map(({ label, value }) => <div key={label} className="rounded-xl bg-white/10 p-3"><div className="text-xs text-slate-300">{label} × น้ำหนัก</div><div className="mt-1 font-semibold">{formatFtET(value, 2)} ชั่วโมง/สัปดาห์</div></div>)}</div>
          <p className="mt-4 text-xs leading-5 text-slate-300">ตัวหารเริ่มต้น 525 = 35 ชั่วโมงต่อสัปดาห์ × 15 สัปดาห์ · FTETS อาจารย์ = ผลรวม FTET ทุกรายวิชาในเทอมนั้น</p>
        </div>
        <div className="mt-4 rounded-xl border border-slate-100 p-4 dark:border-white/10"><div className="mb-2 font-semibold">นิยาม/ข้อความจาก workbook</div>{methodTab?.rows?.filter((row) => row.some((cell) => String(cell ?? "").trim())).slice(0, 22).map((row, index) => <p key={index} className="py-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{row.filter((cell) => String(cell ?? "").trim()).join(" · ")}</p>)}</div>
      </Panel>
      <Panel title="What-if: จำลอง FTET" subtitle="กำหนดชั่วโมง/สัปดาห์ ราย section และจำนวนสัปดาห์">
        <div className="grid gap-3 sm:grid-cols-2">{[["ชั่วโมงบรรยาย", lecture, setLecture], ["ชั่วโมงปฏิบัติ", practical, setPractical], ["ชั่วโมงโครงงาน", project, setProject], ["จำนวน section", sections, setSections], ["จำนวนสัปดาห์", weeks, setWeeks]].map(([label, value, setter]) => <label key={label} className="text-xs font-medium text-slate-500">{label}<input className="input mt-1" type="number" min="0" step="0.5" value={value} onChange={(event) => setter(Number(event.target.value))} /></label>)}</div>
        <div className="mt-5 rounded-2xl bg-teal/5 p-5"><div className="text-xs text-slate-500">ผลลัพธ์ FTET</div><div className="mt-1 text-4xl font-bold text-teal">{formatFtET(calc, 4)}</div><div className="mt-4 space-y-1.5 border-t border-teal/10 pt-3 text-xs text-slate-600 dark:text-slate-300"><p>1. (บรรยาย {lecture} × {settings.constants.lectureWeight}) + (ปฏิบัติ {practical} × {settings.constants.labWeight}) + โครงงาน {project} = {formatFtET(parts.reduce((sum, item) => sum + item.value, 0), 3)}</p><p>2. คูณ {sections} section × {weeks} สัปดาห์ = {formatFtET(parts.reduce((sum, item) => sum + item.value, 0) * sections * weeks, 3)} ชั่วโมง</p><p>3. หาร {settings.constants.weeklyHours * settings.constants.workWeeks} ชั่วโมงต่อภาคการศึกษา</p></div></div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Check size={13} className="mr-1 inline" />3 ชม.บรรยาย = 0.1714</span><span className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Check size={13} className="mr-1 inline" />(2,2) = 0.2000</span><span className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Check size={13} className="mr-1 inline" />โครงงาน 1 = 0.0286</span></div>
      </Panel>
    </div>
    <Panel title="เปรียบเทียบวิธี 1–4 ปี 2561" subtitle="ค่าจากแท็บสรุป และตัวอย่าง Met1/Met2/Met4/Met234 ใน workbook" className="mt-5">
      <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1 dark:bg-white/5">{[1, 2, 3, 4].map((value) => <button key={value} onClick={() => setMethod(value)} className={`rounded-md px-4 py-2 text-xs ${method === value ? "bg-white font-semibold text-teal shadow-sm dark:bg-[#20344e]" : "text-slate-500"}`}>วิธีที่ {value}</button>)}</div>
      <div className="table-wrap"><table className="data-table"><thead><tr>{(comparisonRows[0] ?? []).map((cell, index) => <th key={index}>{cell}</th>)}</tr></thead><tbody>{comparisonRows.slice(1).map((row, index) => <tr key={index}>{row.map((cell, col) => <td key={col}>{cell ?? "—"}</td>)}</tr>)}</tbody></table></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{activeMethodSheets.map(({ name, rows }) => <div key={name} className="rounded-xl border border-slate-100 p-3 text-xs dark:border-white/10"><div className="font-semibold">{name}</div><div className="mt-1 text-slate-500">{rows.filter((row) => row.some((cell) => String(cell ?? "").trim())).length} แถวมีข้อมูล</div></div>)}</div>
      <p className="mt-3 text-xs text-slate-400">วิธีทางเลือกมีสูตรต่างกันตาม header ของแท็บตัวอย่าง; ตารางนี้คงข้อมูลต้นทางไว้ ไม่คำนวณแทนหรือปะปนกับเส้น FTET หลักสูตร</p>
    </Panel>
  </>;
}
