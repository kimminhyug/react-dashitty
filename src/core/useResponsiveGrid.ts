import { useCallback, useEffect, useState } from "react";
import { resolveColumns } from "../shared/breakpoints";
import type { BreakpointWidths, ColumnsByBreakpoint } from "../shared/types";

/** 반응형 계산 시 사용할 최소 셀 크기 (0이 되면 그리드가 안 보임) */
const MIN_CELL = 24;

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
        const next = el.getBoundingClientRect().width;
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
};

/** 초기 측정 전까지 쓰는 작은 값 → 잘못된 큰 그리드 너비 연쇄 방지 */
const INITIAL_COLUMNS = 1;

export const useResponsiveGrid = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseResponsiveGridOptions,
): ResponsiveGridSize => {
  const { columns, breakpoints, rowHeight } = options;
  const [size, setSize] = useState<ResponsiveGridSize>(() => ({
    cellWidth: MIN_CELL,
    cellHeight: rowHeight ?? MIN_CELL,
    columns: INITIAL_COLUMNS,
  }));
  const update = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const resolvedColumns = resolveColumns(width, columns, breakpoints);
    if (resolvedColumns < 1) return;
    const rawCellWidth = width / resolvedColumns;
    const cellWidth = Math.max(MIN_CELL, rawCellWidth);
    const cellHeight = rowHeight ?? Math.max(MIN_CELL, rawCellWidth);
    setSize((prev) =>
      prev.cellWidth !== cellWidth ||
      prev.cellHeight !== cellHeight ||
      prev.columns !== resolvedColumns
        ? { cellWidth, cellHeight, columns: resolvedColumns }
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
