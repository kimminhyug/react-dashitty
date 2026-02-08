import { createLayoutStore } from "@dashboardity/layout-store";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  BreakpointKey,
  DashboardGridOptions,
  DashboardSpec,
  DataSource,
  GridItem,
  PanelAction,
  PanelConfig,
  WidgetDefinition,
  WidgetRegistry,
} from "../shared";
import {
  getBreakpointKey,
  resolveColumns,
  scaleLayout,
} from "../shared/breakpoints";
import { Dashboard } from "./Dashboard";
import {
  createEmptyPanel,
  loadDashboard,
  serializeDashboard,
} from "./DashboardSerializer";
import { downloadDashboardSpec } from "./dashboardFile";
import { PanelOptionEditor } from "./PanelOptionEditor";
import { useContainerWidth, useResponsiveGrid } from "./useResponsiveGrid";

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
  /** 지정 시 컨테이너 너비 무시하고 이 브레이크포인트(열 수·레이아웃) 고정. 모달 등에서 사용 */
  forceBreakpoint?: BreakpointKey;
  /** 레이아웃/패널 변경 시 직렬화된 스펙 전달 (저장/서버 연동용) */
  onChange?: (spec: DashboardSpec) => void;
  /** 실제 적용 중인 breakpoint 변경 시 호출 (로그/배지 등 표시용) */
  onBreakpointChange?: (key: BreakpointKey, width: number) => void;
  rowHeight?: number;
  gridOptions?: DashboardGridOptions;
  className?: string;
  style?: React.CSSProperties;
};

