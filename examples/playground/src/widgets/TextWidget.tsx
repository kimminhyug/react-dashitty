import React from "react";
import type {
  WidgetDefinition,
  WidgetOptionSchema,
  WidgetProps,
} from "dashboardity";
import { cn } from "dashboardity";

const TextWidgetComponent: React.FC<WidgetProps<unknown>> = ({
  data,
  className,
}) => {
  const wrap = (node: React.ReactNode) => (
    <div
      className={cn("rd-text-widget", className)}
      style={{ fontSize: 14, color: "#333", flex: 1, minHeight: 0 }}
    >
      {node}
    </div>
  );
  if (data == null)
    return wrap(<span style={{ fontSize: 12, color: "#999" }}>No data</span>);
  if (typeof data === "string") return wrap(<span>{data}</span>);
  if (typeof data === "object" && "content" in data)
    return wrap((data as { content: React.ReactNode }).content);
  if (typeof data === "object" && "text" in data)
    return wrap(String((data as { text: unknown }).text));
  return wrap(String(data));
};

const textOptionSchema: WidgetOptionSchema = {
  title: { type: "string", label: "Title", placeholder: "Panel title" },
};

export const TextWidget: WidgetDefinition = {
  Component: TextWidgetComponent,
  options: textOptionSchema,
};
