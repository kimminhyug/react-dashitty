import React from "react";

export type DashboardOption = { id: string; title: string };

export type DashboardPickerProps = {
  options?: DashboardOption[];
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
};

const selectStyle: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: 14,
  border: "1px solid #e0e0e0",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
};

export const DashboardPicker: React.FC<DashboardPickerProps> = ({
  options = [],
  value,
  onChange,
  className,
  style,
}) => (
  <select
    className={className}
    style={{ ...selectStyle, ...style }}
    value={value ?? ""}
    onChange={(e) => onChange?.(e.target.value)}
  >
    {options.map((opt) => (
      <option key={opt.id} value={opt.id}>
        {opt.title}
      </option>
    ))}
  </select>
);
