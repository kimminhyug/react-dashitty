import type { LayoutStore } from "@dashboardity/layout-store";
import { createLayoutStore } from "@dashboardity/layout-store";
import type { DashboardSpec, PanelConfig } from "../shared";

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
 * 순서 보존, deterministic, side-effect 없음.
 */
export const serializeDashboard = (
  store: LayoutStore,
  panels: PanelConfig[],
  meta: { id: string; title: string },
): DashboardSpec => {
  const state = store.getState();
  return {
    id: meta.id,
    title: meta.title,
    columns: state.columns,
    layout: {
      items: [...state.items],
    },
    panels: [...panels],
  };
};

/**
 * JSON 스펙 → store + panels 복원.
 */
export const loadDashboard = (
  spec: DashboardSpec,
): { store: LayoutStore; panels: PanelConfig[] } => {
  const store = createLayoutStore({
    items: [...spec.layout.items],
    columns: spec.columns,
  });
  const panels: PanelConfig[] = [...spec.panels];
  return { store, panels };
};
