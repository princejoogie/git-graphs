import type { ContributorData } from "../git";
import { formatNumber, formatDate } from "../git";
import { MiniBarChart } from "./BarChart";
import { colors } from "../theme";

interface ContributorCardProps {
  contributor: ContributorData;
  rank: number;
  columnWidth: `${number}%`;
}

export function ContributorCard({ contributor, rank, columnWidth }: ContributorCardProps) {
  const weeklyCommitCounts = contributor.weeklyCommits.map((w) => w.commits);
  const firstCommitDate = contributor.weeklyCommits[0]?.weekStart;
  const lastCommitDate = contributor.weeklyCommits[contributor.weeklyCommits.length - 1]?.weekStart;

  return (
    <box
      border
      borderStyle="rounded"
      borderColor={colors.border.default}
      backgroundColor={colors.background.secondary}
      padding={1}
      flexDirection="column"
      width={columnWidth}
      height={12}
    >
      <box flexDirection="row" justifyContent="space-between">
        <box flexDirection="row">
          <text fg={colors.text.primary} content={contributor.name} />
        </box>
        <text fg={colors.text.secondary} content={`#${rank}`} />
      </box>

      <box flexDirection="row" marginTop={1}>
        <text fg={colors.text.secondary} content={`${contributor.commits} commits  `} />
        <text fg={colors.accent.green} content={`${formatNumber(contributor.additions)}++ `} />
        <text fg={colors.accent.red} content={`${formatNumber(contributor.deletions)}--`} />
      </box>

      <box marginTop={1} flexGrow={1}>
        <MiniBarChart data={weeklyCommitCounts} width={30} color={colors.chart.primary} />
      </box>

      <box flexDirection="row" justifyContent="space-between">
        <text fg={colors.text.muted} content={firstCommitDate ? formatDate(firstCommitDate) : ""} />
        <text fg={colors.text.muted} content={lastCommitDate ? formatDate(lastCommitDate) : ""} />
      </box>
    </box>
  );
}
