import { describe, it, expect } from "vitest";
import { parseDashboardSpec } from "./dashboardFile";

describe("parseDashboardSpec", () => {
  const validSpec = {
    id: "d1",
    title: "Test",
    columns: 12,
    layout: { items: [{ id: "p1", x: 0, y: 0, w: 6, h: 2 }] },
    panels: [{ id: "p1", type: "text", options: {} }],
  };

  it("유효한 JSON이면 DashboardSpec 반환", () => {
    const parsed = parseDashboardSpec(JSON.stringify(validSpec));
    expect(parsed.id).toBe("d1");
    expect(parsed.title).toBe("Test");
    expect(parsed.panels).toHaveLength(1);
    expect(parsed.layout.items).toHaveLength(1);
  });

  it("id 없으면 예외", () => {
    const invalid = { ...validSpec, id: 123 };
    expect(() => parseDashboardSpec(JSON.stringify(invalid))).toThrow(
      /missing or invalid id/,
    );
  });

  it("panels가 배열이 아니면 예외", () => {
    const invalid = { ...validSpec, panels: {} };
    expect(() => parseDashboardSpec(JSON.stringify(invalid))).toThrow(
      /missing or invalid panels/,
    );
  });

  it("layout.items 없으면 예외", () => {
    const invalid = { ...validSpec, layout: {} };
    expect(() => parseDashboardSpec(JSON.stringify(invalid))).toThrow(
      /missing or invalid layout.items/,
    );
  });

  it("잘못된 JSON이면 예외", () => {
    expect(() => parseDashboardSpec("not json")).toThrow();
  });
});
