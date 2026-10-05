import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadDashboardData } from "../lib/data.js";
import { DEFAULT_CONSTANTS } from "../lib/ftet.js";
import { normalizeTeacherName } from "../lib/normalize.js";
import { teacherAliases } from "../config/aliases.js";

const DashboardContext = createContext(null);
const SETTINGS_KEY = "coc-qa-dashboard-settings";

const defaultSettings = {
  constants: DEFAULT_CONSTANTS,
  target: 0.5,
  overloadThreshold: 0.65,
  yearFormat: "buddhist",
  theme: "light",
  teacherThreshold: 0.5,
  aliases: teacherAliases,
};

function readSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return {
      ...defaultSettings,
      ...stored,
      constants: { ...DEFAULT_CONSTANTS, ...stored.constants },
      aliases: { ...teacherAliases, ...stored.aliases },
    };
  } catch (error) {
    console.warn("Dashboard settings were invalid; defaults are in use.", error);
    return defaultSettings;
  }
}

export function DashboardProvider({ children }) {
  const [snapshot, setSnapshot] = useState(null);
  const [tabStatuses, setTabStatuses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState(readSettings);
  const effectiveSnapshot = useMemo(() => {
    if (!snapshot) return null;
    const aliases = settings.aliases ?? teacherAliases;
    return {
      ...snapshot,
      details: (snapshot.details ?? []).map((record) => ({
        ...record,
        teacher: aliases[record.teacherRaw] ?? normalizeTeacherName(record.teacherRaw ?? record.teacher),
      })),
    };
  }, [snapshot, settings.aliases]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await loadDashboardData({ refresh: true });
      setSnapshot(result.data);
      setTabStatuses(result.statuses);
      setError("");
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      return false;
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates) => setSettings((current) => ({ ...current, ...updates }));
  const resetSettings = () => setSettings({ ...defaultSettings, constants: { ...DEFAULT_CONSTANTS }, aliases: { ...teacherAliases } });
  const value = useMemo(
    () => ({ snapshot: effectiveSnapshot, tabStatuses, error, loading, refreshing, refresh, settings, updateSettings, resetSettings }),
    [effectiveSnapshot, tabStatuses, error, loading, refreshing, refresh, settings, resetSettings],
  );
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used inside DashboardProvider");
  return context;
}
