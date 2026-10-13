import { describe, expect, it } from "vitest";
import { getPrimaryDetails } from "./analytics.js";

describe("primary teacher details", () => {
  it("keeps generic detail rows once and merges curriculum tags from matching tabs", () => {
    const shared = {
      year: 2567,
      semester: 1,
      teacher: "อาจารย์ทดสอบ",
      courseCode: "101-100",
      subject: "Intro to Computing",
      section: 1,
      lecture: 2,
      practical: 0,
      project: 0,
      weeks: 15,
    };
    const result = getPrimaryDetails({
      details: [
        { ...shared, sourceSheet: "FTET_1-2567", programs: ["Comp"] },
        { ...shared, sourceSheet: "FTET_1-2567_MsComp", programs: ["Comp", "MsComp"] },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].programs).toEqual(["Comp", "MsComp"]);
  });
});
