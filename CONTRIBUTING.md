# Contributing

Thanks for your interest in contributing to **git-graphs**.

This project is a Bun + TypeScript (strict) terminal UI (TUI) built with OpenTUI + React. It shells out to the local `git` CLI to compute stats.

## Quick start

### Requirements

- **Bun**: https://bun.sh
- **git** in your PATH

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

## Running locally

From the repo root:

```bash
# Analyze current directory
bun run src/index.tsx

# Analyze a specific repo
bun run src/index.tsx /path/to/repo
```

### Watch mode (development)

This repo includes a watch script:

```bash
bun run dev /path/to/repo
```

## Making changes

### Project structure

- `src/index.tsx` — entrypoint, state, keyboard handling, layout
- `src/git.ts` — git parsing + aggregation
- `src/components/` — pure UI components driven by props
- `src/theme/` — theme tokens
- `src/keybinds/` — keybind config + matcher

Try to keep rendering components “dumb” and do heavy computation in `src/git.ts` or memoized transforms in `src/index.tsx`.

### Code style / expectations

- Keep diffs **small and focused** (avoid refactors mixed into bug fixes).
- TypeScript is **strict** — don’t silence errors with `as any`, `@ts-ignore`, or `@ts-expect-error`.
- Prefer extending existing patterns (e.g. filters/sort options live in `Sidebar.tsx` + mapping logic in `src/index.tsx`).
- Avoid adding dependencies unless there’s a clear need.

## Changesets (releases)

This project uses **Changesets** for release/version management.

If your change affects users (features, fixes, behavior changes), please add a changeset:

```bash
bun run changeset
```

Maintainers will handle the release flow via CI.

## Submitting a PR

Before opening a PR, please ensure:

- `bun run typecheck` passes
- `bun run build` succeeds
- Your PR description includes:
  - what changed
  - why it changed
  - how to test (example command + repo path)

## Reporting bugs

When filing an issue, include:

- OS + terminal emulator
- Bun version (`bun --version`)
- Repro steps (including repo size / rough commit count if relevant)
- The command you ran and the full error output

---

By contributing, you agree that your contributions will be licensed under the MIT License.
