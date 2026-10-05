import { lazy } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Calculator,
  ChartNoAxesCombined,
  ClipboardCheck,
  GitCompareArrows,
  GraduationCap,
  Settings,
  UsersRound,
} from "lucide-react";

export const routes = [
  { path: "/", label: "ภาพรวม", icon: ChartNoAxesCombined, group: "หลัก", page: lazy(() => import("../pages/OverviewPage.jsx")) },
  { path: "/courses", label: "FTET รายหลักสูตร", icon: BarChart3, group: "หลัก", page: lazy(() => import("../pages/CoursesPage.jsx")) },
  { path: "/teachers", label: "รายอาจารย์", icon: UsersRound, group: "หลัก", page: lazy(() => import("../pages/TeachersPage.jsx")) },
  { path: "/subjects", label: "รายวิชา", icon: BookOpen, group: "หลัก", page: lazy(() => import("../pages/SubjectsPage.jsx")) },
  { path: "/load", label: "องค์ประกอบโหลด", icon: Activity, group: "วิเคราะห์", page: lazy(() => import("../pages/LoadPage.jsx")) },
  { path: "/compare", label: "เปรียบเทียบ", icon: GitCompareArrows, group: "วิเคราะห์", page: lazy(() => import("../pages/ComparePage.jsx")) },
  { path: "/method", label: "วิธีคำนวณ", icon: Calculator, group: "เครื่องมือ", page: lazy(() => import("../pages/MethodPage.jsx")) },
  { path: "/quality", label: "ตรวจสอบข้อมูล", icon: ClipboardCheck, group: "เครื่องมือ", page: lazy(() => import("../pages/QualityPage.jsx")) },
  { path: "/tools", label: "เครื่องมือ FTES", icon: GraduationCap, group: "เครื่องมือ", page: lazy(() => import("../pages/ToolsPage.jsx")) },
  { path: "/settings", label: "ตั้งค่า", icon: Settings, group: "ระบบ", page: lazy(() => import("../pages/SettingsPage.jsx")) },
];
