import { normalizeWorkbook, parseCsv } from "./normalize.js";

const SHEET_ID = import.meta.env.VITE_SHEET_ID;

async function loadSnapshot() {
  const response = await fetch("/data/snapshot.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`โหลด snapshot ไม่สำเร็จ (${response.status})`);
  return response.json();
}

async function runLimited(items, limit, task) {
  const output = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        output[index] = await task(items[index], index);
      }
    }),
  );
  return output;
}

async function fetchLiveWorkbook(snapshot) {
  const statuses = [];
  const tabs = await runLimited(snapshot.workbook, 5, async (tab) => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(SHEET_ID)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab.name)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rows = parseCsv(await response.text());
      if (!rows.length) throw new Error("ชีตไม่มีข้อมูลหรือยังไม่ได้แชร์");
      statuses.push({ name: tab.name, source: "live", ok: true });
      return { name: tab.name, rows };
    } catch (error) {
      statuses.push({ name: tab.name, source: "snapshot", ok: false, error: error.message });
      return { name: tab.name, rows: tab.rows };
    }
  });
  return { data: normalizeWorkbook(tabs), statuses };
}

export async function loadDashboardData({ refresh = false } = {}) {
  const snapshot = await loadSnapshot();
  if (!SHEET_ID) {
    return {
      data: snapshot,
      statuses: snapshot.workbook.map(({ name }) => ({ name, source: "snapshot", ok: true })),
    };
  }
  if (!refresh && snapshot.workbook.length === 0) {
    throw new Error("ไม่พบข้อมูลใน snapshot สำหรับ fallback");
  }
  return fetchLiveWorkbook(snapshot);
}

export function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell ?? "");
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    anchor.remove();
  }, 1000);
}

export async function downloadChartPng(selector, filename) {
  const source = document.querySelector(selector);
  if (!source || source.tagName.toLowerCase() !== "svg") throw new Error("ไม่พบกราฟ SVG สำหรับส่งออก");
  const svg = source.cloneNode(true);
  const bounds = source.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  const svgBlob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(svgBlob);
  try {
    const image = new Image();
    image.src = objectUrl;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("แปลงกราฟเป็นภาพไม่สำเร็จ"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("เบราว์เซอร์ไม่รองรับ canvas");
    context.scale(2, 2);
    context.fillStyle = getComputedStyle(document.body).backgroundColor || "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const png = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!png) throw new Error("สร้างไฟล์ PNG ไม่สำเร็จ");
    const pngUrl = URL.createObjectURL(png);
    const anchor = document.createElement("a");
    anchor.href = pngUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(pngUrl);
      anchor.remove();
    }, 1000);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function getTab(snapshot, name) {
  return snapshot?.workbook?.find((tab) => tab.name.trim() === name.trim());
}
