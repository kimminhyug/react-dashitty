import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { createLayoutStore } from "@dashboardity/layout-store";
import { Dashboard } from "./Dashboard";
import {
  createEmptyPanel,
  loadDashboard,
  serializeDashboard,
} from "./DashboardSerializer";
import { PanelOptionEditor } from "./PanelOptionEditor";
import { useContainerWidth } from "./useResponsiveGrid";
import { resolveColumns, scaleLayout } from "../shared/breakpoints";
import type {
  DashboardGridOptions,
  DashboardSpec,
  DataSource,
  GridItem,
  PanelAction,
  PanelConfig,
  WidgetDefinition,
  WidgetRegistry,
} from "../shared";

const getWidgetSchema = (
  entry: WidgetRegistry[string] | undefined,
): WidgetDefinition["options"] =>
  entry && typeof entry === "object" && "options" in entry
    ? entry.options
    : undefined;

export type DashboardRuntimeProps = {
  /** 초기 스펙. key={initialSpec.id} 로 대시보드 전환 시 리마운트 권장 */
  initialSpec: DashboardSpec;
  widgets: WidgetRegistry;
  dataSource: DataSource;
  mode?: "view" | "edit";
  /** 레이아웃/패널 변경 시 직렬화된 스펙 전달 (저장/서버 연동용) */
  onChange?: (spec: DashboardSpec) => void;
  rowHeight?: number;
  gridOptions?: DashboardGridOptions;
  className?: string;
  style?: React.CSSProperties;
};

/** ref 로 노출되는 API. 툴바/단축키/저장 연동용 */
export type DashboardRuntimeHandle = {
  addPanel: (type: string) => void;
  removePanel: (id: string) => void;
  export: () => DashboardSpec;
};

export const DashboardRuntime = forwardRef<
  DashboardRuntimeHandle,
  DashboardRuntimeProps
