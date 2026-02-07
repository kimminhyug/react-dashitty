import React from "react";
import type {
  PanelConfig,
  PanelOptionEditorProps,
  WidgetOptionSchema,
  WidgetOptionSchemaField,
} from "../shared";

const fieldBlockStyle: React.CSSProperties = {
  marginBottom: 12,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#555",
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  fontSize: 12,
  border: "1px solid #e0e0e0",
  borderRadius: 4,
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const checkboxWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

/** 스키마 필드 + 값 + 옵션 변경 시 호출. Grafana처럼 schema → form 자동 생성 */
const renderOptionField = (
  key: string,
  field: WidgetOptionSchemaField,
  value: unknown,
  onChange: (value: unknown) => void,
): React.ReactNode => {
  const label = <label style={labelStyle}>{field.label}</label>;

  switch (field.type) {
    case "string":
      return (
        <div key={key} style={fieldBlockStyle}>
          {label}
          <input
            type="text"
            style={inputStyle}
            value={value != null ? String(value) : ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case "number": {
      const num = value != null ? Number(value) : 0;
      return (
        <div key={key} style={fieldBlockStyle}>
          {label}
          <input
            type="number"
            style={inputStyle}
            value={num}
            min={field.min}
            max={field.max}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
          />
        </div>
      );
    }
    case "boolean":
      return (
        <div key={key} style={fieldBlockStyle}>
          <div style={checkboxWrapStyle}>
            <input
              type="checkbox"
              id={`opt-${key}`}
              checked={value === true || value === "true"}
              onChange={(e) => onChange(e.target.checked)}
            />
            <label
              htmlFor={`opt-${key}`}
              style={{ ...labelStyle, marginBottom: 0 }}
            >
              {field.label}
            </label>
          </div>
        </div>
      );
    case "select":
      return (
        <div key={key} style={fieldBlockStyle}>
          {label}
          <select
            style={selectStyle}
            value={value != null ? String(value) : ""}
            onChange={(e) => onChange(e.target.value)}
          >
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    case "color":
      return (
        <div key={key} style={fieldBlockStyle}>
          {label}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="color"
              value={value != null ? String(value) : "#333333"}
              onChange={(e) => onChange(e.target.value)}
              style={{
                width: 32,
                height: 28,
                padding: 0,
                border: "1px solid #e0e0e0",
                cursor: "pointer",
              }}
            />
            <input
              type="text"
              style={{ ...inputStyle, flex: 1 }}
              value={value != null ? String(value) : ""}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </div>
      );
    default: {
      const _: never = field;
      return null;
    }
  }
};

/** 기본 스키마: title 등 공통 옵션. 위젯별 schema 없을 때 사용 */
const defaultOptionSchema: WidgetOptionSchema = {
  title: { type: "string", label: "Title", placeholder: "Panel title" },
};

/**
 * PanelOptionEditor.
 * layout/store 접근 없음. PanelConfig.options 만 수정.
 */
export const PanelOptionEditor: React.FC<PanelOptionEditorProps> = ({
  panel,
  schema,
  onChange,
}) => {
  const options = panel.options ?? {};
  const effectiveSchema = schema ?? defaultOptionSchema;

  const handleOptionChange = (key: string, value: unknown) => {
    const next: PanelConfig = {
      ...panel,
      options: { ...options, [key]: value },
    };
    onChange(next);
  };

  return (
    <div style={{ padding: 12 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 12,
          color: "#333",
        }}
      >
        Panel options
      </div>
      {Object.entries(effectiveSchema).map(([key, field]) =>
        renderOptionField(key, field, options[key], (v) =>
          handleOptionChange(key, v),
        ),
      )}
    </div>
  );
};
