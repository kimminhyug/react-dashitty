/** 색상 토큰 */
export const colors = {
  text: "#333",
  textMuted: "#555",
  textSubtle: "#999",
  border: "#e0e0e0",
  background: "#fff",
  primary: "#1976d2",
  success: "#73bf69",
  warning: "#ff9830",
  danger: "#f2495c",
  chartGradientStart: "#73bf69",
  chartGradientEnd: "#5794f2",
} as const;

/** spacing (px) */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

/** typography */
export const typography = {
  fontSize: {
    xs: 11,
    sm: 12,
    md: 14,
    lg: 18,
    xl: 24,
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export type Theme = {
  colors: typeof colors;
  spacing: typeof spacing;
  typography: typeof typography;
};

export const defaultTheme: Theme = {
  colors,
  spacing,
  typography,
};
