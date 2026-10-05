export const formatFtET = (value, digits = 3) =>
  value == null || value === "" || !Number.isFinite(Number(value))
    ? "—"
    : Number(value).toLocaleString("th-TH", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const formatYear = (year, buddhist = true) => {
  if (!year) return "—";
  return String(buddhist ? Number(year) : Number(year) - 543);
};

export const formatCount = (value) => Number(value || 0).toLocaleString("th-TH");

export const formatShortName = (name) =>
  String(name ?? "")
    .replace(/^(ศ\.|รศ\.|ผศ\.)/g, "")
    .replace(/ดร\./g, "")
    .trim();
