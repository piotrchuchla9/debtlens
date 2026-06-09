-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_configs ENABLE ROW LEVEL SECURITY;

-- user_profiles
CREATE POLICY "Users see own profile" ON user_profiles
  FOR ALL USING (id = auth.uid());

-- organizations
CREATE POLICY "Users see own orgs" ON organizations
  FOR ALL USING (owner_user_id = auth.uid());

-- repositories
CREATE POLICY "Users see own repos" ON repositories
  FOR ALL USING (owner_user_id = auth.uid());

-- job_runs
CREATE POLICY "Users see own job runs" ON job_runs
  FOR SELECT USING (
    repo_id IN (
      SELECT id FROM repositories WHERE owner_user_id = auth.uid()
    )
  );

-- analysis_results
CREATE POLICY "Users see own analysis results" ON analysis_results
  FOR SELECT USING (
    repo_id IN (
      SELECT id FROM repositories WHERE owner_user_id = auth.uid()
    )
  );

-- alert_configs
CREATE POLICY "Users manage own alert configs" ON alert_configs
  FOR ALL USING (
    repo_id IN (
      SELECT id FROM repositories WHERE owner_user_id = auth.uid()
    )
  );
