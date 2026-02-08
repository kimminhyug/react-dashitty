import { useCallback, useEffect, useState } from "react";
import { resolveColumns } from "../shared/breakpoints";
import type { BreakpointWidths, ColumnsByBreakpoint } from "../shared/types";

/** 측정 전·오류 시(너비 0) 사용할 폴백 너비. 0을 GridLayout에 넘기지 않기 위함 */
const FALLBACK_WIDTH = 320;

/** flex 등으로 부모가 비정상 확장될 때 쓰는 상한. 뷰포트 너비로 제한 */
const getViewportWidth = (): number =>
  typeof document !== "undefined" ? document.documentElement.clientWidth : 0;

/** 컨테이너 너비(px). ResizeObserver로 갱신. 초기 0일 수 있음. */
export const useContainerWidth = (
  containerRef: React.RefObject<HTMLDivElement | null>,
): number => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = (): void =>
      setWidth((w) => {
        const next = Math.round(el.getBoundingClientRect().width);
        return w === next ? w : next;
      });
    update(); // 즉시 1회
    let rafId2: number | undefined;
    const rafId = requestAnimationFrame(() => {
      update();
      rafId2 = requestAnimationFrame(update); // flex 레이아웃 완료 후 한 번 더 측정
    });
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => {
      cancelAnimationFrame(rafId);
      if (typeof rafId2 === "number") cancelAnimationFrame(rafId2);
      obs.disconnect();
    };
  }, [containerRef]);
  return width;
};

/**
 * 반응형 그리드: 컨테이너 너비·브레이크포인트·columns에 맞춰 열 수를 해석하고 cellWidth/cellHeight 조정.
 * GridItem 좌표(x,y,w,h)는 store 기준. 픽셀 변환만 달라짐.
 */
export type UseResponsiveGridOptions = {
  /** 그리드 열 수. number면 고정, object면 브레이크포인트별 (store columns와 동일해야 함) */
  columns: number | ColumnsByBreakpoint;
  /** 브레이크포인트 최소 너비(px). 미지정 시 기본값(sm:640, md:768, lg:1024, xl:1280) */
  breakpoints?: BreakpointWidths;
  /** 셀 높이(px). 미지정 시 cellWidth와 동일(정사각형) */
  rowHeight?: number;
};

export type ResponsiveGridSize = {
  cellWidth: number;
  cellHeight: number;
  /** 현재 너비에서 해석된 열 수 (store.columns와 일치해야 함) */
  columns: number;
  /** 레이아웃 계산에 쓴 실제 너비(뷰포트 클램프 적용). 그리드 컨테이너 너비로 사용 권장 */
  containerWidth: number;
};

/** 초기 측정 전까지 쓰는 값. 폴백 너비 기준으로 계산해 0을 넘기지 않음 */
const INITIAL_COLUMNS = 12;

export const useResponsiveGrid = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseResponsiveGridOptions,
): ResponsiveGridSize => {
  const { columns, breakpoints, rowHeight } = options;
  const [size, setSize] = useState<ResponsiveGridSize>(() => {
    const cols =
      typeof columns === "number"
        ? columns
        : resolveColumns(FALLBACK_WIDTH, columns, breakpoints);
    const c = cols < 1 ? 12 : cols;
    const cell = FALLBACK_WIDTH / c;
    return {
      cellWidth: cell,
      cellHeight: rowHeight ?? cell,
      columns: c,
      containerWidth: FALLBACK_WIDTH,
    };
  });
  const update = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const measuredWidth = rect.width;
    const viewportW = getViewportWidth();
    const rawWidth =
      measuredWidth > 0
        ? measuredWidth
        : viewportW > 0
          ? Math.min(viewportW, 1600)
          : FALLBACK_WIDTH;
    const effectiveWidth = Math.round(
      viewportW > 0 ? Math.min(rawWidth, viewportW) : rawWidth,
    );
    const resolvedColumns = resolveColumns(
      effectiveWidth,
      columns,
      breakpoints,
    );
    if (resolvedColumns < 1) return;
    const cellWidth = effectiveWidth / resolvedColumns;
    const cellHeight = rowHeight ?? cellWidth;
    setSize((prev) =>
      prev.cellWidth !== cellWidth ||
      prev.cellHeight !== cellHeight ||
      prev.columns !== resolvedColumns ||
      prev.containerWidth !== effectiveWidth
        ? {
            cellWidth,
            cellHeight,
            columns: resolvedColumns,
            containerWidth: effectiveWidth,
          }
        : prev,
    );
  }, [containerRef, columns, breakpoints, rowHeight]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    update(); // 즉시 1회
    let rafId2: number | undefined;
    const rafId = requestAnimationFrame(() => {
      update();
      rafId2 = requestAnimationFrame(update); // flex 레이아웃 완료 후 한 번 더 측정
    });
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => {
      cancelAnimationFrame(rafId);
      if (typeof rafId2 === "number") cancelAnimationFrame(rafId2);
      obs.disconnect();
    };
  }, [containerRef, update]);

  return size;
};
