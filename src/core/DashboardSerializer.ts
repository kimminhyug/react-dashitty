import type { LayoutStore } from "@dashboardity/layout-store";
import { createLayoutStore } from "@dashboardity/layout-store";
import type {
  BreakpointKey,
  DashboardSpec,
  GridItem,
  PanelConfig,
} from "../shared";
import {
  resolveColumns,
  scaleLayout,
} from "../shared/breakpoints";

const generatePanelId = (): string =>
  `panel-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * 빈 패널 생성 (Add Panel 플로우용).
 * layout은 store.dispatch({ type: "add", item: { id, x, y, w, h } })로 호출 측에서 처리.
 */
export const createEmptyPanel = (
  type: string,
  defaultTitle = "New panel",
): PanelConfig => ({
  id: generatePanelId(),
  type,
  options: { title: defaultTitle },
});

/**
 * 라이브러리 레벨: store + panels + meta → JSON 스펙.
 * breakpoints/columnsByBreakpoint/layoutsByBreakpoint 있으면 그대로 직렬화.
 * layoutCache: 현재 브레이크포인트 포함 편집된 구간별 레이아웃(merge되어 출력).
 */
export const serializeDashboard = (
  store: LayoutStore,
  panels: PanelConfig[],
  meta: { id: string; title: string },
  specOverrides?: Pick<
    DashboardSpec,
    "breakpoints" | "columnsByBreakpoint" | "layoutsByBreakpoint"
  >,
): DashboardSpec => {
  const state = store.getState();
  const base: DashboardSpec = {
    id: meta.id,
    title: meta.title,
    columns: state.columns,
    layout: {
      items: [...state.items],
    },
    panels: [...panels],
  };
  if (specOverrides?.breakpoints) base.breakpoints = specOverrides.breakpoints;
  if (specOverrides?.columnsByBreakpoint)
    base.columnsByBreakpoint = specOverrides.columnsByBreakpoint;
  if (specOverrides?.layoutsByBreakpoint != null)
    base.layoutsByBreakpoint = specOverrides.layoutsByBreakpoint;
  return base;
};

export type LoadDashboardOptions = {
  /** 뷰포트/컨테이너 너비(px). columnsByBreakpoint 있을 때 이 너비로 열 수 해석 */
  width?: number;
  /** 이미 해석된 열 수. 지정 시 width 무시하고 이 값으로 스토어 생성 */
  resolvedColumns?: number;
  /** 현재 브레이크포인트. layoutsByBreakpoint[breakpointKey] 있으면 그 레이아웃 사용 */
  breakpointKey?: BreakpointKey;
  /** 런타임 캐시(구간별 레이아웃). breakpointKey에 대한 캐시가 있으면 spec보다 우선 */
  layoutCache?: Partial<Record<BreakpointKey, GridItem[]>>;
};

const getItemsForBreakpoint = (
  spec: DashboardSpec,
  breakpointKey: BreakpointKey,
  resolvedColumns: number,
  layoutCache?: Partial<Record<BreakpointKey, GridItem[]>>,
): GridItem[] => {
  const cached = layoutCache?.[breakpointKey];
  if (cached != null && cached.length > 0) return [...cached];
  const byBp = spec.layoutsByBreakpoint?.[breakpointKey]?.items;
  if (byBp != null && byBp.length > 0) return [...byBp];
  return scaleLayout(
    spec.layout.items,
    spec.columns,
    resolvedColumns,
  );
};

/**
 * JSON 스펙 → store + panels 복원.
 * layoutsByBreakpoint 또는 layoutCache로 해당 구간 레이아웃 사용, 없으면 layout 스케일.
 */
export const loadDashboard = (
  spec: DashboardSpec,
  options?: LoadDashboardOptions,
): { store: LayoutStore; panels: PanelConfig[] } => {
  const savedColumns = spec.columns;
  const colConfig = spec.columnsByBreakpoint ?? savedColumns;
  const resolved =
    options?.resolvedColumns ??
    (options?.width != null
      ? resolveColumns(options.width, colConfig, spec.breakpoints)
      : savedColumns);
  const breakpointKey = options?.breakpointKey ?? "xl";
  const items = getItemsForBreakpoint(
    spec,
    breakpointKey,
    resolved,
    options?.layoutCache,
  );
  const store = createLayoutStore({
    items,
    columns: resolved,
  });
  const panels: PanelConfig[] = [...spec.panels];
  return { store, panels };
};
