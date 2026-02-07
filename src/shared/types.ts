import type { GridItem } from "@dashboardity/layout-core";
import type { CSSProperties, ReactNode } from "react";

export type { GridItem };

/**
 * 위젯 공통 props.
 * data + options만 받아 독립적으로 렌더링.
 */
export type WidgetProps<T = unknown> = {
  data: T;
  options?: Record<string, unknown>;
  /** 루트 요소에 적용. 유저가 PanelConfig.widgetClassName 등으로 전달 가능 */
  className?: string;
};

/** Registry에 등록 가능한 위젯. data는 런타임에 전달되므로 any로 수용 */
export type WidgetComponent = React.FC<WidgetProps<any>>;

/** 위젯 옵션 필드 스키마 (플러그인 시스템). Editor 자동 생성용 */
export type WidgetOptionSchemaField =
  | { type: "string"; label: string; placeholder?: string }
  | { type: "number"; label: string; min?: number; max?: number }
  | { type: "boolean"; label: string }
  | {
      type: "select";
      label: string;
      options: { value: string; label: string }[];
    }
  | { type: "color"; label: string };

export type WidgetOptionSchema = Record<string, WidgetOptionSchemaField>;

/** 위젯 정의: 컴포넌트 + 옵션 스키마. Registry는 이걸로 확장 */
export type WidgetDefinition = {
  Component: WidgetComponent;
  options?: WidgetOptionSchema;
};

/** 레거시 호환: [type] => Component | WidgetDefinition */
export type WidgetRegistry = {
  [type: string]: WidgetComponent | WidgetDefinition;
};

/**
 * 패널 설정. (Grafana Panel JSON 참고, 단순화)
 * layout(gridPos) 정보는 포함하지 않음 — layout-store 전담.
 * JSON 직렬화 가능.
 */
export type PanelConfig = {
  id: string;
  /** widget type (e.g. "stat", "chart", "text") */
  type: string;
  dataSourceId?: string;
  options?: Record<string, unknown>;
  style?: CSSProperties;
  /** 패널 루트 요소 className */
  className?: string;
  /** WidgetContainer(제목+콘텐츠 래퍼) 루트 className */
  containerClassName?: string;
  /** 위젯 루트(Widget 컴포넌트 최상위)에 전달되는 className */
  widgetClassName?: string;
  /** Panel wrapper 옵션 */
  containerStyle?: CSSProperties;
};

/** 브레이크포인트 이름 (base = 0px, sm/md/lg/xl = 해당 width 이상) */
export type BreakpointKey = "base" | "sm" | "md" | "lg" | "xl";

/** 브레이크포인트별 최소 너비(px). base는 0으로 고정. */
export type BreakpointWidths = Partial<
  Record<Exclude<BreakpointKey, "base">, number>
>;

/** 브레이크포인트별 그리드 열 수. base 필수, 나머지 선택. */
export type ColumnsByBreakpoint = Partial<Record<BreakpointKey, number>> & {
  base: number;
};

/** 브레이크포인트별 레이아웃. 지정 시 해당 구간에서 스케일 대신 이 레이아웃 사용 */
export type LayoutByBreakpoint = { items: GridItem[] };

/**
 * 대시보드 공식 스펙. "대시보드 = JSON"
 * layout.items[].id === panels[].id 1:1. panels에는 좌표 없음.
 * breakpoints + columnsByBreakpoint 있으면 뷰포트 너비에 따라 columns 해석.
 * layoutsByBreakpoint 있으면 해당 구간에서 layout 대신 그 레이아웃 사용(브레이크포인트별 배치).
 */
export type DashboardSpec = {
  id: string;
  title: string;
  /** 현재 저장된 레이아웃의 열 수. columnsByBreakpoint 사용 시에도 직렬화 시 이 값으로 저장 */
  columns: number;
  /** 기본/캐논칼 레이아웃. layoutsByBreakpoint 미지정 구간은 여기서 스케일 */
  layout: {
    items: GridItem[];
  };
  panels: PanelConfig[];
  /** 브레이크포인트 너비(px). 미지정 시 기본값 사용 */
  breakpoints?: BreakpointWidths;
  /** 브레이크포인트별 열 수. 지정 시 반응형 columns 적용 */
  columnsByBreakpoint?: ColumnsByBreakpoint;
  /** 브레이크포인트별 레이아웃. 지정한 구간은 스케일 없이 이 배치 사용 */
  layoutsByBreakpoint?: Partial<Record<BreakpointKey, LayoutByBreakpoint>>;
};

/** 편집 / 보기 모드 (Grafana 핵심 UX) */
export type DashboardMode = "view" | "edit";

/** 패널 액션 (remove, duplicate, edit placeholder) */
export type PanelAction =
  | { type: "remove"; id: string }
  | { type: "duplicate"; id: string }
  | { type: "edit"; id: string };

/**
 * 데이터 소스 인터페이스.
 * 비동기/캐시/폴링은 고려하지 않음.
 * Dashboard는 data의 shape를 가정하지 않음.
 */
export interface DataSource {
  getData(dataSourceId: string, panelId: string): unknown;
}

/** 대시보드 그리드 UI 옵션 */
export type DashboardGridOptions = {
  /** 리사이즈 핸들에 표시할 커스텀 아이콘(ReactNode). 미지정 시 기본 스타일 */
  resizeHandle?: ReactNode;
  /** 격자선 표시 여부 */
  showGrid?: boolean;
};

/**
 * 패널에 넘길 props.
 * 위젯은 래퍼만 제공하고, 콘텐츠는 content로 주입.
 */
export type PanelProps = {
  item: GridItem;
  title?: string;
  content: ReactNode;
  className?: string;
  style?: CSSProperties;
  containerClassName?: string;
  containerStyle?: CSSProperties;
  /** edit 모드에서 패널 액션(remove/duplicate/edit) 시 호출 */
  onAction?: (action: PanelAction) => void;
  /** edit 모드에서 패널 클릭 시 선택. selected면 시각 강조용 */
  selected?: boolean;
  onSelect?: () => void;
};

/**
 * PanelOptionEditor props.
 * layout/store 절대 접근 ❌. 오직 PanelConfig.options 수정만.
 */
export type PanelOptionEditorProps = {
  panel: PanelConfig;
  /** 위젯 옵션 스키마 (widget definition에서). 없으면 기본 필드만 */
  schema?: WidgetOptionSchema;
  onChange: (next: PanelConfig) => void;
};
