import React from "react";

export type TimeRangePreset = {
  label: string;
  value: string;
};

export type TimeRangePickerProps = {
  presets?: TimeRangePreset[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
};

const defaultPresets: TimeRangePreset[] = [
  { label: "Last 5m", value: "5m" },
  { label: "Last 15m", value: "15m" },
  { label: "Last 1h", value: "1h" },
  { label: "Last 6h", value: "6h" },
  { label: "Last 24h", value: "24h" },
];

const wrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const selectStyle: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: 14,
  border: "1px solid #e0e0e0",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
};

export const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  presets = defaultPresets,
  value,
  onChange,
  className,
  style,
}) => (
  <div className={className} style={{ ...wrapStyle, ...style }}>
    <select
      style={selectStyle}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {presets.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  </div>
);
