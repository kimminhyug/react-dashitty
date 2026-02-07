import type { DataSource as IDataSource, PanelConfig } from "../shared";
import type { GridItem } from "@dashboardity/layout-core";

/**
 * 정적 데이터 소스.
 * dataSourceId → 데이터 매핑으로 패널에 공급.
 */
export const createStaticDataSource = (payload: {
  dataByKey: Record<string, unknown>;
}): IDataSource => ({
  getData: (dataSourceId: string, _panelId: string) =>
    payload.dataByKey[dataSourceId] ?? null,
});

/**
 * PanelConfig + layout. layout-store 초기 상태용.
 * layout은 오직 layout-store가 담당.
 */
export type PanelConfigWithLayout = {
  panelConfig: PanelConfig;
  layout: { x: number; y: number; w: number; h: number };
};

export const buildInitialItemsFromPanelConfigs = (
  configs: PanelConfigWithLayout[],
): GridItem[] =>
  configs.map(({ panelConfig, layout }) => ({
    id: panelConfig.id,
    x: layout.x,
    y: layout.y,
    w: layout.w,
    h: layout.h,
  }));
