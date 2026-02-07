import type { GridItem } from "@dashboardity/layout-core";
import type { BreakpointKey, BreakpointWidths, ColumnsByBreakpoint } from "./types";

/** 기본 브레이크포인트 너비(px). base=0, sm~xl 지정 가능 */
export const DEFAULT_BREAKPOINT_WIDTHS: Required<
  Record<Exclude<BreakpointKey, "base">, number>
> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

const BREAKPOINT_ORDER: BreakpointKey[] = ["base", "sm", "md", "lg", "xl"];

/**
 * 뷰포트 너비(px)와 브레이크포인트 설정으로 현재 브레이크포인트 키 반환.
 * width >= 해당 구간 최소값인 가장 큰 브레이크포인트.
 */
export const getBreakpointKey = (
  widthPx: number,
  breakpoints: BreakpointWidths = {},
): BreakpointKey => {
  const widths = { ...DEFAULT_BREAKPOINT_WIDTHS, ...breakpoints };
  let current: BreakpointKey = "base";
  for (const key of BREAKPOINT_ORDER) {
    if (key === "base") continue;
    if (widthPx >= widths[key]) current = key;
  }
  return current;
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
  const key = getBreakpointKey(widthPx, breakpoints);
  const order = BREAKPOINT_ORDER.slice(0, BREAKPOINT_ORDER.indexOf(key) + 1);
  for (let i = order.length - 1; i >= 0; i--) {
    const v = columns[order[i]];
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
    const x = Math.min(
      toCols - 1,
      Math.max(0, Math.round(item.x * scaleX)),
    );
    const w = Math.max(
      1,
      Math.min(toCols - x, Math.round(item.w * scaleX)),
    );
    return { ...item, x, w, y: item.y, h: item.h };
  });
};
