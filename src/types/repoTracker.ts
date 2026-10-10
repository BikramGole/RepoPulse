export interface RepoOwner {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
}

export interface RepoOverview {
  name: string;
  fullName: string;
  owner: RepoOwner;
  description: string | null;
  htmlUrl: string;
  stars: number;
  forks: number;
  openIssuesCount: number;
  watchers: number;
  language: string | null;
  topics: string[];
  license: string | null;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  homepage: string | null;
}

export interface ContributorStat {
  login: string;
  avatarUrl: string;
  contributions: number;
  htmlUrl: string;
  isBot: boolean;
}

export interface RepoPR {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed" | "merged";
  user: {
    login: string;
    avatarUrl: string;
  };
  createdAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  htmlUrl: string;
  isBot: boolean;
}

export interface RepoIssue {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  user: {
    login: string;
    avatarUrl: string;
  };
  createdAt: string;
  closedAt: string | null;
  htmlUrl: string;
  isBot: boolean;
}

export interface DayDataPoint {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "11", "12", "Oct 1"
  count: number;
}

export interface AgeBucket {
  key: string;
  label: string;
  count: number;
  percent: number;
  color: string;
}

export interface LifetimeBucket {
  key: string;
  label: string;
  count: number;
  color: string;
}

export interface RepoInsightData {
  overview: RepoOverview;
  contributors: ContributorStat[];
  dailyOpenedPRs: DayDataPoint[];
  latestPRs: RepoPR[];
  openIssuesTimeline: DayDataPoint[];
  openIssueAge: AgeBucket[];
  issueLifetime: LifetimeBucket[];
  latestIssues: RepoIssue[];
  metrics: {
    totalContributions: number;
    totalPRs30d: number;
    mergedPRs30d: number;
    closedPRs30d: number;
    openPRs30d: number;
    totalIssues30d: number;
    closedIssues30d: number;
    openIssues30d: number;
    avgLifetimeDays: number | null;
  };
  updatedAt: string;
}
