import React from "react";

export type TopBarProps = {
  title?: string;
  /** 사용자 정의 대시보드 선택기. 미주입 시 기본 제공 안 함 → children으로 직접 넣거나 자체 컴포넌트 사용 */
  dashboardPicker?: React.ReactNode;
  /** 사용자 정의 시간 범위 선택기. 미주입 시 기본 제공 안 함 → children으로 직접 넣거나 자체 컴포넌트 사용 */
  timeRangePicker?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

const defaultStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "8px 16px",
  borderBottom: "1px solid #e0e0e0",
  background: "#fff",
  minHeight: 48,
};

const rightStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

export const TopBar: React.FC<TopBarProps> = ({
  title,
  dashboardPicker,
  timeRangePicker,
  children,
  className,
  style,
}) => (
  <header className={className} style={{ ...defaultStyle, ...style }} role="banner">
    {title != null && <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h1>}
    <div style={rightStyle}>
      {dashboardPicker}
      {timeRangePicker}
      {children}
    </div>
  </header>
);
