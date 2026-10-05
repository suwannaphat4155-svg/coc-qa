import { AlertCircle, ArrowDownRight, ArrowUpRight, Database, FileDown, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { formatFtET } from "../lib/format.js";
import { downloadChartPng, downloadCsv } from "../lib/data.js";
import { useDashboard } from "../context/DashboardContext.jsx";

export function PageHeading({ eyebrow, title, description, action }) {
  return <div className="mb-6 border-b-2 border-black pb-5 dark:border-white/70"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{eyebrow ?? "QUALITY ASSURANCE / DATA WORKBENCH"}</p><h1 className="text-2xl font-black tracking-tight text-black dark:text-white sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>}</div>{action}</div></div>;
}

export function Panel({ title, subtitle, action, children, className = "" }) {
  return <section className={`border-2 border-black bg-white p-5 shadow-panel dark:border-white/70 dark:bg-[#17202b] ${className}`}><div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-black pb-3 dark:border-white/40"><div><h2 className="font-bold uppercase tracking-[.04em] text-black dark:text-white">{title}</h2>{subtitle && <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{subtitle}</p>}</div>{action}</div>{children}</section>;
}

export function MetricCard({ label, value, note, icon: Icon = Database, change, accent = "teal" }) {
  const up = Number(change) >= 0;
  const classes = { teal: "bg-teal/10 text-teal", blue: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300", amber: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300", violet: "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300" };
  return <div className="border-2 border-black bg-white p-4 shadow-panel dark:border-white/70 dark:bg-[#17202b]"><div className="flex items-start justify-between"><span className="text-xs font-bold uppercase tracking-[.05em] text-slate-600 dark:text-slate-300">{label}</span><span className={`grid h-8 w-8 border border-black ${classes[accent]}`}><Icon size={16} /></span></div><div className="mt-3 text-2xl font-black tracking-tight text-black dark:text-white">{value}</div><div className="mt-2 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">{change != null && <span className={`inline-flex items-center font-bold ${up ? "text-emerald-700" : "text-rose-700"}`}>{up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{formatFtET(Math.abs(change), 3)}</span>}{note}</div></div>;
}

export function DataState({ children, empty = false }) {
  const { loading, error, snapshot } = useDashboard();
  if (loading) return <div className="grid min-h-40 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 dark:border-white/10 dark:bg-[#14243a]"><span className="inline-flex items-center gap-2"><LoaderCircle className="animate-spin" size={18} />กำลังโหลดข้อมูลจากทุกแท็บ…</span></div>;
  if (error && !snapshot) return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"><AlertCircle className="mb-2" size={18} />{error}</div>;
  if (empty) return <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">ไม่มีข้อมูลในช่วงที่เลือก</div>;
  return children;
}

export function ExportButton({ filename, rows, label = "ส่งออก CSV" }) {
  return <button onClick={() => downloadCsv(filename, rows)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"><FileDown size={14} />{label}</button>;
}

export function ExportPngButton({ selector, filename, label = "ส่งออก PNG" }) {
  const [status, setStatus] = useState("");
  const handleExport = async () => {
    setStatus("");
    try {
      await downloadChartPng(selector, filename);
      setStatus("เตรียมไฟล์ PNG แล้ว");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "ส่งออกกราฟไม่สำเร็จ");
    }
  };
  return <div className="flex flex-col items-end gap-1"><button onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"><FileDown size={14} />{label}</button>{status && <span role="status" className="text-[10px] text-slate-500">{status}</span>}</div>;
}

export function ChartTooltip({ active, payload, label, unit = " FTET" }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl dark:border-white/10 dark:bg-[#0d192b]"><div className="mb-1 font-semibold text-ink dark:text-white">{label}</div>{payload.map((item) => <div key={item.dataKey} className="flex justify-between gap-6 py-0.5" style={{ color: item.color }}><span>{item.name}</span><b>{formatFtET(item.value, 3)}{unit}</b></div>)}</div>;
}
