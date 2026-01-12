import { createSimpleContext } from "./helper";
import type { GitStats } from "../git";
import type { PeriodFilter, SortBy } from "../components/Sidebar";

export interface AppState {
  stats: GitStats | null;
  loading: boolean;
  error: string | null;
  period: PeriodFilter;
  sortBy: SortBy;
  sidebarFocused: boolean;
  sidebarIndex: number;
  repoPath: string;
}

export interface AppActions {
  setPeriod: (period: PeriodFilter) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSidebarFocused: (focused: boolean) => void;
  setSidebarIndex: (index: number) => void;
  toggleSidebar: () => void;
}

export interface AppContext {
  state: AppState;
  actions: AppActions;
}

export const AppContext = createSimpleContext<AppContext>("App");
