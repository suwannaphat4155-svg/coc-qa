import { describe, expect, it } from "vitest";
import { averageCollegeFtET, calculateFtET, calculateFtes, calculateTeachingLoad } from "./ftet.js";
import { formatFtET } from "./format.js";

describe("FTET calculations", () => {
  it("calculates three lecture hours as 0.1714 FTET", () => {
    expect(calculateFtET({ lecture: 3 })).toBeCloseTo(0.1714, 4);
  });

  it("calculates two lecture and two practical hours as 0.2 FTET", () => {
    expect(calculateFtET({ lecture: 2, practical: 2 })).toBeCloseTo(0.2, 4);
  });

  it("calculates one project hour as 0.02857 FTET", () => {
    expect(calculateFtET({ project: 1 })).toBeCloseTo(0.02857, 5);
  });

  it("uses explicit teaching periods and excludes co-teaching and coordinator loads", () => {
    expect(calculateFtET({ lecture: 3, weeks: 8 })).toBeCloseTo(0.09143, 5);
    expect(calculateFtET({ lecture: 3, weeks: 5 })).toBeCloseTo(0.05714, 5);
    expect(calculateFtET({ lecture: 3, isCoTeach: true })).toBe(0);
    expect(calculateFtET({ project: 2, isCoordinatorLoad: true })).toBe(0);
  });

  it("averages 2562 non-AISE programs for the CoC value", () => {
    expect(averageCollegeFtET({ Comp: 0.49, DE: 0.5, Dbiz: 0.46, MsComp: 0.43, AISE: 0.99 })).toBeCloseTo(0.47, 2);
    expect(averageCollegeFtET({ year: 2562, Comp: 0.49, DE: 0.5, Dbiz: 0.46, MsComp: 0.43, AISE: 0.99 })).toBeCloseTo(0.47, 2);
    expect(averageCollegeFtET({ Comp: 0.49, DE: 0.5, Dbiz: 0.46, MsComp: null })).toBeNull();
  });

  it("calculates FTES and teaching load using workbook formulas", () => {
    expect(calculateFtes(3, 36)).toBe(6);
    expect(calculateFtes(3, 36, "graduate")).toBe(9);
    expect(calculateTeachingLoad(2, 2, 1)).toBe(3);
  });

  it("keeps missing values distinct from zero", () => {
    expect(formatFtET(null)).toBe("—");
    expect(formatFtET(0)).toBe("0.000");
  });
});
