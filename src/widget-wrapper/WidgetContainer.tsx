import React from "react";
import type { CSSProperties } from "react";

export type WidgetContainerProps = {
  /** 위젯 상단에 표시할 제목 (options.title 등) */
  title?: string;
  children: React.ReactNode;
  /** 루트 요소 커스텀 */
  className?: string;
  style?: CSSProperties;
  /** 제목 영역 커스텀 */
  titleClassName?: string;
  titleStyle?: CSSProperties;
  /** 콘텐츠 영역 커스텀 */
  contentClassName?: string;
  contentStyle?: CSSProperties;
};

const rootStyle: CSSProperties = {
  padding: 12,
  height: "100%",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
};

const titleStyleDefault: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#333",
  marginBottom: 8,
  flexShrink: 0,
};

const contentStyleDefault: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
};

const cn = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" ");

/**
 * 모든 위젯이 공통으로 사용하는 컨테이너.
 * 제목 + 콘텐츠 영역 레이아웃과 패딩을 통일. className/style로 커스텀 가능.
 */
export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  title,
  children,
  className,
  style,
  titleClassName,
  titleStyle,
  contentClassName,
  contentStyle,
}) => {
  return (
    <div className={cn("rd-widget-container", className)} style={{ ...rootStyle, ...style }}>
      {title != null && title !== "" && (
        <div className={cn("rd-widget-container__title", titleClassName)} style={{ ...titleStyleDefault, ...titleStyle }}>
          {title}
        </div>
      )}
      <div
        className={cn("rd-widget-container__content", contentClassName)}
        style={{ ...contentStyleDefault, ...contentStyle }}
      >
        {children}
      </div>
    </div>
  );
};
