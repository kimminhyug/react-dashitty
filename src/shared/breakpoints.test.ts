import { describe, it, expect } from "vitest";
import {
  getBreakpointKey,
  resolveColumns,
  DEFAULT_BREAKPOINT_WIDTHS,
} from "./breakpoints";

describe("getBreakpointKey", () => {
  it("width 0이면 base", () => {
    expect(getBreakpointKey(0)).toBe("base");
  });
  it("width 639면 base", () => {
    expect(getBreakpointKey(639)).toBe("base");
  });
  it("width 640 이상이면 sm", () => {
    expect(getBreakpointKey(640)).toBe("sm");
    expect(getBreakpointKey(767)).toBe("sm");
  });
  it("width 1280 이상이면 xl", () => {
    expect(getBreakpointKey(1280)).toBe("xl");
    expect(getBreakpointKey(1535)).toBe("xl");
  });
  it("width 1536 이상이면 xxl", () => {
    expect(getBreakpointKey(1536)).toBe("xxl");
    expect(getBreakpointKey(2000)).toBe("xxl");
  });
  it("사용자 정의 breakpoint가 있으면 너비 순으로 반영됨", () => {
    expect(getBreakpointKey(800, { a4: 794 })).toBe("a4");
    expect(getBreakpointKey(793, { a4: 794 })).toBe("md");
    expect(getBreakpointKey(795, { a4: 794 })).toBe("a4");
  });
});

describe("resolveColumns", () => {
  it("columns가 number면 그대로 반환", () => {
    expect(resolveColumns(500, 12)).toBe(12);
    expect(resolveColumns(2000, 24)).toBe(24);
  });
  it("columns가 object면 breakpoint에 맞는 열 수 반환", () => {
    expect(resolveColumns(320, { base: 4, sm: 6, md: 8, lg: 12, xl: 12, xxl: 24 })).toBe(4);
    expect(resolveColumns(700, { base: 4, sm: 6, md: 8, lg: 12, xl: 12, xxl: 24 })).toBe(6);
    expect(resolveColumns(1100, { base: 4, sm: 6, md: 8, lg: 12, xl: 12, xxl: 24 })).toBe(12);
    expect(resolveColumns(1600, { base: 4, sm: 6, md: 8, lg: 12, xl: 12, xxl: 24 })).toBe(24);
  });
  it("사용자 정의 breakpoint 열 수 반영", () => {
    const breakpoints = { a4: 794 };
    const columns = { base: 1, sm: 4, md: 6, a4: 8, lg: 12 };
    expect(resolveColumns(800, columns, breakpoints)).toBe(8);
    expect(resolveColumns(793, columns, breakpoints)).toBe(6);
  });
});
