import { describe, expect, it } from "vitest";
import { normalizeTeacherName, normalizeWorkbook } from "./normalize.js";

describe("workbook normalization", () => {
  it("normalizes alias names and removes coordinator suffixes", () => {
    expect(normalizeTeacherName("  รศ.ดร.อภิชาต หีดนาคราม (ผู้ประสานงาน)  ")).toBe("รศ.ดร.อภิชาติ หีดนาคราม");
    expect(normalizeTeacherName("ผศ.ดร.กาญจนา  เหล่าเส็น*")).toBe("ผศ.ดร.กาญจนา เหล่าเส็น");
  });

  it("detects headers by labels, forward-fills teachers, and flags co-teaching text", () => {
    const rows = [
      ["ตาราง FTET"],
      [],
      ["ลำดับ", "อาจารย์", "รหัสวิชา", "ชื่อวิชา", "จำนวน", null, "จำนวน", "จำนวน", "จำนวน", "จำนวน", "จำนวน", "FTET", "FTETS", "สาขา"],
      ["ที่", null, null, null, "หน่วยกิต", null, "section", "ชั่วโมงบรรยาย", "ชั่วโมงปฏิบัติ", "โครงงาน", "สัปดาห์", "สูตร", null, null],
      ["1", "อาจารย์ ทดสอบ", "001", "วิชาทดสอบ", "3(2-2-5)", null, "1", "2", "2", "0", "15", "0.20", null, "Comp"],
      [null, null, "002", "เรียนร่วม", "3(2-2-5)", null, "1", "เรียนร่วมกับ 002", "0", "0", "15", "0.00", "0.20", "Comp"],
      [null, null, "003", "ไม่มี section และสัปดาห์", "3(2-2-5)", null, null, "3", "0", "0", null, "0.00", null, "Comp"],
      [null, null, "004", "Course Midterm", "3(2-2-5)", null, "1", "3", "0", "0", "15", null, null, "Comp"],
      [null, null, "005", "Course Module", "3(2-2-5)", null, "1", "3", "0", "0", "15", null, null, "Comp"],
      [null, null, "006", "Co-taught numeric load", "3(2-2-5)", null, "1", "3", "0", "0", "15", null, null, "เรียนร่วมกับ 006"],
      [null, null, "007", "Coordinator numeric load", "3(2-2-5)", null, "1", "0", "0", "2", "15", null, null, "คิดโหลดประสานงาน"],
    ];
    const result = normalizeWorkbook([{ name: "FTET_1-2567", rows }]);
    expect(result.details).toHaveLength(7);
    expect(result.details[1].teacher).toBe("อาจารย์ ทดสอบ");
    expect(result.details[1].isCoTeach).toBe(true);
    expect(result.details[1].sourceFtets).toBe(0.2);
    expect(result.details[0].ftet).toBeCloseTo(0.2, 5);
    expect(result.details[2].ftet).toBeCloseTo(0.17143, 5);
    expect(result.details[2].section).toBe(1);
    expect(result.details[2].weeks).toBe(15);
    expect(result.details[3].weeks).toBe(8);
    expect(result.details[3].ftet).toBeCloseTo(0.09143, 5);
    expect(result.details[4].weeks).toBe(5);
    expect(result.details[4].ftet).toBeCloseTo(0.05714, 5);
    expect(result.details[5].ftet).toBe(0);
    expect(result.details[6].ftet).toBe(0);
  });
});
