export interface KeybindConfig {
  quit: string[];
  toggleSidebar: string[];
  navigateUp: string[];
  navigateDown: string[];
  select: string[];
}

export const defaultKeybinds: KeybindConfig = {
  quit: ["q", "ctrl+c"],
  toggleSidebar: ["tab"],
  navigateUp: ["up", "k"],
  navigateDown: ["down", "j"],
  select: ["return", "space"],
};

export interface ParsedKey {
  name: string;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
}

export function matchKeybind(key: ParsedKey, bindings: string[]): boolean {
  for (const binding of bindings) {
    const parts = binding.toLowerCase().split("+");
    const keyName = parts[parts.length - 1];
    const needsCtrl = parts.includes("ctrl");
    const needsShift = parts.includes("shift");
    const needsMeta = parts.includes("meta");

    if (
      key.name === keyName &&
      key.ctrl === needsCtrl &&
      key.shift === needsShift &&
      key.meta === needsMeta
    ) {
      return true;
    }
  }
  return false;
}

export function formatKeybind(bindings: string[]): string {
  if (bindings.length === 0) return "";
  return bindings[0]
    .split("+")
    .map((part) => {
      if (part === "ctrl") return "^";
      if (part === "return") return "↵";
      if (part === "space") return "␣";
      if (part === "up") return "↑";
      if (part === "down") return "↓";
      if (part === "tab") return "⇥";
      return part.toUpperCase();
    })
    .join("");
}
