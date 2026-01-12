import { colors } from "../theme";
import { formatNumber } from "../git";

interface HeaderProps {
  repoPath: string;
  contributorCount: number;
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  terminalWidth: number;
}

function truncateEnd(text: string, maxWidth: number): string {
  if (maxWidth <= 0) return "";
  if (text.length <= maxWidth) return text;
  if (maxWidth === 1) return "…";
  return text.slice(0, maxWidth - 1) + "…";
}

function truncateStart(text: string, maxWidth: number): string {
  if (maxWidth <= 0) return "";
  if (text.length <= maxWidth) return text;
  if (maxWidth === 1) return "…";
  return "…" + text.slice(text.length - (maxWidth - 1));
}

export function Header({
  repoPath,
  contributorCount,
  totalCommits,
  totalAdditions,
  totalDeletions,
  terminalWidth,
}: HeaderProps) {
  const helpText = "q quit | Tab sidebar";
  const displayPath = repoPath === "." ? "current directory" : repoPath;

  const contentWidth = Math.max(0, terminalWidth - 4);

  const row1Prefix = "# git-graphs  |  ";
  const row1PathWidth = Math.max(0, contentWidth - row1Prefix.length - helpText.length);
  const truncatedPath = truncateStart(displayPath, row1PathWidth);

  const additionsStr = `${formatNumber(totalAdditions)}++`;
  const deletionsStr = `${formatNumber(totalDeletions)}--`;
  const statsSuffix = `${additionsStr} / ${deletionsStr}`;
  const statsPrefixRaw = `${contributorCount} contributors  -  ${formatNumber(totalCommits)} commits  -  `;
  const statsPrefixWidth = Math.max(0, contentWidth - statsSuffix.length);
  const statsPrefix = truncateEnd(statsPrefixRaw, statsPrefixWidth);

  const leftRowWidth = Math.max(0, contentWidth - helpText.length);

  return (
    <box
      flexDirection="column"
      padding={1}
      height={6}
      backgroundColor={colors.background.secondary}
      borderColor={colors.border.default}
    >
      <box flexDirection="row" width="100%" height={1} justifyContent="space-between">
        <box flexDirection="row" width={leftRowWidth}>
          <text fg={colors.accent.blue} content="# " wrapMode="none" />
          <text fg={colors.text.primary} content="git-graphs" wrapMode="none" />
          <text fg={colors.text.muted} content="  |  " wrapMode="none" />
          <text fg={colors.text.secondary} content={truncatedPath} wrapMode="none" />
        </box>
        <text fg={colors.text.muted} content={helpText} wrapMode="none" />
      </box>

      <box flexDirection="row" width="100%" height={1}>
        <text fg={colors.text.secondary} content={statsPrefix} wrapMode="none" />
        <text fg={colors.accent.green} content={`${additionsStr} `} wrapMode="none" />
        <text fg={colors.text.muted} content="/ " wrapMode="none" />
        <text fg={colors.accent.red} content={deletionsStr} wrapMode="none" />
      </box>
    </box>
  );
}
