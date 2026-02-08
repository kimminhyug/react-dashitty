import type { LayoutStore } from "@dashboardity/layout-store";
import React, { useMemo, useRef } from "react";
import { GridLayout } from "react-griditty";
import type {
  DashboardGridOptions,
  DashboardMode,
  DataSource,
  GridItem,
  PanelAction,
  PanelConfig,
  WidgetComponent,
  WidgetDefinition,
  WidgetRegistry,
} from "../shared";
import { Panel } from "./Panel";
import { useResponsiveGrid } from "./useResponsiveGrid";
import { FallbackWidget } from "./widgetRegistry";

const getWidgetComponent = (
  entry: WidgetComponent | WidgetDefinition | undefined,
): WidgetComponent =>
  entry == null
    ? FallbackWidget
    : typeof entry === "function"
      ? entry
      : entry.Component;

export type DashboardProps = {
  store: LayoutStore;
  columns: number;
  /** 전달 시 반응형을 부모(Runtime) 기준으로 사용. 미전달 시 내부 containerRef로 계산 */
  cellWidth?: number;
  cellHeight?: number;
  /** cellWidth/cellHeight 전달 시 함께 전달 권장. GridLayout 열 수 = containerWidth/cellWidth 와 일치해야 함 */
  containerWidth?: number;
  /** item.id로 조회. JSON 직렬화 가능한 설정만 포함 (layout 제외) */
  panelConfigs: PanelConfig[];
  dataSource: DataSource;
  widgets: WidgetRegistry;
  rowHeight?: number;
  /** 그리드 UI 옵션: resize 아이콘, 격자 보기 등 */
  gridOptions?: DashboardGridOptions;
  /** view = 읽기 전용, edit = 드래그/리사이즈/패널 액션 허용 */
  mode?: DashboardMode;
  /** edit 모드에서 패널 액션(remove/duplicate/edit) 시 호출 */
  onPanelAction?: (action: PanelAction) => void;
  /** edit 모드에서 패널 클릭 시 선택. 선택된 id */
  selectedPanelId?: string | null;
  onPanelSelect?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
};

const dashboardRootStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  minHeight: 200,
  overflow: "visible",
};

const cn = (...parts: (string | undefined)[]) =>
  parts.filter(Boolean).join(" ");

export const Dashboard: React.FC<DashboardProps> = ({
  store,
  columns,
  cellWidth: cellWidthProp,
  cellHeight: cellHeightProp,
  containerWidth: containerWidthProp,
  panelConfigs,
  dataSource,
  widgets,
  rowHeight,
  gridOptions,
  mode = "view",
  onPanelAction,
  selectedPanelId,
  onPanelSelect,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const responsiveSize = useResponsiveGrid(containerRef, {
    columns,
    rowHeight,
  });
  const cellWidth =
    cellWidthProp != null ? cellWidthProp : responsiveSize.cellWidth;
  const cellHeight =
    cellHeightProp != null ? cellHeightProp : responsiveSize.cellHeight;
  const containerWidthForGrid =
    containerWidthProp ?? responsiveSize.containerWidth;
  const isEdit = mode === "edit";
  const canRenderGrid = cellWidth > 0 && cellHeight > 0;

  const configById = useMemo(
    () => new Map(panelConfigs.map((c) => [c.id, c])),
    [panelConfigs],
  );

  const renderPanel = useMemo(
    () => (item: GridItem) => {
      const config = configById.get(item.id);
      if (!config)
        return (
          <div key={item.id} style={{ padding: 8 }}>
            Unknown panel
          </div>
        );
      const Widget = getWidgetComponent(widgets[config.type]) ?? FallbackWidget;
      const data = config.dataSourceId
        ? dataSource.getData(config.dataSourceId, item.id)
        : null;
      const content = (
        <Widget
          data={data}
          options={config.options}
          className={config.widgetClassName}
        />
      );
      const title =
        config.options?.title != null
          ? String(config.options.title)
          : undefined;
      return (
        <Panel
          key={item.id}
          item={item}
          title={title}
          content={content}
          className={config.className}
          style={config.style}
          containerClassName={config.containerClassName}
          containerStyle={config.containerStyle}
          onAction={isEdit ? onPanelAction : undefined}
          selected={selectedPanelId === item.id}
          onSelect={isEdit ? () => onPanelSelect?.(item.id) : undefined}
        />
      );
    },
    [
      configById,
      dataSource,
      widgets,
      isEdit,
      onPanelAction,
      selectedPanelId,
      onPanelSelect,
    ],
  );

  return (
    <div
      ref={containerRef}
      className={cn("rd-dashboard", className)}
      style={{ ...dashboardRootStyle, ...style }}
    >
      {canRenderGrid ? (
        <GridLayout
          store={store}
          columns={columns}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
          containerWidth={containerWidthForGrid}
          resizeHandle={gridOptions?.resizeHandle}
          showGrid={Boolean(gridOptions?.showGrid)}
          draggable={isEdit}
          resizable={isEdit}
        >
          {renderPanel}
        </GridLayout>
      ) : null}
    </div>
  );
};
