CREATE POLICY "Users can insert job runs for own repos"
ON job_runs FOR INSERT
WITH CHECK (
  repo_id IN (
    SELECT id FROM repositories WHERE owner_user_id = auth.uid()
  )
);
