import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSearch, Search } from "lucide-react";
import { useDashboard } from "../context/DashboardContext.jsx";
import { calculateSummaryDiff, getAnnualSeries, getPrimaryDetails, summarizeDetailAvailability } from "../lib/analytics.js";
import { formatFtET, formatYear } from "../lib/format.js";
import { downloadCsv } from "../lib/data.js";
import { PageHeading, Panel } from "../components/Ui.jsx";

export default function QualityPage() {
  const { snapshot, settings } = useDashboard();
  const [query, setQuery] = useState("");
  const details = getPrimaryDetails(snapshot);
  const availability = summarizeDetailAvailability(snapshot);
  const summaryDiffs = calculateSummaryDiff(snapshot);
  const annual = getAnnualSeries(snapshot).data;
  const flagged = details.filter((row) => row.isCoTeach || row.isCoordinatorLoad || row.isRefError);
  const refCells = (snapshot?.workbook ?? []).flatMap((tab) => tab.rows.flatMap((row, index) => row.flatMap((cell, column) => /#REF!/i.test(String(cell ?? "")) ? [{ sheet: tab.name, row: index + 1, column: column + 1 }] : [])));
  const duplicateGroups = useMemo(() => {
    const seen = new Map();
    details.forEach((row) => {
      const key = `${row.sourceSheet}|${row.teacher}|${row.courseCode}|${row.subject}`;
      const group = seen.get(key) ?? [];
      group.push(row.sourceRow);
      seen.set(key, group);
    });
    return [...seen.entries()].filter(([, rows]) => rows.length > 1).map(([key, rows]) => ({ key, rows }));
  }, [details]);
  const mismatch = [];
  const byTeacher = new Map();
  details.forEach((row) => {
    const key = `${row.sourceSheet}|${row.teacher}`;
    const item = byTeacher.get(key) ?? { sheet: row.sourceSheet, teacher: row.teacher, computed: 0, source: null };
    item.computed += row.ftet;
    if (row.sourceFtets != null) item.source = row.sourceFtets;
    byTeacher.set(key, item);
  });
  byTeacher.forEach((row) => {
    if (row.source != null && Math.abs(row.computed - row.source) > 0.015) mismatch.push({ ...row, difference: row.computed - row.source });
  });
  const searchText = query.toLowerCase();
  const filteredFlags = flagged.filter((row) => `${row.teacher} ${row.subject} ${row.sourceSheet}`.toLowerCase().includes(searchText));
  const exportRows = [
    ["ประเภท", "ชีต", "แถว/ชื่อ", "รายละเอียด"],
    ...summaryDiffs.map((row) => ["summary-diff", row.year, row.program, `legacy=${row.legacy}; current=${row.current}; diff=${row.difference}`]),
    ...mismatch.map((row) => ["FTETS-mismatch", row.sheet, row.teacher, `file=${row.source}; calculated=${row.computed}; diff=${row.difference}`]),
    ...flagged.map((row) => ["text-or-ref-flag", row.sourceSheet, row.sourceRow, `${row.teacher} / ${row.subject} / coTeach=${row.isCoTeach} / coordinator=${row.isCoordinatorLoad} / ref=${row.isRefError}`]),
    ...refCells.map((row) => ["ref-error", row.sheet, row.row, `column ${row.column}`]),
    ...duplicateGroups.map((row) => ["possible-duplicate", row.key, row.rows.join(";"), "same teacher/course/subject in one sheet"]),
    ...availability.filter((row) => !row.available).map((row) => ["no-detail-year", row.year, "", "มีเฉพาะตารางสรุป"]),
  ];
  const cards = [
    ["แท็บทั้งหมด", snapshot?.workbook?.length ?? 0],
    ["แถวข้อความ/ร่วมสอน/ประสานงาน", flagged.length],
    ["FTETS คลาดเคลื่อน", mismatch.length],
    ["#REF! ใน workbook", refCells.length],
    ["กลุ่มแถวซ้ำที่อาจตรวจเพิ่ม", duplicateGroups.length],
  ];

  return <>
    <PageHeading title="ตรวจสอบคุณภาพข้อมูล" description="ตรวจเทียบตารางสรุปกับสูตรที่คำนวณใหม่ พร้อมรายการธงจากข้อมูลต้นทางและรายงาน CSV สำหรับติดตามแก้ไข" action={<button onClick={() => downloadCsv("coc-data-quality.csv", exportRows)} className="rounded-lg bg-teal px-3 py-2 text-xs font-semibold text-white">ดาวน์โหลดรายงาน CSV</button>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value]) => <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#14243a]" key={label}><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-2xl font-bold">{value.toLocaleString("th-TH")}</div></div>)}</div>
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="เปรียบเทียบสรุปเก่ากับตารางใหม่" subtitle="สรุป FTET ปี 2561–2563 เทียบค่าปีเดียวกันในตารางสรุปหลัก">
        <div className="table-wrap max-h-[360px]"><table className="data-table"><thead><tr><th>ปี</th><th>หลักสูตร</th><th>สรุปเก่า</th><th>สรุปหลัก</th><th>ส่วนต่าง</th></tr></thead><tbody>{summaryDiffs.map((row, index) => <tr key={index}><td>{formatYear(row.year, settings.yearFormat === "buddhist")}</td><td>{row.program}</td><td>{formatFtET(row.legacy, 3)}</td><td>{formatFtET(row.current, 3)}</td><td className={Math.abs(row.difference) > 0.005 ? "font-semibold text-amber-700" : "text-emerald-700"}>{formatFtET(row.difference, 3)}</td></tr>)}</tbody></table>{!summaryDiffs.length && <p className="p-4 text-sm text-slate-400">ไม่พบข้อมูลสำหรับเปรียบเทียบ</p>}</div>
        {annual.length > 0 && <p className="mt-3 text-xs text-slate-400">ค่าตารางใหม่รวม {annual.length} ปี · CoC ที่คำนวณใหม่ไม่นับ AISE</p>}
      </Panel>
      <Panel title="สถานะความครอบคลุมรายละเอียด" subtitle="ปีที่ระบุว่าไม่มีรายละเอียดจะไม่นำไปสร้างกราฟรายบุคคล">
        <div className="space-y-2">{[2561, 2562, 2563, 2564, 2565, 2566, 2567].map((year) => { const count = details.filter((row) => row.year === year).length; const available = count > 0; return <div key={year} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm dark:bg-white/5"><span>{formatYear(year, settings.yearFormat === "buddhist")}</span><span className={`inline-flex items-center gap-1.5 text-xs ${available ? "text-emerald-700" : "text-amber-700"}`}>{available ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{available ? `${count} แถวรายละเอียด` : "ไม่มีรายละเอียดรายอาจารย์"}</span></div>; })}</div>
      </Panel>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <Panel title="ตรวจค่า FTETS ในไฟล์เทียบคำนวณใหม่" subtitle="เทียบผลรวม FTET รายแถวกับค่า FTETS ที่บันทึกท้ายกลุ่มอาจารย์">
        <div className="table-wrap max-h-[340px]"><table className="data-table"><thead><tr><th>ชีต</th><th>อาจารย์</th><th>ในไฟล์</th><th>คำนวณใหม่</th><th>ต่าง</th></tr></thead><tbody>{mismatch.slice(0, 100).map((row, index) => <tr key={index}><td>{row.sheet}</td><td>{row.teacher}</td><td>{formatFtET(row.source, 2)}</td><td>{formatFtET(row.computed, 3)}</td><td className="text-amber-700">{formatFtET(row.difference, 3)}</td></tr>)}</tbody></table>{!mismatch.length && <p className="p-4 text-sm text-emerald-700">ไม่พบค่าคลาดเคลื่อนเกิน tolerance 0.015 FTET</p>}</div>
      </Panel>
      <Panel title="แถวข้อความและ error" subtitle="ช่องตัวเลขที่มีข้อความจะนับเป็น 0 พร้อมแสดงธงเพื่อทบทวน">
        <label className="relative mb-3 block"><Search size={15} className="absolute left-3 top-2.5 text-slate-400" /><input className="input !min-h-9 pl-9 text-xs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาอาจารย์ รายวิชา หรือแท็บ" /></label>
        <div className="table-wrap max-h-[290px]"><table className="data-table"><thead><tr><th>ชีต/แถว</th><th>อาจารย์</th><th>วิชา</th><th>ธง</th></tr></thead><tbody>{filteredFlags.slice(0, 200).map((row) => <tr key={row.id}><td>{row.sourceSheet}#{row.sourceRow}</td><td>{row.teacher}</td><td>{row.subject || "—"}</td><td>{[row.isCoTeach && "เรียนร่วม", row.isCoordinatorLoad && "ประสานงาน", row.isRefError && "#REF!"].filter(Boolean).join(", ")}</td></tr>)}</tbody></table>{!filteredFlags.length && <p className="p-4 text-sm text-slate-400">ไม่พบแถวที่มีธง</p>}</div>
      </Panel>
    </div>
    <Panel title="แถวซ้ำที่ควรทบทวนและ #REF!" subtitle="ตรวจด้วยคีย์ชีต + ชื่ออาจารย์ + รหัส/ชื่อวิชา; อาจเป็นการสอนซ้ำจริงได้" className="mt-5">
      <div className="grid gap-4 lg:grid-cols-2"><div><h3 className="mb-2 text-xs font-semibold">กลุ่มแถวที่มีรหัสวิชา/ชื่อ/อาจารย์ซ้ำ ({duplicateGroups.length})</h3><div className="max-h-[250px] overflow-auto text-xs">{duplicateGroups.slice(0, 100).map(({ key, rows }) => <p className="border-t border-slate-100 py-2 dark:border-white/10" key={key}>{key} · แถว {rows.join(", ")}</p>)}</div></div><div><h3 className="mb-2 text-xs font-semibold">ตำแหน่งเซลล์ #REF! ({refCells.length})</h3><div className="max-h-[250px] overflow-auto text-xs">{refCells.slice(0, 120).map((cell, index) => <p className="border-t border-slate-100 py-2 dark:border-white/10" key={index}>{cell.sheet} · แถว {cell.row} · คอลัมน์ {cell.column}</p>)}</div></div></div>
      <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200"><FileSearch size={14} className="mr-1 inline" />ชื่อที่อาจเป็นคนเดียวกัน: อภิชาติ / อภิชาต (เก็บ alias เริ่มต้นไว้ใน config; ตรวจยืนยันก่อนเปลี่ยนประวัติอย่างเป็นทางการ)</div>
    </Panel>
  </>;
}
