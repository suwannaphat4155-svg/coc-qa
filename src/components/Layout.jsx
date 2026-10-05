import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Database, Menu, RefreshCw, ShieldCheck, X } from "lucide-react";
import { routes } from "../config/routes.js";
import { useDashboard } from "../context/DashboardContext.jsx";
import { DataState } from "./Ui.jsx";

export default function Layout() {
  const { snapshot, refresh, refreshing, tabStatuses } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = [...new Set(routes.map(({ group }) => group))];
  const liveCount = tabStatuses.filter(({ source }) => source === "live").length;

  return (
    <div className="min-h-screen bg-[#f6f5f1] text-slate-900 dark:bg-[#111820] dark:text-slate-100">
      {mobileOpen && <button className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="ปิดเมนู" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r-2 border-black bg-[#fdfcf8] text-black transition-transform dark:border-white/70 dark:bg-[#17202b] dark:text-white lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b-2 border-black px-5 py-4 dark:border-white/70">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center border-2 border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"><Database size={19} /></div>
            <div><div className="font-bold tracking-tight">CoC / QA</div><div className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">Data workbench</div></div>
          </div>
          <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="ปิดเมนู"><X size={19} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {groups.map((group) => (
            <div key={group} className="mb-5">
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.15em] text-slate-500">{group}</p>
              {routes.filter((route) => route.group === group).map(({ path, label, icon: Icon }) => (
                <NavLink key={path} to={path} end={path === "/"} onClick={() => setMobileOpen(false)} className={({ isActive }) => `mb-1 flex items-center gap-3 border-2 px-3 py-2 text-sm transition ${isActive ? "border-black bg-black font-bold text-white dark:border-white dark:bg-white dark:text-black" : "border-transparent text-slate-600 hover:border-black hover:bg-white dark:text-slate-300 dark:hover:border-white dark:hover:bg-white/10"}`}>
                  <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-300"><ShieldCheck size={15} className="text-teal" />ข้อมูลพร้อมตรวจสอบย้อนกลับ</div>
          <div className="mt-2 text-[11px] text-slate-400">{snapshot?.tabCount ?? snapshot?.workbook?.length ?? 0} แท็บ · {liveCount ? `Live ${liveCount} แท็บ` : "Snapshot"}</div>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b-2 border-black bg-[#fdfcf8]/95 px-4 backdrop-blur dark:border-white/70 dark:bg-[#17202b]/95 sm:px-8">
          <button className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="เปิดเมนู"><Menu size={20} /></button>
          <div className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">ระบบสารสนเทศเพื่อการประกันคุณภาพการศึกษา</div>
          <button onClick={refresh} disabled={refreshing} className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-sm font-bold hover:bg-black hover:text-white disabled:opacity-60 dark:border-white dark:bg-transparent">
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />{refreshing ? "กำลังรีเฟรช" : "รีเฟรชข้อมูล"}
          </button>
        </header>
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8"><DataState><Outlet /></DataState></main>
      </div>
    </div>
  );
}
