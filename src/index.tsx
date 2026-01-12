import { createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useEffect, useState } from "react";
import { getGitStats, formatDate, type GitStats } from "./git";
import { BarChart } from "./components/BarChart";
import { ContributorCard } from "./components/ContributorCard";

const repoPath = process.argv[2] || ".";

function App() {
  const [stats, setStats] = useState<GitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dimensions = useTerminalDimensions();

  useEffect(() => {
    getGitStats(repoPath)
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load git stats");
        setLoading(false);
      });
  }, []);

  useKeyboard((key) => {
    if (key.name === "q" || (key.ctrl && key.name === "c")) {
      process.exit(0);
    }
  });

  if (loading) {
    return (
      <box alignItems="center" justifyContent="center" flexGrow={1}>
        <text fg="#8B949E" content="Loading git statistics..." />
      </box>
    );
  }

  if (error) {
    return (
      <box alignItems="center" justifyContent="center" flexGrow={1} flexDirection="column">
        <text fg="#F85149" content={`Error: ${error}`} />
        <text fg="#8B949E" content="Make sure you're in a git repository" />
      </box>
    );
  }

  if (!stats || stats.totalCommits === 0) {
    return (
      <box alignItems="center" justifyContent="center" flexGrow={1}>
        <text fg="#8B949E" content="No commits found in this repository" />
      </box>
    );
  }

  const dateRangeStr = `Weekly from ${formatDate(stats.dateRange.start)} to ${formatDate(stats.dateRange.end)}`;
  const weeklyCommitCounts = stats.weeklyData.map((w) => w.commits);
  const maxCommitsInWeek = Math.max(...weeklyCommitCounts, 1);

  const chartLabels: string[] = [];
  const labelInterval = Math.max(1, Math.floor(stats.weeklyData.length / 6));
  for (let i = 0; i < stats.weeklyData.length; i += labelInterval) {
    chartLabels.push(formatDate(stats.weeklyData[i].weekStart));
  }

  const numColumns = dimensions.width >= 180 ? 4 : dimensions.width >= 120 ? 3 : 2;
  const columnWidth = `${Math.floor(100 / numColumns)}%`;

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor="#010409">
      <box
        flexDirection="column"
        padding={1}
        border
        borderColor="#30363D"
        backgroundColor="#0D1117"
      >
        <box flexDirection="row" width="100%">
          <text fg="#E6EDF3" content="Contributors" flexGrow={1} />
          <text fg="#8B949E" content="Press 'q' to quit" />
        </box>
        <text fg="#8B949E" content="Contributions per week to main, excluding merge commits" />
      </box>

      <scrollbox
        focused
        flexGrow={1}
        style={{
          rootOptions: { backgroundColor: "#010409" },
          contentOptions: { backgroundColor: "#010409" },
        }}
      >
        <box flexDirection="column" padding={1}>
          <box
            border
            borderStyle="rounded"
            borderColor="#30363D"
            backgroundColor="#0D1117"
            flexDirection="column"
            padding={1}
            marginBottom={1}
          >
            <box flexDirection="row" justifyContent="space-between">
              <text fg="#E6EDF3" content="Commits over time" />
              <text fg="#8B949E" content={`Max: ${maxCommitsInWeek}/week`} />
            </box>
            <text fg="#8B949E" content={dateRangeStr} />

            <box marginTop={1} height={10}>
              <BarChart
                data={weeklyCommitCounts}
                height={8}
                width={dimensions.width - 10}
                color="#4A9EFF"
              />
            </box>

            <box flexDirection="row" marginTop={1}>
              {chartLabels.map((label, i) => (
                <text
                  key={i}
                  fg="#8B949E"
                  content={label.padEnd(Math.floor((dimensions.width - 10) / chartLabels.length))}
                />
              ))}
            </box>
          </box>

          <box flexDirection="row" flexWrap="wrap">
            {stats.contributors.map((contributor, i) => (
              <ContributorCard
                key={contributor.email || contributor.name}
                contributor={contributor}
                rank={i + 1}
                columnWidth={columnWidth}
              />
            ))}
          </box>
        </box>
      </scrollbox>
    </box>
  );
}

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);
