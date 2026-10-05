import { Suspense } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { routes } from "./config/routes.js";
import { DashboardProvider } from "./context/DashboardContext.jsx";

export default function App() {
  return <DashboardProvider><HashRouter><Suspense fallback={<div role="status" className="grid min-h-screen place-items-center text-sm text-slate-500">กำลังเปิดหน้า…</div>}><Routes><Route element={<Layout />}>{routes.map(({ path, page: Page }) => <Route key={path} path={path} element={<Page />} />)}<Route path="*" element={<Navigate to="/" replace />} /></Route></Routes></Suspense></HashRouter></DashboardProvider>;
}
