import React from "react";
import type { WidgetComponent, WidgetRegistry } from "../shared";
import { cn } from "../shared";

/** 존재하지 않는 type용 fallback 위젯 */
export const FallbackWidget: WidgetComponent = ({ data, className }) => (
  <div className={cn("rd-fallback-widget", className)} style={{ fontSize: 12, color: "#999" }}>
    Unknown widget type. data: {JSON.stringify(data)}
  </div>
);

/**
 * Widget Registry 생성.
 * 단순 객체 반환. 존재하지 않는 type에 대한 fallback은 Dashboard에서 처리.
 */
export const createWidgetRegistry = (widgets: WidgetRegistry): WidgetRegistry => ({ ...widgets });
