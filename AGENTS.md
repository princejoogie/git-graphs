# AGENTS.md — git-graphs

This document is written for LLM agents working in this repository. It describes what the project is, how it is structured, how to run it, and how to extend it safely.

## Project Overview

**git-graphs** is a terminal UI (TUI) that renders GitHub-style contribution-style graphs and contributor summaries for a local git repository.

Core behaviors:
- Runs `git log` to extract commit history and file change stats.
- Aggregates into weekly buckets.
- Deduplicates contributors (including GitHub `users.noreply.github.com` patterns).
- Renders:
  - A top header (repo path + totals)
  - A left sidebar (period + sort controls)
  - A main “Commits over time” bar chart
  - Contributor cards in a responsive multi-column grid
- Supports keyboard navigation (vim + arrows).

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript (strict)
- **UI**: React 19 rendered in terminal via **OpenTUI**
  - `@opentui/core`
  - `@opentui/react`
- **Data Source**: local `git` CLI (via Bun’s `$`)

## Repository Layout

Project root (this file lives here):

```
.gitignore
AGENTS.md
README.md
bun.lock
package.json
tsconfig.json
src/
  index.tsx
  git.ts
  components/
    index.ts
    Header.tsx
    Sidebar.tsx
    CommitsChart.tsx
    ContributorCard.tsx
    BarChart.tsx
  keybinds/
    index.ts
  theme/
    colors.ts
    index.ts
  context/
    app.tsx
    helper.ts
    index.ts
```

### Key Files

- `src/index.tsx`
  - App entrypoint.
  - Reads the repo path from CLI args.
  - Fetches git stats.
  - Applies filtering/sorting in `useMemo`.
  - Wires keyboard handling.
  - Renders the full UI tree.

- `src/git.ts`
  - Shells out to `git log --no-merges --format=... --numstat`.
  - Parses commit records.
  - Aggregates into:
    - `weeklyData: WeeklyData[]` (repo-wide)
    - `contributors: ContributorData[]` (per contributor)
    - `dateRange: {start,end}`

- `src/components/*`
  - UI components that render from precomputed props.

- `src/theme/colors.ts`
  - Centralized color palette.
  - Prefer adding tokens here over hardcoding colors.

- `src/keybinds/index.ts`
  - Keybind configuration + matcher.

- `src/context/*`
  - Context scaffolding exists but the app currently uses local `useState` in `src/index.tsx`.

## How to Run

### Install

```bash
bun install
```

### Typecheck

```bash
bun run typecheck
```

### Build

```bash
bun run build
```

Build output: `dist/ggtui`

### Run the TUI

From `git-graphs/`:

```bash
# Analyze current directory
bun run src/index.tsx

# Analyze a specific repo
bun run src/index.tsx /path/to/repo
```

Notes:
- The repo path is currently read from `process.argv[2]` in `src/index.tsx`.
- The target directory must be a valid git repository or you’ll see `exit code 128`.

## UX / Controls

Global:
- `q` or `Ctrl+C`: quit
- `Tab`: toggle focus between sidebar and main scroll area

Sidebar (when focused):
- `↑/↓` or `k/j`: move selection
- `Enter` or `Space`: apply selection

## OpenTUI Basics (Important for Agents)

This project uses OpenTUI’s React renderer. The primitives you’ll interact with most:

- `<box>`: layout container (flexbox-like)
- `<text>`: styled text output
- `<scrollbox>`: scrollable container

Key docs (upstream):
- OpenTUI monorepo: https://github.com/anomalyco/opentui
- `@opentui/react` README: https://github.com/anomalyco/opentui/tree/main/packages/react
- `@opentui/core` README: https://github.com/anomalyco/opentui/tree/main/packages/core

Common gotchas:
- **Wrapping**: `<text>` supports `wrapMode` (`"word"` default, `"char"`, `"none"`). If you need fixed-height UI regions, you typically must (a) disable wrapping and (b) enforce layout widths / truncate strings yourself.
- **Border/padding sizing**: if you do manual width math, remember borders and padding reduce available content width.

## Data Model (Types)

Defined in `src/git.ts`:

- `CommitData`
  - `hash`, `author`, `email`, `date`, `additions`, `deletions`

- `WeeklyData`
  - `weekStart: Date` (week bucket start)
  - `commits`, `additions`, `deletions`

- `ContributorData`
  - `name`, `email`
  - totals: `commits`, `additions`, `deletions`
  - `weeklyCommits: WeeklyData[]`

- `GitStats`
  - repo totals + weeklyData + contributors
  - `dateRange: { start: Date; end: Date }`

### Contributor Deduplication

`normalizeContributorKey(email)` in `src/git.ts` groups GitHub noreply addresses like:
- `12345+foo@users.noreply.github.com` → `github:12345`

Otherwise it uses normalized email.

## Architecture / Data Flow

High level:

1. **CLI arg** → `repoPath` (`src/index.tsx`)
2. **Fetch** → `getGitStats(repoPath)` (`src/git.ts`)
3. **Transform (in-memory)** → `useMemo` in `src/index.tsx`
   - period filter (`filterByPeriod`)
   - sort (`sortBy`)
   - padding for chart continuity (for `all` period)
