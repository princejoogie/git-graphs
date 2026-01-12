import { createCliRenderer, type CliRenderer } from "@opentui/core";
import { createRoot, useKeyboard, useTerminalDimensions } from "@opentui/react";
import { useEffect, useState, useMemo } from "react";
import { getGitStats, type GitStats, type WeeklyData } from "./git";
import { colors } from "./theme";
import {
  Sidebar,
  TOTAL_SIDEBAR_OPTIONS,
  Header,
  CommitsChart,
  ContributorCard,
  type PeriodFilter,
  type SortBy,
} from "./components";
import { defaultKeybinds, matchKeybind, type ParsedKey } from "./keybinds";

const repoPath = process.argv[2] || ".";

let cliRenderer: CliRenderer | null = null;

function exitApp(exitCode: number = 0) {
  try {
    cliRenderer?.setTerminalTitle?.("");
    cliRenderer?.destroy();
  } finally {
    process.exitCode = exitCode;
    setTimeout(() => process.exit(exitCode), 0);
  }
}

function filterByPeriod<T extends { weekStart: Date }>(data: T[], period: PeriodFilter): T[] {
  if (period === "all") return data;

  const now = new Date();
  let cutoff: Date;

  switch (period) {
    case "week":
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "year":
      cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return data;
  }

  return data.filter((d) => d.weekStart >= cutoff);
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function padWeeklyDataToNow(weeklyData: WeeklyData[], now: Date): WeeklyData[] {
  const first = weeklyData[0];
  if (!first) return weeklyData;

  const start = getWeekStart(first.weekStart);
  const end = getWeekStart(now);

  const byKey = new Map<string, WeeklyData>();
  for (const w of weeklyData) {
    byKey.set(getWeekStart(w.weekStart).toISOString(), w);
  }

  const padded: WeeklyData[] = [];
  for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = addWeeks(cursor, 1)) {
    const key = cursor.toISOString();
    const existing = byKey.get(key);
    padded.push(
      existing ?? {
        weekStart: new Date(cursor),
        commits: 0,
        additions: 0,
        deletions: 0,
      }
    );
  }

  return padded;
}