>((props, ref) => {
  const {
    initialSpec,
    widgets,
    dataSource,
    mode: modeProp = "view",
    onChange,
    rowHeight,
    gridOptions,
    className,
    style,
  } = props;

  const mode = modeProp ?? "view";
  const isEdit = mode === "edit";

  const gridWrapRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(gridWrapRef);
  const resolvedColumns = useMemo(() => {
    const colConfig =
      initialSpec.columnsByBreakpoint ?? initialSpec.columns;
    const width =
      containerWidth ||
      (typeof window !== "undefined" ? window.innerWidth : 1024);
    return resolveColumns(width, colConfig, initialSpec.breakpoints);
  }, [
    containerWidth,
    initialSpec.columns,
    initialSpec.columnsByBreakpoint,
    initialSpec.breakpoints,
  ]);

  const [store, setStore] = useState(() => loadDashboard(initialSpec).store);
  const [panels, setPanels] = useState<PanelConfig[]>(() => [
    ...loadDashboard(initialSpec).panels,
  ]);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const specIdRef = useRef(initialSpec.id);
  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(() => {
    if (resolvedColumns < 1) return;
    if (specIdRef.current !== initialSpec.id) {
      specIdRef.current = initialSpec.id;
      const loaded = loadDashboard(initialSpec, { resolvedColumns });
      setStore(loaded.store);
      setPanels([...loaded.panels]);
      return;
    }
    const current = storeRef.current;
    if (!current) {
      const loaded = loadDashboard(initialSpec, { resolvedColumns });
      setStore(loaded.store);
      setPanels([...loaded.panels]);
      return;
    }
    const state = current.getState();
    if (state.columns === resolvedColumns) return;
    const scaled = scaleLayout(state.items, state.columns, resolvedColumns);
    setStore(
      createLayoutStore({ items: scaled, columns: resolvedColumns }),
    );
  }, [initialSpec, resolvedColumns]);

  const meta = useMemo(
    () => ({ id: initialSpec.id, title: initialSpec.title }),
    [initialSpec.id, initialSpec.title],
  );
  const panelsRef = useRef(panels);
  panelsRef.current = panels;

  const notifyChange = useCallback(() => {
    onChange?.(
      serializeDashboard(store, panelsRef.current, meta, {
        breakpoints: initialSpec.breakpoints,
        columnsByBreakpoint: initialSpec.columnsByBreakpoint,
      }),
    );
  }, [onChange, store, meta, initialSpec.breakpoints, initialSpec.columnsByBreakpoint]);

  useEffect(() => {
    const unsub = store.subscribe(notifyChange);
    return unsub;
  }, [store, notifyChange]);

  useEffect(() => {
    notifyChange();
  }, [panels, notifyChange]);

  const dispatchPanelAction = useCallback(
    (action: PanelAction) => {
      switch (action.type) {
        case "remove": {
          store.dispatch({ type: "remove", id: action.id });
          setPanels((p) => p.filter((x) => x.id !== action.id));
          break;
        }
        case "duplicate": {
          const item = store.getState().items.find((i: GridItem) => i.id === action.id);
          const config = panelsRef.current.find((p) => p.id === action.id);
          if (!item || !config) break;
          const newPanel = createEmptyPanel(config.type, "New panel");
          const title =
            config.options?.title != null
              ? `${String(config.options.title)} (copy)`
              : "Copy";
          const newConfig: PanelConfig = {
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
          setPanels((p) => [...p, newConfig]);
          break;
        }
        case "edit":
          notifyChange();
          break;
        default: {
          const _: never = action;
        }
      }
    },
    [store],
  );

  const addPanel = useCallback(
    (type: string) => {
      const items = store.getState().items;
      const nextY =
        items.length === 0 ? 0 : Math.max(...items.map((i: GridItem) => i.y + i.h));
      const newPanel = createEmptyPanel(type, "New panel");
      store.dispatch({
        type: "add",
        item: { id: newPanel.id, x: 0, y: nextY, w: 6, h: 2 },
      });
      setPanels((p) => [...p, newPanel]);
    },
    [store],
  );

  const removePanel = useCallback(
    (id: string) => {
      store.dispatch({ type: "remove", id });
      setPanels((p) => p.filter((x) => x.id !== id));
    },
    [store],
  );

  const exportSpec = useCallback(
    (): DashboardSpec =>
      serializeDashboard(store, panelsRef.current, meta, {
        breakpoints: initialSpec.breakpoints,
        columnsByBreakpoint: initialSpec.columnsByBreakpoint,
      }),
    [store, meta, initialSpec.breakpoints, initialSpec.columnsByBreakpoint],
  );

  useImperativeHandle(
    ref,
    () => ({
      addPanel,
      removePanel,
      export: exportSpec,
    }),
    [addPanel, removePanel, exportSpec],
  );

  const handleAddPanel = useCallback(() => {
    addPanel("text");
  }, [addPanel]);

  const selectedPanel =
    selectedPanelId != null
      ? panels.find((p) => p.id === selectedPanelId)
      : null;
  const selectedSchema =
    selectedPanel != null
      ? getWidgetSchema(widgets[selectedPanel.type])
      : undefined;

  const handlePanelOptionChange = useCallback((next: PanelConfig) => {
    setPanels((prev) => prev.map((p) => (p.id === next.id ? next : p)));
  }, []);

  const layoutStyle: React.CSSProperties = {
    display: "flex",
    gap: 16,
    width: "100%",
    minWidth: 0,
  };
  const gridWrapStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };
  const sidePanelStyle: React.CSSProperties = {
    width: 260,
    flexShrink: 0,
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    background: "#fff",
    overflow: "auto",
  };

  return (
    <div className={className} style={{ ...style, ...layoutStyle }}>
      <div ref={gridWrapRef} style={gridWrapStyle}>
        {isEdit && (
          <div style={{ marginBottom: 8 }}>
            <button
              type="button"
              onClick={handleAddPanel}
              style={{ padding: "6px 12px", cursor: "pointer" }}
            >
              Add panel
            </button>
          </div>
        )}
        <Dashboard
          store={store}
          columns={resolvedColumns}
          panelConfigs={panels}
          dataSource={dataSource}
          widgets={widgets}
          rowHeight={rowHeight}
          gridOptions={gridOptions}
          mode={mode}
          onPanelAction={isEdit ? dispatchPanelAction : undefined}
          selectedPanelId={selectedPanelId}
          onPanelSelect={isEdit ? setSelectedPanelId : undefined}
        />
      </div>
      {isEdit && (
        <aside style={sidePanelStyle}>
          {selectedPanel != null ? (
            <PanelOptionEditor
              panel={selectedPanel}
              schema={selectedSchema}
              onChange={handlePanelOptionChange}
            />
          ) : (
            <div style={{ padding: 12, fontSize: 12, color: "#999" }}>
              Select a panel to edit options
            </div>
          )}
        </aside>
      )}
    </div>
  );
});

DashboardRuntime.displayName = "DashboardRuntime";
