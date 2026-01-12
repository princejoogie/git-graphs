import { colors } from "../theme";

export type PeriodFilter = "all" | "year" | "month" | "week";
export type SortBy = "commits" | "additions" | "deletions";

interface SidebarProps {
  period: PeriodFilter;
  sortBy: SortBy;
  onPeriodChange: (period: PeriodFilter) => void;
  onSortByChange: (sortBy: SortBy) => void;
  selectedIndex: number;
  focused: boolean;
}

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "year", label: "Last year" },
  { value: "month", label: "Last month" },
  { value: "week", label: "Last week" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "commits", label: "Commits" },
  { value: "additions", label: "Additions" },
  { value: "deletions", label: "Deletions" },
];

export function Sidebar({
  period,
  sortBy,
  onPeriodChange,
  onSortByChange,
  selectedIndex,
  focused,
}: SidebarProps) {
  return (
    <box
      flexDirection="column"
      width={22}
      backgroundColor={colors.background.secondary}
      borderColor={colors.border.default}
      border
      borderStyle="rounded"
      padding={1}
    >
      <text fg={colors.text.primary} content="Filters" />
      <box height={1} />

      <text fg={colors.text.secondary} content="Period" />
      <box flexDirection="column" marginTop={1} marginBottom={1}>
        {PERIOD_OPTIONS.map((opt, i) => {
          const isSelected = period === opt.value;
          const isFocused = focused && selectedIndex === i;
          return (
            <box key={opt.value} flexDirection="row">
              <text
                fg={isFocused ? colors.background.primary : isSelected ? colors.accent.blue : colors.text.secondary}
                bg={isFocused ? colors.accent.blue : undefined}
                content={` ${isSelected ? "●" : "○"} ${opt.label} `}
              />
            </box>
          );
        })}
      </box>

      <box height={1} backgroundColor={colors.border.default} marginTop={1} marginBottom={1} />

      <text fg={colors.text.secondary} content="Sort by" />
      <box flexDirection="column" marginTop={1}>
        {SORT_OPTIONS.map((opt, i) => {
          const isSelected = sortBy === opt.value;
          const actualIndex = PERIOD_OPTIONS.length + i;
          const isFocused = focused && selectedIndex === actualIndex;
          return (
            <box key={opt.value} flexDirection="row">
              <text
                fg={isFocused ? colors.background.primary : isSelected ? colors.accent.blue : colors.text.secondary}
                bg={isFocused ? colors.accent.blue : undefined}
                content={` ${isSelected ? "●" : "○"} ${opt.label} `}
              />
            </box>
          );
        })}
      </box>

      <box flexGrow={1} />

      <box flexDirection="column" marginTop={1}>
        <box height={1} backgroundColor={colors.border.default} marginBottom={1} />
        <text fg={colors.text.muted} content="↑↓ Navigate" />
        <text fg={colors.text.muted} content="Enter Select" />
        <text fg={colors.text.muted} content="Tab Switch" />
        <text fg={colors.text.muted} content="q Quit" />
      </box>
    </box>
  );
}

export const TOTAL_SIDEBAR_OPTIONS = PERIOD_OPTIONS.length + SORT_OPTIONS.length;
