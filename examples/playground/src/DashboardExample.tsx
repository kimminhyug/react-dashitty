/**
 * 최종 목표: 아래 코드만으로 대시보드 구성.
 * panelConfigs는 JSON 저장/복원 가능 (layout 제외).
 * Edit 모드: 드래그/리사이즈, 패널 ⋮ 메뉴(Remove/Duplicate/Edit), Add panel.
 */

import {
  createLayoutStore,
  type GridItem,
  Dashboard,
  createEmptyPanel,
  createWidgetRegistry,
  buildInitialItemsFromPanelConfigs,
  createStaticDataSource,
  type PanelConfigWithLayout,
  type PanelAction,
  type PanelConfig,
} from "dashboardity";
import { StatWidget, TextWidget } from "./widgets";
import React, { useMemo, useState } from "react";

const COLUMNS = 12;

/** JSON 직렬화 가능. layout은 포함하지 않음. */
const initialPanelConfigs: PanelConfig[] = [
  {
    id: "panel-stat",
    type: "stat",
    dataSourceId: "stat",
    options: { title: "CPU %", unit: "%" },
  },
  {
    id: "panel-text",
    type: "text",
    dataSourceId: "text",
    options: { title: "Message" },
  },
];

const panelConfigsWithLayout: PanelConfigWithLayout[] = [
  { panelConfig: initialPanelConfigs[0], layout: { x: 0, y: 0, w: 6, h: 2 } },
  { panelConfig: initialPanelConfigs[1], layout: { x: 6, y: 0, w: 6, h: 2 } },
];

const initialItems = buildInitialItemsFromPanelConfigs(panelConfigsWithLayout);
const createStore = () =>
  createLayoutStore({ items: [...initialItems], columns: COLUMNS });

const dataSource = createStaticDataSource({
  dataByKey: {
    stat: 42,
    text: "Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!Hello, World!",
  },
});

const widgetRegistry = createWidgetRegistry({
  stat: StatWidget,
  text: TextWidget,
});

/** 커스텀 리사이즈 아이콘 예시 (옵션) */
const customResizeIcon = (
  <span style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", userSelect: "none" }}>⋰</span>
);

export const DashboardExample: React.FC = () => {
  const [showGrid, setShowGrid] = useState(false);
  const [useCustomResizeIcon, setUseCustomResizeIcon] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("edit");
  const [store] = useState(createStore);
  const [panelConfigs, setPanelConfigs] = useState<PanelConfig[]>(initialPanelConfigs);

  const handlePanelAction = useMemo(
    (): ((action: PanelAction) => void) => (action) => {
      if (action.type === "remove") {
        store.dispatch({ type: "remove", id: action.id });
        setPanelConfigs((prev) => prev.filter((p) => p.id !== action.id));
      } else if (action.type === "duplicate") {
        const items = store.getState().items;
        const item = items.find((i: GridItem) => i.id === action.id);
        const config = panelConfigs.find((p) => p.id === action.id);
        if (!item || !config) return;
        const newPanel = createEmptyPanel(config.type, "New panel");
        const title =
          config.options?.title != null ? `${String(config.options.title)} (copy)` : "Copy";
        const newConfig = {
          ...config,
          id: newPanel.id,
          options: { ...config.options, title },
        };
        store.dispatch({
          type: "add",
          item: {
            id: newPanel.id,
            x: item.x,
            y: item.y + item.h,
            w: item.w,
            h: item.h,
          },
        });
        setPanelConfigs((prev) => [...prev, newConfig]);
      } else if (action.type === "edit") {
        console.log("Edit panel", action.id);
      }
    },
    [store, panelConfigs],
  );

  const handleAddPanel = () => {
    const items = store.getState().items;
    const nextY =
      items.length === 0 ? 0 : Math.max(...items.map((i: GridItem) => i.y + i.h));
    const newPanel = createEmptyPanel("text", "New panel");
    store.dispatch({
      type: "add",
      item: { id: newPanel.id, x: 0, y: nextY, w: 6, h: 2 },
    });
    setPanelConfigs((prev) => [...prev, newPanel]);
  };

  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        margin: "0 auto",
        padding: 16,
      }}
    >
      <h2 style={{ marginBottom: 12 }}>Dashboard</h2>
      <div style={{ marginBottom: 12, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setMode((m) => (m === "edit" ? "view" : "edit"))}
          style={{ padding: "6px 12px", cursor: "pointer" }}
        >
          {mode === "edit" ? "보기 모드" : "편집 모드"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={handleAddPanel}
            style={{ padding: "6px 12px", cursor: "pointer" }}
          >
            Add panel
          </button>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
          />
          격자 보기
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={useCustomResizeIcon}
            onChange={(e) => setUseCustomResizeIcon(e.target.checked)}
          />
          커스텀 리사이즈 아이콘
        </label>
      </div>
      <Dashboard
        store={store}
        columns={COLUMNS}
        panelConfigs={panelConfigs}
        dataSource={dataSource}
        widgets={widgetRegistry}
        rowHeight={32}
        mode={mode}
        onPanelAction={mode === "edit" ? handlePanelAction : undefined}
        gridOptions={{
          showGrid,
          resizeHandle: useCustomResizeIcon ? customResizeIcon : undefined,
        }}
      />
    </div>
  );
};
