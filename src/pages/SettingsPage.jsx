import { useMemo, useState } from "react";
import { useDashboard } from "../context/DashboardContext.jsx";
import { legacyCurriculumMapping } from "../config/curricula.js";
import { teacherAliases, possibleTeacherDuplicates } from "../config/aliases.js";
import { PageHeading, Panel } from "../components/Ui.jsx";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings, tabStatuses, snapshot, refreshing, refresh } = useDashboard();
  const [statusQuery, setStatusQuery] = useState("");
  const [tabFilter, setTabFilter] = useState("all");
  const constants = settings.constants;
  const visibleTabs = useMemo(() => tabStatuses.filter((item) => item.name.toLowerCase().includes(statusQuery.toLowerCase()) && (tabFilter === "all" || item.source === tabFilter)), [tabStatuses, statusQuery, tabFilter]);
  const updateConstant = (key, value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) return;
    updateSettings({ constants: { ...constants, [key]: numericValue } });
  };
  const updateMapping = (key, value) => updateSettings({ curriculumMapping: { ...(settings.curriculumMapping ?? legacyCurriculumMapping), [key]: value } });
  const aliases = settings.aliases ?? teacherAliases;
  const updateAlias = (key, value) => updateSettings({ aliases: { ...aliases, [key]: value } });

  return <>
    <PageHeading title="ตั้งค่าระบบ" description="ปรับค่าคำนวณ เป้าหมายและเกณฑ์แจ้งเตือน ธีม รูปแบบปี และดูสถานะการ sync ทุกแท็บ" action={<div className="flex gap-2"><button onClick={resetSettings} className="border-2 border-black bg-white px-4 py-2 text-sm font-bold hover:bg-slate-100 dark:border-white dark:bg-transparent">คืนค่าเริ่มต้น</button><button onClick={refresh} disabled={refreshing} className="border-2 border-black bg-black px-4 py-2 text-sm font-bold text-white hover:bg-white hover:text-black disabled:opacity-50 dark:border-white dark:bg-white dark:text-black">{refreshing ? "กำลังรีเฟรช…" : "รีเฟรชข้อมูล"}</button></div>} />
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="ค่าคงที่สูตร FTET" subtitle="ใช้กับเครื่องคำนวณ what-if เท่านั้น; รายงานหลักยังคงอ้างอิงค่าที่บันทึกใน workbook">
        <div className="grid gap-3 sm:grid-cols-2">{[["lectureWeight", "น้ำหนักชั่วโมงบรรยาย"], ["labWeight", "น้ำหนักชั่วโมงปฏิบัติ"], ["weeklyHours", "ชั่วโมงทำงาน/สัปดาห์"], ["workWeeks", "สัปดาห์/ภาคการศึกษา"]].map(([key, label]) => <label key={key} className="text-xs text-slate-500">{label}<input className="input mt-1" type="number" min="0.1" step="0.1" value={constants[key]} onChange={(event) => updateConstant(key, event.target.value)} /></label>)}</div>
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-white/5">ตัวหารคำนวณอัตโนมัติ = {constants.weeklyHours * constants.workWeeks} ชั่วโมง</div>
      </Panel>
      <Panel title="เป้าหมายและเกณฑ์" subtitle="ใช้แสดงเส้นอ้างอิงและธงในหน้าภาพรวม/รายอาจารย์">
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-slate-500">เป้าหมาย FTET (เส้นกราฟ)<input className="input mt-1" type="number" min="0" step="0.01" value={settings.target} onChange={(event) => updateSettings({ target: Number(event.target.value) })} /></label><label className="text-xs text-slate-500">ธง FTET รายอาจารย์<input className="input mt-1" type="number" min="0" step="0.01" value={settings.teacherThreshold} onChange={(event) => updateSettings({ teacherThreshold: Number(event.target.value) })} /></label><label className="text-xs text-slate-500">เกณฑ์โหลดเกิน<input className="input mt-1" type="number" min="0" step="0.01" value={settings.overloadThreshold} onChange={(event) => updateSettings({ overloadThreshold: Number(event.target.value) })} /></label></div>
      </Panel>
      <Panel title="รูปแบบการแสดงผล" subtitle="ตั้งค่าเฉพาะเบราว์เซอร์นี้">
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-slate-500">ธีม<select className="input mt-1" value={settings.theme} onChange={(event) => updateSettings({ theme: event.target.value })}><option value="light">Light</option><option value="dark">Dark</option></select></label><label className="text-xs text-slate-500">รูปแบบปี<select className="input mt-1" value={settings.yearFormat} onChange={(event) => updateSettings({ yearFormat: event.target.value })}><option value="buddhist">พ.ศ.</option><option value="gregorian">ค.ศ.</option></select></label></div>
      </Panel>
      <Panel title="Alias อาจารย์" subtitle="ปรับ alias ที่ใช้แสดงใน session นี้; config เริ่มต้นเก็บใน src/config/aliases.js">
        <div className="space-y-2">{Object.entries(aliases).map(([from, to]) => <div key={from} className="grid gap-2 sm:grid-cols-2"><label className="text-[11px] text-slate-500">ชื่อในต้นทาง<input className="input mt-1" value={from} readOnly /></label><label className="text-[11px] text-slate-500">ชื่อมาตรฐาน<input className="input mt-1" value={to} onChange={(event) => updateAlias(from, event.target.value)} /></label></div>)}</div>
        <div className="mt-3 text-xs text-amber-700 dark:text-amber-300">ชื่อที่อาจเป็นคนเดียวกัน: {possibleTeacherDuplicates.map(({ names }) => names.join(" / ")).join(" · ")} · ตรวจสอบก่อนยืนยันการรวมชื่อ</div>
      </Panel>
      <Panel title="Mapping หลักสูตรเดิม → ใหม่" subtitle="เก็บเป็น mapping เพื่อช่วยอ่านแนวโน้ม; ไม่รวมเส้นประวัติศาสตร์อัตโนมัติ">
        <div className="space-y-2">{Object.entries(settings.curriculumMapping ?? legacyCurriculumMapping).map(([key, value]) => <div className="grid grid-cols-[1fr_1fr] items-center gap-3" key={key}><span className="rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-white/5">{key}</span><select className="input" value={value} onChange={(event) => updateMapping(key, event.target.value)}>{["Comp", "DE", "Dbiz", "AISE", "MsComp", "IT", "SE", "EBiz"].map((program) => <option key={program}>{program}</option>)}</select></div>)}</div>
        <div className="mt-3 text-xs text-slate-400">หลักสูตรเปลี่ยนชื่อและโครงสร้างตามปี: 2561 ใช้ IT/SE/EBiz, 2562 เป็นต้นไปใช้ชื่อใหม่; ข้อมูลเก่าไม่ถูกบวกเป็นเส้นเดียวกัน</div>
      </Panel>
      <Panel title="สถานะข้อมูลรายแท็บ" subtitle={`${snapshot?.tabCount ?? tabStatuses.length} แท็บ · Snapshot ${snapshot?.generatedAt ? new Date(snapshot.generatedAt).toLocaleString("th-TH") : "—"}`} className="xl:col-span-2">
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_200px]"><input className="input" placeholder="ค้นหาชื่อแท็บ" value={statusQuery} onChange={(event) => setStatusQuery(event.target.value)} /><select className="input" value={tabFilter} onChange={(event) => setTabFilter(event.target.value)}><option value="all">ทุกแหล่ง</option><option value="snapshot">Snapshot</option><option value="live">Google Sheets Live</option></select></div>
        <div className="table-wrap max-h-[380px]"><table className="data-table"><thead><tr><th>ชื่อแท็บ</th><th>แถวข้อมูล</th><th>สถานะ</th><th>แหล่ง</th><th>รายละเอียด</th></tr></thead><tbody>{visibleTabs.map((tab) => { const rowCount = snapshot?.workbook?.find((sheet) => sheet.name === tab.name)?.rowCount ?? "—"; return <tr key={tab.name}><td>{tab.name}</td><td>{rowCount}</td><td>{tab.ok ? "พร้อม" : "fallback"}</td><td>{tab.source}</td><td>{tab.error ?? ""}</td></tr>; })}</tbody></table></div>
        {!import.meta.env.VITE_SHEET_ID && <p className="mt-3 text-xs text-slate-400">ยังไม่ได้ตั้ง VITE_SHEET_ID — ใช้ข้อมูล snapshot ที่สร้างจากไฟล์ Excel</p>}
      </Panel>
    </div>
  </>;
}
