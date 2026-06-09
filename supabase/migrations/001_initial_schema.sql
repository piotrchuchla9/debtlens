-- User profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username TEXT NOT NULL DEFAULT '',
  github_id BIGINT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_org_id BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  installation_id BIGINT NOT NULL UNIQUE,
  owner_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Repositories
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_repo_id BIGINT NOT NULL UNIQUE,
  owner_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  default_branch TEXT NOT NULL DEFAULT 'main',
  is_active BOOLEAN NOT NULL DEFAULT true,
  knip_config_override JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Job runs
CREATE TABLE IF NOT EXISTS job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  commit_sha TEXT NOT NULL,
  commit_message TEXT NOT NULL DEFAULT '',
  branch TEXT NOT NULL,
  pr_number INT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'dead')),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0
);

-- Analysis results
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_run_id UUID NOT NULL UNIQUE REFERENCES job_runs(id) ON DELETE CASCADE,
  repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  commit_sha TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unused_files_count INT NOT NULL DEFAULT 0,
  unused_exports_count INT NOT NULL DEFAULT 0,
  unused_deps_count INT NOT NULL DEFAULT 0,
  total_dead_code INT GENERATED ALWAYS AS (unused_files_count + unused_exports_count + unused_deps_count) STORED,
  unused_files_list JSONB NOT NULL DEFAULT '[]',
  unused_exports_list JSONB NOT NULL DEFAULT '[]',
  unused_deps_list JSONB NOT NULL DEFAULT '[]',
  knip_version TEXT NOT NULL DEFAULT '5.x',
  raw_output_url TEXT
);

-- Alert configs
CREATE TABLE IF NOT EXISTS alert_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL UNIQUE REFERENCES repositories(id) ON DELETE CASCADE,
  threshold_pct INT NOT NULL DEFAULT 5,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  slack_webhook_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create user_profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, github_username, github_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_name', ''),
    (NEW.raw_user_meta_data->>'provider_id')::BIGINT
  )
  ON CONFLICT (id) DO UPDATE SET
    github_username = COALESCE(EXCLUDED.github_username, user_profiles.github_username),
    github_id = COALESCE(EXCLUDED.github_id, user_profiles.github_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
