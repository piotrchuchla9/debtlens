export interface UserProfile {
  id: string;
  github_username: string;
  github_id: number;
  plan: 'free' | 'pro';
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Organization {
  id: string;
  github_org_id: number;
  name: string;
  installation_id: number;
  owner_user_id: string;
  created_at: string;
}

export interface Repository {
  id: string;
  github_repo_id: number;
  owner_user_id: string;
  org_id: string | null;
  full_name: string;
  default_branch: string;
  is_active: boolean;
  knip_config_override: Record<string, unknown> | null;
  scan_branch: string | null;
  created_at: string;
}

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'dead';

export interface JobRun {
  id: string;
  repo_id: string;
  commit_sha: string;
  commit_message: string;
  branch: string;
  pr_number: number | null;
  status: JobStatus;
  triggered_at: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  retry_count: number;
}

export interface AnalysisResult {
  id: string;
  job_run_id: string;
  repo_id: string;
  commit_sha: string;
  created_at: string;
  unused_files_count: number;
  unused_exports_count: number;
  unused_deps_count: number;
  total_dead_code: number;
  unused_files_list: FileEntry[];
  unused_exports_list: ExportEntry[];
  unused_deps_list: string[];
  knip_version: string;
  raw_output_url: string | null;
}

export interface FileEntry {
  file: string;
  exportCount?: number;
}

export interface ExportEntry {
  name: string;
  file: string;
  type: string;
}

export interface AlertConfig {
  id: string;
  repo_id: string;
  threshold_pct: number;
  email_enabled: boolean;
  slack_webhook_url: string | null;
  created_at: string;
}

export interface TrendPoint {
  date: string;
  sha: string;
  total: number;
  files: number;
  exports: number;
  deps: number;
  delta: number | null;
}

export interface CommitSummary {
  sha: string;
  message: string;
  date: string;
  total: number;
  delta: number | null;
  status: JobStatus;
}

export interface FileBreakdown {
  file: string;
  unusedExports: number;
}

export interface ExportBreakdown {
  name: string;
  file: string;
  type: string;
}

export interface KnipOutput {
  files: string[];
  exports: { name: string; file: string; type: string }[];
  types: { name: string; file: string }[];
  dependencies: { name: string; package: string }[];
  devDependencies: { name: string; package: string }[];
}

export interface RepositoryWithLatestAnalysis extends Repository {
  latest_analysis?: AnalysisResult | null;
  latest_job?: JobRun | null;
}