4. **Render** via OpenTUI React
   - `<Header />`
   - `<Sidebar />`
   - `<CommitsChart />`
   - `<ContributorCard />` (grid)

Performance note:
- The heavy aggregation work is in `git.ts` and `useMemo`. Keep rendering components dumb and driven by props.

## Where to Add Things

### Add a New Period Filter

Files involved:
- `src/components/Sidebar.tsx`
  - Extend `PeriodFilter` union.
  - Add option in `PERIOD_OPTIONS`.
  - Ensure `TOTAL_SIDEBAR_OPTIONS` stays correct.
- `src/index.tsx`
  - Update `filterByPeriod` switch.
  - Update key handling that maps sidebar index → period list:
    - `const periods: PeriodFilter[] = ["all", "year", "month", "week"]`

Agent checklist:
- If you change the number/order of sidebar options, verify keyboard selection indexes still map correctly.

### Add a New Sort Mode

Files involved:
- `src/components/Sidebar.tsx`
  - Extend `SortBy` union.
  - Add option in `SORT_OPTIONS`.
- `src/index.tsx`
  - Update the sort comparator in the `useMemo`.
  - Update keyboard selection mapping for sorts:
    - `const sorts: SortBy[] = ["commits", "additions", "deletions"]`

### Add a New Chart / Visualization

Recommended pattern:
- Add a component in `src/components/`.
- Export it from `src/components/index.ts`.
- Keep chart components pure (derive everything from props).
- Reuse `BarChart`/`MiniBarChart` if possible.

### Add CLI Flags

Current state:
- Only supports a positional repo path (`process.argv[2]`).

Where to extend:
- `src/index.tsx` is the CLI boundary.
- Prefer a minimal approach first (manual parsing) to avoid extra dependencies.
- If you introduce a parser library, update `package.json` and keep it small.

### Add / Change Theme

- Update `src/theme/colors.ts`.
- Prefer semantic tokens (e.g., `colors.text.muted`) over new one-off literals.

### Move State into Context (Optional Refactor)

Context types exist in `src/context/app.tsx`, but are not wired.
- If you migrate, do it incrementally: define provider, wrap App, then convert components.
- Avoid refactors during bugfix work.

## Troubleshooting

### “Failed with exit code 128”

- The provided repo path isn’t a git repo, or git cannot access it.
- Try:
  - `git -C /path/to/repo status`

### Header/Layout Weirdness

If a UI region “grows” or text overlaps:
- Disable wrapping for problematic `<text>` nodes with `wrapMode="none"`.
- Truncate strings yourself based on the available width.
- Remember: borders + padding reduce usable content width.

### Performance

`git log --numstat` can be slow on huge repos.
- Avoid additional git invocations in render.
- Keep transformations inside `useMemo`.

## Release Management

This project uses **Changesets** for automated versioning and releases.

### Release Workflow

1. **Feature development**: When working on a feature that should be released:
   ```bash
   bun run changeset
   ```
   This creates a changeset file describing your changes.

2. **Merge to main**: When PRs with changesets are merged, GitHub Actions automatically:
   - Opens/updates a "Version Packages" PR
   - Aggregates all pending changesets

3. **Release**: When the "Version Packages" PR is merged:
   - `package.json` version is bumped
   - `CHANGELOG.md` is updated
   - Git tag is created (`v0.0.2`, `v0.1.0`, etc.)
   - GitHub Release is created with multi-platform binaries

### Available Commands

- `bun run changeset` — Create a new changeset
- `bun run changeset:version` — Apply changesets (bump version + update changelog)
- `bun run changeset:tag` — Create git tags for new versions
- `bun run release` — Full release pipeline (typecheck + build + tag)

### Build Artifacts

Releases include binaries for:
- macOS: ARM64 and x64
- Linux: x64 and ARM64

Each release includes a `SHA256SUMS` file for verification.

### Configuration

- `.changeset/config.json` — Changesets configuration
- `.github/workflows/release.yml` — Automated release workflow
- `privatePackages.tag: true` — Enables tagging for this private package

## Agent Operating Guidelines (Project-Specific)

- **Do not commit** unless the user explicitly requests it.
- Prefer **small, minimal diffs**; avoid refactors mixed with bugfixes.
- Keep TS strictness intact:
  - No `as any`, no `@ts-ignore`, no `@ts-expect-error`.
- After code edits:
  - Run `lsp_diagnostics` on changed files.
  - Manually run the TUI for a quick sanity check.
- **Changesets**: When implementing features, remind the user to create a changeset if the change warrants a release.

## References

- OpenTUI:
  - https://github.com/anomalyco/opentui
  - `@opentui/react`: https://github.com/anomalyco/opentui/tree/main/packages/react
  - `@opentui/core`: https://github.com/anomalyco/opentui/tree/main/packages/core
- create-tui (project generator): https://git.new/create-tui
- Bun:
  - https://bun.sh/docs
- Git `log`:
  - https://git-scm.com/docs/git-log
