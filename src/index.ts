/** Core: Dashboard, Runtime, Serializer, Panel, Widget Registry */
export {
  Dashboard,
  DashboardRuntime,
  createEmptyPanel,
  loadDashboard,
  serializeDashboard,
  Panel,
  PanelOptionEditor,
  useResponsiveGrid,
  createWidgetRegistry,
  FallbackWidget,
} from "./core";
export type {
  DashboardProps,
  DashboardRuntimeHandle,
  DashboardRuntimeProps,
  DashboardGridOptions,
  DashboardMode,
  DashboardSpec,
  DataSource,
  GridItem,
  PanelAction,
  PanelConfig,
  PanelOptionEditorProps,
  PanelProps,
  WidgetComponent,
  WidgetDefinition,
  WidgetOptionSchema,
  WidgetOptionSchemaField,
  WidgetProps,
  WidgetRegistry,
  ResponsiveGridSize,
  UseResponsiveGridOptions,
} from "./core";

/** Layout store (state for grid) */
export { createLayoutStore } from "@dashboardity/layout-store";
export type { LayoutStore, LayoutState } from "@dashboardity/layout-store";
export type { LayoutAction } from "@dashboardity/layout-core";

/** App shell: TopBar, SideNav, Pickers */
export { TopBar, SideNav, DashboardPicker, TimeRangePicker } from "./app-shell";
export type {
  TopBarProps,
  SideNavProps,
  SideNavItem,
  DashboardPickerProps,
  DashboardOption,
  TimeRangePickerProps,
  TimeRangePreset,
} from "./app-shell";

/** Data adapter */
export {
  createStaticDataSource,
  buildInitialItemsFromPanelConfigs,
} from "./data-adapter";
export type { PanelConfigWithLayout } from "./data-adapter";

/** Shared (types, utils) */
export type * from "./shared";
export { cn } from "./shared";

/** Theme (via shared) */
export { colors, spacing, typography, defaultTheme } from "./shared";
export type { Theme } from "./shared";

/** Widget wrapper */
export { WidgetContainer } from "./widget-wrapper";
export type { WidgetContainerProps } from "./widget-wrapper";
