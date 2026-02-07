import { useCallback, useEffect, useState } from "react";

/** 반응형 계산 시 사용할 최소 셀 크기 (0이 되면 그리드가 안 보임) */
const MIN_CELL = 24;

/**
 * 반응형 그리드: 화면(컨테이너) 크기와 columns에 맞춰 cellWidth/cellHeight만 동적 조정.
 * GridItem 좌표(x,y,w,h)는 변경하지 않음. 픽셀 변환만 달라짐.
 * 좌우 이동 자동 보정 없음. pack-up 규칙은 layout-core/store에서 유지.
 */
export type UseResponsiveGridOptions = {
  /** 그리드 열 수 (layout-store의 columns와 동일해야 함) */
  columns: number;
  /** 셀 높이(px). 미지정 시 cellWidth와 동일(정사각형) */
  rowHeight?: number;
};

export type ResponsiveGridSize = {
  cellWidth: number;
  cellHeight: number;
};

export const useResponsiveGrid = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseResponsiveGridOptions,
): ResponsiveGridSize => {
  const { columns, rowHeight } = options;
  const [size, setSize] = useState<ResponsiveGridSize>(() => ({
    cellWidth: 100,
    cellHeight: rowHeight ?? 100,
  }));
  const update = useCallback(() => {
    const el = containerRef.current;
    if (!el || columns < 1) return;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const rawCellWidth = width / columns;
    const cellWidth = Math.max(MIN_CELL, rawCellWidth);
    const cellHeight = rowHeight ?? Math.max(MIN_CELL, rawCellWidth);
    setSize((prev) =>
      prev.cellWidth !== cellWidth || prev.cellHeight !== cellHeight
        ? { cellWidth, cellHeight }
        : prev,
    );
  }, [containerRef, columns, rowHeight]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [containerRef, update]);

  return size;
};
