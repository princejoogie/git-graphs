import type { ContributorData } from "../git";
import { formatNumber, formatDate } from "../git";
import { MiniBarChart } from "./BarChart";

interface ContributorCardProps {
  contributor: ContributorData;
  rank: number;
  columnWidth: string;
}

export function ContributorCard({ contributor, rank, columnWidth }: ContributorCardProps) {
  const weeklyCommitCounts = contributor.weeklyCommits.map((w) => w.commits);
  const firstCommitDate = contributor.weeklyCommits[0]?.weekStart;
  const lastCommitDate = contributor.weeklyCommits[contributor.weeklyCommits.length - 1]?.weekStart;

  return (
    <box
      border
      borderStyle="rounded"
      borderColor="#30363D"
      backgroundColor="#0D1117"
      padding={1}
      flexDirection="column"
      width={columnWidth}
      height={12}
    >
      <box flexDirection="row" justifyContent="space-between">
        <box flexDirection="row">
          <text fg="#E6EDF3" content={contributor.name} />
        </box>
        <text fg="#8B949E" content={`#${rank}`} />
      </box>

      <box flexDirection="row" marginTop={1}>
        <text fg="#8B949E" content={`${contributor.commits} commits  `} />
        <text fg="#3FB950" content={`${formatNumber(contributor.additions)}++ `} />
        <text fg="#F85149" content={`${formatNumber(contributor.deletions)}--`} />
      </box>

      <box marginTop={1} flexGrow={1}>
        <MiniBarChart data={weeklyCommitCounts} width={30} color="#4A9EFF" />
      </box>

      <box flexDirection="row" justifyContent="space-between">
        <text fg="#8B949E" content={firstCommitDate ? formatDate(firstCommitDate) : ""} />
        <text fg="#8B949E" content={lastCommitDate ? formatDate(lastCommitDate) : ""} />
      </box>
    </box>
  );
}
