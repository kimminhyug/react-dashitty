import React, { useEffect, useRef, useState } from "react";
import { WidgetContainer } from "../widget-wrapper";
import type { PanelProps } from "../shared";

/**
 * GridItem 단위 wrapper.
 * 위젯은 래퍼만 제공하고, 콘텐츠는 content(props)로 주입.
 * drag/resize 이벤트는 GridLayout이 처리하고 store.dispatch로 전달하므로
 * 이 컴포넌트는 터치하지 않는다.
 */
const panelRootStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  overflow: "visible",
  background: "#fff",
  border: "1px solid #e0e0e0",
  borderRadius: 6,
  boxSizing: "border-box",
  position: "relative",
};

/** 위젯 콘텐츠 래퍼. overflow: visible 로 두어 위젯 내 툴팁이 패널 밖으로 나와 잘리지 않음 */
const panelContentClipStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  overflow: "visible",
  borderRadius: 6,
  position: "relative",
};

const menuButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: 6,
  right: 6,
  zIndex: 2,
  width: 24,
  height: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: 4,
  background: "rgba(0,0,0,0.06)",
  cursor: "pointer",
  fontSize: 14,
  color: "#555",
};

const dropdownStyle: React.CSSProperties = {
  position: "absolute",
  top: 32,
  right: 6,
  zIndex: 10,
  minWidth: 120,
  background: "#fff",
  border: "1px solid #e0e0e0",
  borderRadius: 6,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  padding: 4,
};

const dropdownItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "6px 10px",
  border: "none",
  borderRadius: 4,
  background: "none",
  cursor: "pointer",
  fontSize: 12,
  textAlign: "left",
  color: "#333",
};

const cn = (...parts: (string | undefined)[]) =>
  parts.filter(Boolean).join(" ");

export const Panel: React.FC<PanelProps> = ({
  item,
  title,
  content,
  className,
  style,
  containerClassName,
  containerStyle,
  onAction,
  selected,
  onSelect,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpen]);

  const handleAction = (type: "remove" | "duplicate" | "edit") => {
    onAction?.({ type, id: item.id });
    setMenuOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn("rd-panel", className)}
      style={{
        ...panelRootStyle,
        ...style,
        ...(selected
          ? { border: "2px solid #1976d2", boxShadow: "0 0 0 1px #1976d2" }
          : {}),
      }}
      onClick={() => onSelect?.()}
      role={onSelect ? "button" : undefined}
      aria-pressed={selected}
    >
      {onAction != null && (
        <>
          <button
            type="button"
            aria-label="Panel actions"
            style={menuButtonStyle}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            ⋮
          </button>
          {menuOpen && (
            <div style={dropdownStyle} role="menu">
              <button
                type="button"
                style={dropdownItemStyle}
                role="menuitem"
                onClick={() => handleAction("duplicate")}
              >
                Duplicate
              </button>
              <button
                type="button"
                style={dropdownItemStyle}
                role="menuitem"
                onClick={() => handleAction("remove")}
              >
                Remove
              </button>
              <button
                type="button"
                style={dropdownItemStyle}
                role="menuitem"
                onClick={() => handleAction("edit")}
              >
                Edit
              </button>
            </div>
          )}
        </>
      )}
      <div style={panelContentClipStyle}>
        <WidgetContainer
          title={title}
          className={containerClassName}
          style={containerStyle}
        >
          {content ?? (
            <div style={{ fontSize: 12, color: "#999" }}>No content</div>
          )}
        </WidgetContainer>
      </div>
    </div>
  );
};
