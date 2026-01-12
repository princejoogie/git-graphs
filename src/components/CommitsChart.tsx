import { colors } from "../theme";
import { formatDate } from "../git";
import { BarChart } from "./BarChart";
import type { WeeklyData } from "../git";

interface CommitsChartProps {
  weeklyData: WeeklyData[];
  width: number;
  startDate?: Date;
  endDate?: Date;
}

export function CommitsChart({ weeklyData, width, startDate: startDateOverride, endDate: endDateOverride }: CommitsChartProps) {
  const weeklyCommitCounts = weeklyData.map((w) => w.commits);
  const maxCommitsInWeek = Math.max(...weeklyCommitCounts, 1);

  const startDate = startDateOverride ?? weeklyData[0]?.weekStart;
  const endDate = endDateOverride ?? weeklyData[weeklyData.length - 1]?.weekStart;
  const dateRangeStr =
    startDate && endDate
      ? `Weekly from ${formatDate(startDate)} to ${formatDate(endDate)}`
      : "No data for selected period";

  const chartLabels: string[] = [];
  if (weeklyData.length > 0) {
    const labelInterval = Math.max(1, Math.floor(weeklyData.length / 6));
    for (let i = 0; i < weeklyData.length; i += labelInterval) {
      const week = weeklyData[i];
      if (!week) continue;
      chartLabels.push(formatDate(week.weekStart));
    }
  }

  return (
    <box
      border
      borderStyle="rounded"
      borderColor={colors.border.default}
      backgroundColor={colors.background.secondary}
      flexDirection="column"
      padding={1}
      marginBottom={1}
    >
      <box flexDirection="row" justifyContent="space-between">
        <box flexDirection="row">
          <text fg={colors.accent.blue} content="▊ " />
          <text fg={colors.text.primary} content="Commits over time" />
        </box>
        <text fg={colors.text.muted} content={`Max: ${maxCommitsInWeek}/week`} />
      </box>
      <text fg={colors.text.muted} content={dateRangeStr} />

      <box marginTop={1} height={10}>
        {weeklyCommitCounts.length > 0 ? (
          <BarChart
            data={weeklyCommitCounts}
            height={8}
            width={width}
            color={colors.chart.primary}
          />
        ) : (
          <text fg={colors.text.muted} content="No data for selected period" />
        )}
      </box>

      {chartLabels.length > 0 && (
        <box flexDirection="row" marginTop={1}>
          {chartLabels.map((label, i) => (
            <text
              key={i}
              fg={colors.text.muted}
              content={label.padEnd(Math.floor(width / chartLabels.length))}
            />
          ))}
        </box>
      )}
    </box>
  );
}
