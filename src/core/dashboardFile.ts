import type { DashboardSpec } from "../shared";

/**
 * 현재 대시보드 스펙을 JSON 파일로 다운로드.
 * ref.export()로 얻은 스펙을 넘기거나, 직접 스펙 객체 전달.
 */
export const downloadDashboardSpec = (
  spec: DashboardSpec,
  filename?: string,
): void => {
  const base =
    filename ?? `${(spec.title ?? "dashboard").replace(/\s+/g, "-")}-${spec.id}`;
  const name = base.endsWith(".json") ? base : `${base}.json`;
  const blob = new Blob([JSON.stringify(spec, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.endsWith(".json") ? name : `${name}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * JSON 문자열을 DashboardSpec으로 파싱.
 * 잘못된 JSON이면 예외. 형식 검증은 최소한(id, layout, panels 존재).
 */
export const parseDashboardSpec = (json: string): DashboardSpec => {
  const raw = JSON.parse(json) as unknown;
  if (raw == null || typeof raw !== "object")
    throw new Error("Invalid dashboard JSON: not an object");
  const spec = raw as Record<string, unknown>;
  if (typeof spec.id !== "string")
    throw new Error("Invalid dashboard JSON: missing or invalid id");
  if (typeof spec.title !== "string")
    throw new Error("Invalid dashboard JSON: missing or invalid title");
  if (!Array.isArray(spec.panels))
    throw new Error("Invalid dashboard JSON: missing or invalid panels");
  const layout = spec.layout as unknown;
  if (layout == null || typeof layout !== "object" || !Array.isArray((layout as { items?: unknown }).items))
    throw new Error("Invalid dashboard JSON: missing or invalid layout.items");
  return raw as DashboardSpec;
};
