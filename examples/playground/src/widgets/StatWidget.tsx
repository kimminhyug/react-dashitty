import React from "react";
import type {
  WidgetDefinition,
  WidgetOptionSchema,
  WidgetProps,
} from "dashboardity";
import { cn } from "dashboardity";

const StatWidgetComponent: React.FC<
  WidgetProps<number | { value?: number }>
> = ({ data, options = {}, className }) => {
  const value =
    typeof data === "number"
      ? data
      : data && typeof data === "object" && "value" in data
        ? Number((data as { value?: number }).value)
        : 0;
  const unit = (options.unit as string) ?? "";

  return (
    <div
      className={cn("rd-stat-widget", className)}
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        fontWeight: 600,
        color: "#333",
      }}
    >
      {value}
      {unit}
    </div>
  );
};

const statOptionSchema: WidgetOptionSchema = {
  title: { type: "string", label: "Title", placeholder: "Panel title" },
  unit: { type: "string", label: "Unit", placeholder: "e.g. %" },
  valueColor: { type: "color", label: "Value Color" },
};

export const StatWidget: WidgetDefinition = {
  Component: StatWidgetComponent,
  options: statOptionSchema,
};
