export const colors = {
  background: {
    primary: "#010409",
    secondary: "#0D1117",
    tertiary: "#161B22",
    elevated: "#1C2128",
  },
  border: {
    default: "#30363D",
    muted: "#21262D",
    accent: "#58A6FF",
  },
  text: {
    primary: "#E6EDF3",
    secondary: "#8B949E",
    muted: "#6E7681",
    link: "#58A6FF",
  },
  accent: {
    blue: "#58A6FF",
    blueMuted: "#1F6FEB",
    green: "#3FB950",
    greenMuted: "#238636",
    red: "#F85149",
    redMuted: "#DA3633",
    yellow: "#D29922",
    purple: "#A371F7",
  },
  chart: {
    primary: "#58A6FF",
    primaryMuted: "#1F6FEB",
    secondary: "#3FB950",
    tertiary: "#D29922",
  },
  state: {
    success: "#3FB950",
    error: "#F85149",
    warning: "#D29922",
    info: "#58A6FF",
  },
} as const;

export type Colors = typeof colors;