/** ref 로 노출되는 API. 툴바/단축키/저장 연동용 */
export type DashboardRuntimeHandle = {
  addPanel: (type: string) => void;
  removePanel: (id: string) => void;
  /** 현재 스펙 객체 반환 */
  export: () => DashboardSpec;
  /** 현재 스펙을 JSON 파일로 다운로드 */
  exportToFile: (filename?: string) => void;
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
    forceBreakpoint,
    onChange,
    onBreakpointChange,
    rowHeight,
    gridOptions,
    className,
    style,
  } = props;

  const mode = modeProp ?? "view";
  const isEdit = mode === "edit";

  const gridWrapRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(gridWrapRef);
  const colConfig = initialSpec.columnsByBreakpoint ?? initialSpec.columns;
  const responsiveSize = useResponsiveGrid(gridWrapRef, {
    columns: colConfig,
    breakpoints: initialSpec.breakpoints,
    rowHeight,
  });
  /** 측정 전(0)이면 뷰포트 너비로 폴백. 소수 너비는 정수로 반올림해 breakpoint/effect 안정화 */
  const widthForBreakpoint = Math.round(
    containerWidth > 0
      ? containerWidth
      : typeof document !== "undefined"
        ? Math.min(document.documentElement.clientWidth, 1600)
        : 1280,
  );
  const currentBreakpoint = useMemo(
    () =>
      forceBreakpoint ??
      getBreakpointKey(widthForBreakpoint, initialSpec.breakpoints),
    [forceBreakpoint, widthForBreakpoint, initialSpec.breakpoints],
  );
  const resolvedColumns = useMemo(() => {
    if (forceBreakpoint != null) {
      const colConfig = initialSpec.columnsByBreakpoint ?? initialSpec.columns;
      const byBp =
        typeof colConfig === "object"
          ? colConfig[forceBreakpoint]
          : undefined;
      return byBp ?? initialSpec.columns;
    }
    const colConfig = initialSpec.columnsByBreakpoint ?? initialSpec.columns;
    return resolveColumns(
      widthForBreakpoint,
      colConfig,
      initialSpec.breakpoints,
    );
  }, [
    forceBreakpoint,
    widthForBreakpoint,
    initialSpec.columns,
    initialSpec.columnsByBreakpoint,
    initialSpec.breakpoints,
  ]);

  const initialSpecRef = useRef(initialSpec);
  initialSpecRef.current = initialSpec;

  const loadOptsForBreakpoint = useMemo(() => {
    if (forceBreakpoint == null) return undefined;
    const cols =
      (initialSpec.columnsByBreakpoint as Record<string, number>)?.[
        forceBreakpoint
      ] ?? initialSpec.columns;
    return {
      breakpointKey: forceBreakpoint,
      resolvedColumns: cols,
    };
  }, [forceBreakpoint, initialSpec.columnsByBreakpoint, initialSpec.columns]);

  /** 첫 페인트부터 현재 너비 기준 브레이크포인트 레이아웃 사용(undefined면 뷰포트 너비로 계산) */
  const getInitialLoadOpts = useCallback(() => {
    if (loadOptsForBreakpoint != null) return loadOptsForBreakpoint;
    const w =
      typeof document !== "undefined"
        ? Math.round(
            Math.min(document.documentElement.clientWidth ?? 1280, 1600),
          )
        : 1280;
    const colConfig =
      initialSpec.columnsByBreakpoint ?? initialSpec.columns;
    const bp = getBreakpointKey(w, initialSpec.breakpoints);
    const cols = resolveColumns(
      w,
      colConfig,
      initialSpec.breakpoints ?? undefined,
    );
    return {
      breakpointKey: bp,
      resolvedColumns: cols,
    };
  }, [
    loadOptsForBreakpoint,
    initialSpec.breakpoints,
    initialSpec.columnsByBreakpoint,
    initialSpec.columns,
  ]);

  const [store, setStore] = useState(() =>
    loadDashboard(initialSpec, getInitialLoadOpts()).store,
  );
  const [panels, setPanels] = useState<PanelConfig[]>(() => [
    ...loadDashboard(initialSpec, getInitialLoadOpts()).panels,
  ]);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const specIdRef = useRef(initialSpec.id);
  const storeRef = useRef(store);
  storeRef.current = store;
  const prevBreakpointRef = useRef<BreakpointKey>(
    forceBreakpoint ?? currentBreakpoint,
  );
  const layoutCacheRef = useRef<Partial<Record<BreakpointKey, GridItem[]>>>({});
  const currentBreakpointRef = useRef(currentBreakpoint);
  currentBreakpointRef.current = currentBreakpoint;

  useEffect(() => {
    if (resolvedColumns < 1) return;
    const spec = initialSpecRef.current;
    if (specIdRef.current !== spec.id) {
      specIdRef.current = spec.id;
      prevBreakpointRef.current = currentBreakpoint;
      layoutCacheRef.current = {};
      (Object.keys(spec.layoutsByBreakpoint ?? {}) as BreakpointKey[]).forEach(
        (k) => {
          const items = spec.layoutsByBreakpoint?.[k]?.items;
          if (items) layoutCacheRef.current[k] = [...items];
        },
      );
      const loaded = loadDashboard(spec, {
        resolvedColumns,
        breakpointKey: currentBreakpoint,
        layoutCache: layoutCacheRef.current,
      });
      setStore(loaded.store);
      setPanels([...loaded.panels]);
      layoutCacheRef.current[currentBreakpoint] =
        loaded.store.getState().items;
      return;
    }
    const prevBp = prevBreakpointRef.current;
    const current = storeRef.current;
    if (
      prevBp === currentBreakpoint &&
      current?.getState().columns === resolvedColumns
    ) {
      return;
    }
    if (current) {
      layoutCacheRef.current[prevBp] = [...current.getState().items];
    }
    prevBreakpointRef.current = currentBreakpoint;
    const loaded = loadDashboard(spec, {
      resolvedColumns,
      breakpointKey: currentBreakpoint,
      layoutCache: layoutCacheRef.current,
    });
    const loadedItems = loaded.store.getState().items;
    layoutCacheRef.current[currentBreakpoint] = [...loadedItems];
    setStore(loaded.store);
    setPanels([...loaded.panels]);
  }, [initialSpec.id, resolvedColumns, currentBreakpoint]);

  const onBreakpointChangeRef = useRef(onBreakpointChange);
  onBreakpointChangeRef.current = onBreakpointChange;
  const lastReportedRef = useRef<{ key: BreakpointKey; width: number } | null>(
    null,
  );
  useEffect(() => {
    const last = lastReportedRef.current;
    if (
      last?.key === currentBreakpoint &&
      last?.width === widthForBreakpoint
    ) {
      return;
    }
    lastReportedRef.current = {
      key: currentBreakpoint,
      width: widthForBreakpoint,
    };
    onBreakpointChangeRef.current?.(currentBreakpoint, widthForBreakpoint);
  }, [currentBreakpoint, widthForBreakpoint]);

  const meta = useMemo(
    () => ({ id: initialSpec.id, title: initialSpec.title }),
    [initialSpec.id, initialSpec.title],
  );
  const panelsRef = useRef(panels);
  panelsRef.current = panels;

  const notifyChange = useCallback(() => {
    const cache = layoutCacheRef.current;
    const layoutsByBreakpoint =
      Object.keys(cache).length > 0
        ? (Object.fromEntries(
            Object.entries(cache).map(([k, v]) => [k, { items: v }]),
          ) as DashboardSpec["layoutsByBreakpoint"])
        : initialSpec.layoutsByBreakpoint;
    onChange?.(
      serializeDashboard(store, panelsRef.current, meta, {
        breakpoints: initialSpec.breakpoints,
        columnsByBreakpoint: initialSpec.columnsByBreakpoint,
        layoutsByBreakpoint,
      }),
    );
  }, [
    onChange,
    store,
    meta,
    initialSpec.breakpoints,
    initialSpec.columnsByBreakpoint,
    initialSpec.layoutsByBreakpoint,
  ]);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      layoutCacheRef.current[currentBreakpointRef.current] = [
        ...store.getState().items,
      ];
      notifyChange();
    });
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
          const item = store
            .getState()
            .items.find((i: GridItem) => i.id === action.id);
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
        items.length === 0
          ? 0
          : Math.max(...items.map((i: GridItem) => i.y + i.h));
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

  const exportSpec = useCallback((): DashboardSpec => {
    const cache = layoutCacheRef.current;
    const layoutsByBreakpoint =
      Object.keys(cache).length > 0
        ? (Object.fromEntries(
            Object.entries(cache).map(([k, v]) => [k, { items: v }]),
          ) as DashboardSpec["layoutsByBreakpoint"])
        : initialSpec.layoutsByBreakpoint;
    return serializeDashboard(store, panelsRef.current, meta, {
      breakpoints: initialSpec.breakpoints,
      columnsByBreakpoint: initialSpec.columnsByBreakpoint,
      layoutsByBreakpoint,
    });
  }, [
    store,
    meta,
    initialSpec.breakpoints,
    initialSpec.columnsByBreakpoint,
    initialSpec.layoutsByBreakpoint,
  ]);

  const exportToFile = useCallback(
    (filename?: string) => {
      const spec = exportSpec();
      downloadDashboardSpec(spec, filename);
    },
    [exportSpec],
  );

  useImperativeHandle(
    ref,
    () => ({
      addPanel,
      removePanel,
      export: exportSpec,
      exportToFile,
    }),
    [addPanel, removePanel, exportSpec, exportToFile],
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
  /** flex 자식이 0으로 줄어들면 패널이 안 그려지므로 최소 너비 보장. 세로 스크롤 허용 */
  const gridWrapStyle: React.CSSProperties = {
    flex: 1,
    minWidth: isEdit ? 320 : 0,
    minHeight: 0,
    maxWidth: "100%",
    overflow: "auto",
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
          cellWidth={
            resolvedColumns > 0
              ? responsiveSize.containerWidth / resolvedColumns
              : responsiveSize.cellWidth
          }
          cellHeight={
            resolvedColumns > 0
              ? rowHeight ?? responsiveSize.containerWidth / resolvedColumns
              : responsiveSize.cellHeight
          }
          containerWidth={responsiveSize.containerWidth}
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
