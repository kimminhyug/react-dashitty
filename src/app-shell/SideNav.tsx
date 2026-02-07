import React from "react";

export type SideNavItem = { id: string; label: string; href?: string };

export type SideNavProps = {
  items?: SideNavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
};

const navStyle: React.CSSProperties = {
  width: 220,
  flexShrink: 0,
  borderRight: "1px solid #e0e0e0",
  background: "#fafafa",
  padding: "16px 0",
};

const itemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "8px 16px",
  border: "none",
  background: "none",
  textAlign: "left",
  cursor: "pointer",
  fontSize: 14,
  color: "#333",
};

export const SideNav: React.FC<SideNavProps> = ({ items = [], activeId, onSelect, className, style }) => (
  <nav className={className} style={{ ...navStyle, ...style }} role="navigation">
    {items.map((item) => (
      <button
        key={item.id}
        type="button"
        style={{
          ...itemStyle,
          ...(activeId === item.id ? { background: "rgba(25,118,210,0.08)", fontWeight: 600 } : {}),
        }}
        onClick={() => onSelect?.(item.id)}
      >
        {item.label}
      </button>
    ))}
  </nav>
);
