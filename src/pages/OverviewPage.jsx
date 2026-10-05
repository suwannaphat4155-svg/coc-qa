import { useMemo } from "react";
import { ArrowRight, BookOpen, GraduationCap, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip } from "recharts";
import { useDashboard } from "../context/DashboardContext.jsx";
import { getAnnualSeries, getPrimaryDetails, getSubjectRows, aggregateTeachers, calculateYearChange } from "../lib/analytics.js";
import { formatFtET, formatYear, formatCount } from "../lib/format.js";
import { ChartTooltip, MetricCard, PageHeading, Panel } from "../components/Ui.jsx";

const colors = { Comp: "#168cba", DE: "#16a394", Dbiz: "#e1a52c", AISE: "#8864c5", MsComp: "#d06484", CoC: "#163250" };

export default function OverviewPage() {
  const { snapshot, settings } = useDashboard();
  const { data, programs } = getAnnualSeries(snapshot);
  const details = getPrimaryDetails(snapshot);
  const teachers = aggregateTeachers(details);
  const subjects = getSubjectRows(details);
  const latest = data.at(-1) ?? {};
  const change = calculateYearChange(data);
  const ranked = programs.filter((program) => program !== "CoC" && latest[program] != null).sort((a, b) => latest[b] - latest[a]);
  const top = ranked[0];
  const low = ranked.at(-1);
  const detailCoverage = [...new Set(details.map(({ teacher }) => teacher))].length;
  const cards = [
    { label: "FTET วิทยาลัย ปีล่าสุด", value: formatFtET(latest.CoC, 3), note: `ปี ${formatYear(latest.year, settings.yearFormat === "buddhist")}`, icon: TrendingUp, change },
    { label: "หลักสูตร FTET สูงสุด", value: top ? formatFtET(latest[top], 3) : "—", note: top ?? "ไม่มีข้อมูล", icon: GraduationCap, accent: "blue" },
    { label: "หลักสูตร FTET ต่ำสุด", value: low ? formatFtET(latest[low], 3) : "—", note: low ?? "ไม่มีข้อมูล", icon: GraduationCap, accent: "amber" },
    { label: "อาจารย์ / รายวิชา", value: `${formatCount(detailCoverage)} / ${formatCount(subjects.length)}`, note: "จากแท็บรายละเอียดที่มีข้อมูล", icon: Users, accent: "violet" },
  ];

  return <>
    <PageHeading eyebrow="ภาพรวมคุณภาพการสอน" title="CoC QA Dashboard" description="ภาพรวมภาระการสอน FTET ของวิทยาลัยการคอมพิวเตอร์ จากสรุปปี/เทอมและรายละเอียดที่ตรวจสอบย้อนกลับได้" />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <MetricCard key={card.label} {...card} />)}</div>
    <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
      <Panel title="แนวโน้ม FTET รายหลักสูตร" subtitle="เส้นประแสดงเป้าหมายที่ตั้งไว้ในหน้า Settings" action={<Link to="/courses" className="inline-flex items-center gap-1 text-xs font-semibold text-teal">ดูรายละเอียด <ArrowRight size={14} /></Link>}>
        <div className="h-[320px]">
          {data.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 12, right: 16, left: -16, bottom: 0 }}>
            <defs>{programs.map((name) => <linearGradient key={name} id={`fill-${name}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={colors[name]} stopOpacity={0.22} /><stop offset="95%" stopColor={colors[name]} stopOpacity={0} /></linearGradient>)}</defs>
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={settings.target} stroke="#111111" strokeDasharray="5 4" label={{ value: "Target", position: "insideTopRight", fill: "#111111", fontSize: 11 }} />
            {programs.map((name) => <Area key={name} type="monotone" dataKey={name} name={name} stroke={colors[name]} strokeWidth={name === "CoC" ? 3 : 2} strokeDasharray={name === "CoC" ? "6 3" : undefined} fill={`url(#fill-${name})`} connectNulls={false} dot={{ r: 2 }} />)}
          </AreaChart></ResponsiveContainer> : <p className="p-8 text-center text-sm text-slate-400">ไม่มีข้อมูลสรุป FTET</p>}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-4 dark:border-white/10">{programs.map((name) => <span key={name} className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"><i className="h-2.5 w-2.5 rounded-full" style={{ background: colors[name] }} />{name}</span>)}</div>
        <p className="mt-3 text-[11px] text-slate-400">AISE มีข้อมูลตั้งแต่ปี 2567 · CoC เฉลี่ย Comp, DE, Dbiz และ MsComp (ไม่รวม AISE)</p>
      </Panel>
      <Panel title="ภาพรวมหลักสูตรปีล่าสุด" subtitle={`ค่าที่แสดง: ปีการศึกษา ${formatYear(latest.year, settings.yearFormat === "buddhist")}`}>
        <div className="space-y-4">
          {ranked.map((program) => <div key={program}>
            <div className="mb-1.5 flex justify-between text-xs"><span className="font-medium">{program}</span><span className="tabular-nums text-slate-500">{formatFtET(latest[program], 3)}</span></div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full" style={{ width: `${Math.min(100, latest[program] / Math.max(0.8, settings.target * 1.5) * 100)}%`, backgroundColor: colors[program] }} /></div>
          </div>)}
        </div>
        <div className="mt-6 rounded-xl border border-dashed border-teal/30 bg-teal/5 p-4 text-xs leading-6 text-slate-600 dark:text-slate-300">
          <div className="font-semibold text-ink dark:text-white">เป้าหมาย FTET ที่ตั้งไว้</div>
          <div>{formatFtET(settings.target, 3)} FTET · จุดข้อมูลต่ำกว่า/สูงกว่าเกณฑ์จะแสดงแยกในหน้าหลักสูตรและรายอาจารย์</div>
        </div>
      </Panel>
    </div>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <Panel title="สรุปแนวโน้ม" subtitle="ข้อความอัตโนมัติจากค่าปีล่าสุดเทียบปีก่อน">
        <div className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-white/5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal/10 text-teal"><TrendingUp size={18} /></span><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{change == null ? "มีข้อมูลรายปีไม่เพียงพอสำหรับคำนวณการเปลี่ยนแปลง" : `FTET เฉลี่ยของวิทยาลัย ${change >= 0 ? "เพิ่มขึ้น" : "ลดลง"} ${formatFtET(Math.abs(change), 3)} จากปีก่อน ค่าเป้าหมายปัจจุบันคือ ${formatFtET(settings.target, 3)} FTET.`}</p></div>
        <div className="mt-3 flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-white/5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300"><BookOpen size={18} /></span><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">มีรายละเอียดรายอาจารย์/รายวิชาจากปี 2561–2563 และ 2567; ปี 2564–2566 มีเฉพาะตารางสรุป</p></div>
      </Panel>
      <Panel title="ภาพเล็กตามหลักสูตร" subtitle="คลิกเพื่อไปยังกราฟเปรียบเทียบรายหลักสูตร">
        <div className="grid grid-cols-2 gap-3">{programs.filter((name) => name !== "CoC").map((name) => <Link to="/courses" key={name} className="rounded-xl border border-slate-100 p-3 hover:border-teal/40 dark:border-white/10"><div className="mb-1 flex items-center justify-between text-xs font-semibold"><span>{name}</span><span className="text-slate-500">{formatFtET(latest[name], 2)}</span></div><div className="h-[52px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><Tooltip content={<ChartTooltip />} /><Area dataKey={name} stroke={colors[name]} fill={colors[name]} fillOpacity={0.1} connectNulls={false} /></AreaChart></ResponsiveContainer></div></Link>)}</div>
      </Panel>
    </div>
  </>;
}
