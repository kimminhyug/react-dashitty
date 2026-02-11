import type { GridItem } from "@dashboardity/layout-core";
import type {
  BreakpointKey,
  BreakpointWidths,
  ColumnsByBreakpoint,
} from "./types";

/** 기본 브레이크포인트 너비(px). base=0, sm~xxl 지정 가능 */
export const DEFAULT_BREAKPOINT_WIDTHS: Required<
  Record<Exclude<BreakpointKey, "base">, number>
> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
};

/**
 * breakpoints 객체에서 base 제외한 키를 너비 오름차순으로 정렬한 순서 반환.
 * 사용자 정의 breakpoint(예: a4)도 포함되어 입력값이 실제로 반영된다.
 */
const getBreakpointOrder = (widths: Record<string, number>): string[] => {
  const rest = Object.entries(widths).filter(
    (entry): entry is [string, number] =>
      entry[0] !== "base" && typeof entry[1] === "number",
  );
  rest.sort((a, b) => a[1] - b[1]);
  return ["base", ...rest.map(([k]) => k)];
};

/**
 * 뷰포트 너비(px)와 브레이크포인트 설정으로 현재 브레이크포인트 키 반환.
 * 스펙에 breakpoints.base(숫자)가 있으면 width < base 일 때만 "base" 사용.
 * 없으면 width < sm 일 때 "base". 그 외는 width >= 해당 구간 최소값인 가장 큰 키.
 * 사용자 정의 breakpoints/키(예: xxl, a4)가 있으면 너비 순으로 반영된다.
 */
export const getBreakpointKey = (
  widthPx: number,
  breakpoints: BreakpointWidths = {},
): BreakpointKey => {
  const widths = { ...DEFAULT_BREAKPOINT_WIDTHS, ...breakpoints } as Record<
    string,
    number
  >;
  const baseMax = widths.base;
  if (baseMax != null && widthPx < baseMax) return "base";
  const order = getBreakpointOrder(widths);
  let current: string = "base";
  for (const key of order) {
    if (key === "base") continue;
    const w = widths[key];
    if (w != null && widthPx >= w) current = key;
  }
  return current as BreakpointKey;
};

/**
 * 뷰포트 너비와 columns 설정으로 사용할 열 수 반환.
 * columns가 number면 그대로, object면 breakpoint에 맞는 값(없으면 이전 구간 값 사용).
 */
export const resolveColumns = (
  widthPx: number,
  columns: number | ColumnsByBreakpoint,
  breakpoints: BreakpointWidths = {},
): number => {
  if (typeof columns === "number") return columns;
  const widths = { ...DEFAULT_BREAKPOINT_WIDTHS, ...breakpoints } as Record<
    string,
    number
  >;
  const key = getBreakpointKey(widthPx, breakpoints);
  const fullOrder = getBreakpointOrder(widths);
  const keyIndex = fullOrder.indexOf(key);
  const order = keyIndex >= 0 ? fullOrder.slice(0, keyIndex + 1) : fullOrder;
  for (let i = order.length - 1; i >= 0; i--) {
    const v = (columns as Record<string, number>)[order[i]];
    if (v != null && v > 0) return v;
  }
  return columns.base ?? 12;
};

/**
 * 그리드 아이템 좌표를 fromCols 열 그리드에서 toCols 열 그리드로 스케일.
 * 레이아웃 스토어 columns 변경 시 호출.
 */
export const scaleLayout = (
  items: GridItem[],
  fromCols: number,
  toCols: number,
): GridItem[] => {
  if (fromCols <= 0 || toCols <= 0) return items;
  if (fromCols === toCols) return items;
  const scaleX = toCols / fromCols;
  return items.map((item) => {
    const x = Math.min(toCols - 1, Math.max(0, Math.round(item.x * scaleX)));
    const w = Math.max(1, Math.min(toCols - x, Math.round(item.w * scaleX)));
    return { ...item, x, w, y: item.y, h: item.h };
  });
};
