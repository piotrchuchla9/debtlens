CREATE INDEX IF NOT EXISTS idx_job_runs_status
  ON job_runs(status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_job_runs_repo_status
  ON job_runs(repo_id, status);

CREATE INDEX IF NOT EXISTS idx_analysis_results_repo_created
  ON analysis_results(repo_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analysis_results_commit
  ON analysis_results(commit_sha);

CREATE INDEX IF NOT EXISTS idx_repositories_owner
  ON repositories(owner_user_id);

-- Timeout stuck running jobs via pg_cron (run every 5 minutes)
-- SELECT cron.schedule('timeout-stuck-jobs', '*/5 * * * *', $$
--   UPDATE job_runs
--   SET status = 'failed', error_message = 'Timeout: job ran for >5 minutes'
--   WHERE status = 'running'
--     AND started_at < NOW() - INTERVAL '5 minutes'
--     AND retry_count < 2;
--
--   UPDATE job_runs
--   SET status = 'dead', error_message = 'Max retries exceeded'
--   WHERE status = 'failed'
--     AND retry_count >= 2;
-- $$);
