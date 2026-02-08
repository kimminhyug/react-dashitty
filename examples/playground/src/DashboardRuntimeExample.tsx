/**
 * DashboardRuntime 예제.
 * 상태/편집은 Runtime이 담당, Dashboard는 순수 렌더만.
 * ref로 addPanel / removePanel / export() / exportToFile() 호출 가능.
 * Import: JSON 파일 선택 시 스펙 교체.
 */

import {
  createStaticDataSource,
  createWidgetRegistry,
  DashboardRuntime,
  parseDashboardSpec,
  type DashboardRuntimeHandle,
  type DashboardSpec,
} from "dashboardity";
import React, { useRef, useState } from "react";
import { StatWidget, TextWidget } from "./widgets";

const COLUMNS = 12;

const defaultSpec: DashboardSpec = {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [spec, setSpec] = useState<DashboardSpec>(() => defaultSpec);
  const [mode, setMode] = useState<"view" | "edit">("edit");
  const [lastExported, setLastExported] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleChange = (next: DashboardSpec) => {
    console.log("onChange", next.id, next.panels.length, "panels");
  };

  const handleExportPreview = () => {
    const data = runtimeRef.current?.export();
    if (data) setLastExported(JSON.stringify(data, null, 2));
  };

  const handleExportToFile = () => {
    runtimeRef.current?.exportToFile();
  };

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        const parsed = parseDashboardSpec(text);
        setSpec(parsed);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Invalid JSON");
      }
    };
    reader.readAsText(file, "utf-8");
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
          onClick={handleExportToFile}
          style={{ padding: "6px 12px", cursor: "pointer" }}
        >
          Export (파일 다운로드)
        </button>
        <button
          type="button"
          onClick={handleExportPreview}
          style={{ padding: "6px 12px", cursor: "pointer" }}
        >
          Export (미리보기)
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          style={{ padding: "6px 12px", cursor: "pointer" }}
        >
          Import (JSON 파일)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={handleImportFile}
        />
      </div>
      {importError != null && (
        <div style={{ marginBottom: 8, color: "#c00", fontSize: 12 }}>
          Import 오류: {importError}
        </div>
      )}
      <DashboardRuntime
        ref={runtimeRef}
        key={spec.id}
        initialSpec={spec}
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
