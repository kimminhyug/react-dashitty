/**
 * DashboardRuntime 예제.
 * 상태/편집은 Runtime이 담당, Dashboard는 순수 렌더만.
 * ref로 addPanel / removePanel / export() 호출 가능 (툴바/단축키/저장 연동용).
 */

import {
  createStaticDataSource,
  createWidgetRegistry,
  DashboardRuntime,
  type DashboardRuntimeHandle,
  type DashboardSpec,
} from "dashboardity";
import React, { useRef, useState } from "react";
import { StatWidget, TextWidget } from "./widgets";

const COLUMNS = 12;

const initialSpec: DashboardSpec = {
  id: "demo-1",
  title: "Demo Dashboard",
  columns: COLUMNS,
  layout: {
    items: [
      { id: "panel-stat", x: 0, y: 0, w: 6, h: 2 },
      { id: "panel-text", x: 6, y: 0, w: 6, h: 2 },
    ],
  },
  panels: [
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
  ],
};

const dataSource = createStaticDataSource({
  dataByKey: {
    stat: 42,
    text: "Hello, World! (DashboardRuntime)",
  },
});

const widgetRegistry = createWidgetRegistry({
  stat: StatWidget,
  text: TextWidget,
});

export const DashboardRuntimeExample: React.FC = () => {
  const runtimeRef = useRef<DashboardRuntimeHandle>(null);
  const [mode, setMode] = useState<"view" | "edit">("edit");
  const [lastExported, setLastExported] = useState<string | null>(null);

  const handleChange = (spec: DashboardSpec) => {
    console.log("onChange", spec.id, spec.panels.length, "panels");
  };

  const handleExport = () => {
    const spec = runtimeRef.current?.export();
    if (spec) setLastExported(JSON.stringify(spec, null, 2));
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
      <h2 style={{ marginBottom: 12 }}>DashboardRuntime</h2>
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => setMode((m) => (m === "edit" ? "view" : "edit"))}
          style={{ padding: "6px 12px", cursor: "pointer" }}
        >
          {mode === "edit" ? "보기 모드" : "편집 모드"}
        </button>
        <button
          type="button"
          onClick={handleExport}
          style={{ padding: "6px 12px", cursor: "pointer" }}
        >
          Export JSON (ref.export())
        </button>
      </div>
      <DashboardRuntime
        ref={runtimeRef}
        key={initialSpec.id}
        initialSpec={initialSpec}
        widgets={widgetRegistry}
        dataSource={dataSource}
        mode={mode}
        onChange={handleChange}
        rowHeight={32}
        gridOptions={{ showGrid: false }}
      />
      {lastExported != null && (
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            background: "#f5f5f5",
            borderRadius: 6,
            fontSize: 11,
            overflow: "auto",
            maxHeight: 200,
          }}
        >
          {lastExported}
        </pre>
      )}
    </div>
  );
};
