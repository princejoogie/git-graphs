import { $ } from "bun";

export interface CommitData {
  hash: string;
  author: string;
  email: string;
  date: Date;
  additions: number;
  deletions: number;
}

export interface WeeklyData {
  weekStart: Date;
  commits: number;
  additions: number;
  deletions: number;
}

export interface ContributorData {
  name: string;
  email: string;
  commits: number;
  additions: number;
  deletions: number;
  weeklyCommits: WeeklyData[];
}

export interface GitStats {
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  weeklyData: WeeklyData[];
  contributors: ContributorData[];
  dateRange: { start: Date; end: Date };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekKey(date: Date): string {
  return getWeekStart(date).toISOString().split("T")[0];
}

function normalizeContributorKey(email: string): string {
  const normalized = email.toLowerCase().trim();
  
  const githubMatch = normalized.match(/^(\d+)\+.+@users\.noreply\.github\.com$/);
  if (githubMatch) {
    return `github:${githubMatch[1]}`;
  }
  
  return normalized;
}

export async function getGitStats(repoPath: string = "."): Promise<GitStats> {
  const result =
    await $`git -C ${repoPath} log --no-merges --format="%H|%an|%ae|%aI" --numstat`.text();

  const lines = result.trim().split("\n");
  const commits: CommitData[] = [];
  let currentCommit: Partial<CommitData> | null = null;

  const pushCurrentCommit = () => {
    if (currentCommit && currentCommit.hash) {
      commits.push({
        hash: currentCommit.hash,
        author: currentCommit.author || "Unknown",
        email: currentCommit.email || "",
        date: currentCommit.date || new Date(),
        additions: currentCommit.additions || 0,
        deletions: currentCommit.deletions || 0,
      });
    }
  };

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    const parts = line.split("|");
    const isCommitLine = parts.length === 4 && parts[0].length === 40 && /^[a-f0-9]+$/.test(parts[0]);

    if (isCommitLine) {
      pushCurrentCommit();
      const [hash, author, email, dateStr] = parts;
      currentCommit = {
        hash,
        author,
        email,
        date: new Date(dateStr),
        additions: 0,
        deletions: 0,
      };
    } else if (currentCommit && line.includes("\t")) {
      const tabParts = line.split("\t");
      if (tabParts.length >= 2) {
        const adds = parseInt(tabParts[0], 10) || 0;
        const dels = parseInt(tabParts[1], 10) || 0;
        currentCommit.additions = (currentCommit.additions || 0) + adds;
        currentCommit.deletions = (currentCommit.deletions || 0) + dels;
      }
    }
  }

  pushCurrentCommit();

  if (commits.length === 0) {
    return {
      totalCommits: 0,
      totalAdditions: 0,
      totalDeletions: 0,
      weeklyData: [],
      contributors: [],
      dateRange: { start: new Date(), end: new Date() },
    };
  }

  commits.sort((a, b) => a.date.getTime() - b.date.getTime());

  const dateRange = {
    start: commits[0].date,
    end: commits[commits.length - 1].date,
  };

  const weeklyMap = new Map<string, WeeklyData>();
  const contributorMap = new Map<
    string,
    {
      name: string;
      email: string;
      commits: number;
      additions: number;
      deletions: number;
      weeklyMap: Map<string, WeeklyData>;
    }
  >();

  for (const commit of commits) {
    const weekKey = formatWeekKey(commit.date);
    const weekStart = getWeekStart(commit.date);

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, {
        weekStart,
        commits: 0,
        additions: 0,
        deletions: 0,
      });
    }
    const weekData = weeklyMap.get(weekKey)!;
    weekData.commits++;
    weekData.additions += commit.additions;
    weekData.deletions += commit.deletions;

    const contributorKey = normalizeContributorKey(commit.email) || commit.author.toLowerCase();
    if (!contributorMap.has(contributorKey)) {
      contributorMap.set(contributorKey, {
        name: commit.author,
        email: commit.email,
        commits: 0,
        additions: 0,
        deletions: 0,
        weeklyMap: new Map(),
      });
    }
    const contributor = contributorMap.get(contributorKey)!;
    contributor.commits++;
    contributor.additions += commit.additions;
    contributor.deletions += commit.deletions;

    if (!contributor.weeklyMap.has(weekKey)) {
      contributor.weeklyMap.set(weekKey, {
        weekStart,
        commits: 0,
        additions: 0,
        deletions: 0,
      });
    }
    const contribWeek = contributor.weeklyMap.get(weekKey)!;
    contribWeek.commits++;
    contribWeek.additions += commit.additions;
    contribWeek.deletions += commit.deletions;
  }

  const weeklyData = Array.from(weeklyMap.values()).sort(
    (a, b) => a.weekStart.getTime() - b.weekStart.getTime()
  );

  const contributors: ContributorData[] = Array.from(contributorMap.values())
    .map((c) => ({
      name: c.name,
      email: c.email,
      commits: c.commits,
      additions: c.additions,
      deletions: c.deletions,
      weeklyCommits: Array.from(c.weeklyMap.values()).sort(
        (a, b) => a.weekStart.getTime() - b.weekStart.getTime()
      ),
    }))
    .sort((a, b) => b.commits - a.commits);

  return {
    totalCommits: commits.length,
    totalAdditions: commits.reduce((sum, c) => sum + c.additions, 0),
    totalDeletions: commits.reduce((sum, c) => sum + c.deletions, 0),
    weeklyData,
    contributors,
    dateRange,
  };
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function formatDate(date: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} '${String(date.getFullYear()).slice(-2)}`;
}