function App() {
  const [stats, setStats] = useState<GitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("commits");
  const [sidebarFocused, setSidebarFocused] = useState(false);
  const [sidebarIndex, setSidebarIndex] = useState(0);
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

  const filteredData = useMemo(() => {
    if (!stats) return null;

    const filteredWeekly = filterByPeriod(stats.weeklyData, period);
    const chartWeekly = period === "all" ? padWeeklyDataToNow(filteredWeekly, new Date()) : filteredWeekly;

    const contributorStats = new Map<
      string,
      {
        name: string;
        email: string;
        commits: number;
        additions: number;
        deletions: number;
        weeklyCommits: WeeklyData[];
      }
    >();

    for (const contributor of stats.contributors) {
      const filteredWeeks = filterByPeriod(contributor.weeklyCommits, period);
      if (filteredWeeks.length === 0) continue;

      const totals = filteredWeeks.reduce(
        (acc, w) => ({
          commits: acc.commits + w.commits,
          additions: acc.additions + w.additions,
          deletions: acc.deletions + w.deletions,
        }),
        { commits: 0, additions: 0, deletions: 0 }
      );

      contributorStats.set(contributor.email || contributor.name, {
        name: contributor.name,
        email: contributor.email,
        commits: totals.commits,
        additions: totals.additions,
        deletions: totals.deletions,
        weeklyCommits: filteredWeeks,
      });
    }

    const sortedContributors = Array.from(contributorStats.values()).sort((a, b) => {
      switch (sortBy) {
        case "commits":
          return b.commits - a.commits;
        case "additions":
          return b.additions - a.additions;
        case "deletions":
          return b.deletions - a.deletions;
        default:
          return b.commits - a.commits;
      }
    });

    return {
      weeklyData: chartWeekly,
      contributors: sortedContributors,
    };
  }, [stats, period, sortBy]);

  useKeyboard((key) => {
    const parsedKey: ParsedKey = {
      name: key.name,
      ctrl: key.ctrl || false,
      shift: key.shift || false,
      meta: key.meta || false,
    };

    if (matchKeybind(parsedKey, defaultKeybinds.quit)) {
      exitApp(0);
    }

    if (matchKeybind(parsedKey, defaultKeybinds.toggleSidebar)) {
      setSidebarFocused((prev) => !prev);
    }

    if (sidebarFocused) {
      if (matchKeybind(parsedKey, defaultKeybinds.navigateUp)) {
        setSidebarIndex((prev) => Math.max(0, prev - 1));
      } else if (matchKeybind(parsedKey, defaultKeybinds.navigateDown)) {
        setSidebarIndex((prev) => Math.min(TOTAL_SIDEBAR_OPTIONS - 1, prev + 1));
      } else if (matchKeybind(parsedKey, defaultKeybinds.select)) {
        if (sidebarIndex < 4) {
          const periods: PeriodFilter[] = ["all", "year", "month", "week"];
          const nextPeriod = periods[sidebarIndex];
          if (nextPeriod) setPeriod(nextPeriod);
        } else {
          const sorts: SortBy[] = ["commits", "additions", "deletions"];
          const nextSort = sorts[sidebarIndex - 4];
          if (nextSort) setSortBy(nextSort);
        }
      }
    }
  });

  if (loading) {
    return (
      <box alignItems="center" justifyContent="center" flexGrow={1} backgroundColor={colors.background.primary}>
        <box flexDirection="column" alignItems="center">
          <text fg={colors.accent.blue} content="◐ Loading git statistics..." />
        </box>
      </box>
    );
  }

  if (error) {
    return (
      <box
        alignItems="center"
        justifyContent="center"
        flexGrow={1}
        flexDirection="column"
        backgroundColor={colors.background.primary}
      >
        <text fg={colors.state.error} content={`✖ Error: ${error}`} />
        <text fg={colors.text.secondary} content="Make sure you're in a git repository" />
      </box>
    );
  }

  if (!stats || stats.totalCommits === 0 || !filteredData) {
    return (
      <box alignItems="center" justifyContent="center" flexGrow={1} backgroundColor={colors.background.primary}>
        <text fg={colors.text.secondary} content="No commits found in this repository" />
      </box>
    );
  }

  const sidebarWidth = 24;
  const contentWidth = dimensions.width - sidebarWidth - 2;
  const numColumns = contentWidth >= 150 ? 4 : contentWidth >= 100 ? 3 : 2;
  const columnWidth = `${Math.floor(100 / numColumns)}%` as const;

  const totalCommits = filteredData.contributors.reduce((sum, c) => sum + c.commits, 0);
  const totalAdditions = filteredData.contributors.reduce((sum, c) => sum + c.additions, 0);
  const totalDeletions = filteredData.contributors.reduce((sum, c) => sum + c.deletions, 0);

  return (
    <box flexDirection="column" flexGrow={1} backgroundColor={colors.background.primary}>
      <Header
        repoPath={repoPath}
        contributorCount={filteredData.contributors.length}
        totalCommits={totalCommits}
        totalAdditions={totalAdditions}
        totalDeletions={totalDeletions}
        terminalWidth={dimensions.width}
      />

      <box flexDirection="row" flexGrow={1}>
        <Sidebar
          period={period}
          sortBy={sortBy}
          onPeriodChange={setPeriod}
          onSortByChange={setSortBy}
          selectedIndex={sidebarIndex}
          focused={sidebarFocused}
        />

        <scrollbox
          focused={!sidebarFocused}
          flexGrow={1}
          style={{
            rootOptions: { backgroundColor: colors.background.primary },
            contentOptions: { backgroundColor: colors.background.primary },
          }}
        >
          <box flexDirection="column" padding={1}>
             <CommitsChart
              weeklyData={filteredData.weeklyData}
              width={contentWidth - 6}
              startDate={period === "all" ? stats.dateRange.start : undefined}
              endDate={period === "all" ? new Date() : undefined}
            />


            {filteredData.contributors.length > 0 ? (
              <box flexDirection="row" flexWrap="wrap">
                {filteredData.contributors.map((contributor, i) => (
                  <ContributorCard
                    key={contributor.email || contributor.name}
                    contributor={contributor}
                    rank={i + 1}
                    columnWidth={columnWidth}
                  />
                ))}
              </box>
            ) : (
              <box alignItems="center" justifyContent="center" height={10}>
                <text fg={colors.text.muted} content="No contributors for selected period" />
              </box>
            )}
          </box>
        </scrollbox>
      </box>
    </box>
  );
}

const renderer = await createCliRenderer();
cliRenderer = renderer;
createRoot(renderer).render(<App />);
