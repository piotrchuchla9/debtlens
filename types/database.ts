export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          github_username: string;
          github_id: number;
          plan: 'free' | 'pro';
          stripe_customer_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
      organizations: {
        Row: {
          id: string;
          github_org_id: number;
          name: string;
          installation_id: number;
          owner_user_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      repositories: {
        Row: {
          id: string;
          github_repo_id: number;
          owner_user_id: string;
          org_id: string | null;
          full_name: string;
          default_branch: string;
          is_active: boolean;
          knip_config_override: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['repositories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['repositories']['Insert']>;
      };
      job_runs: {
        Row: {
          id: string;
          repo_id: string;
          commit_sha: string;
          commit_message: string;
          branch: string;
          pr_number: number | null;
          status: 'pending' | 'running' | 'completed' | 'failed' | 'dead';
          triggered_at: string;
          started_at: string | null;
          completed_at: string | null;
          duration_ms: number | null;
          error_message: string | null;
          retry_count: number;
        };
        Insert: Omit<Database['public']['Tables']['job_runs']['Row'], 'id' | 'triggered_at' | 'retry_count'>;
        Update: Partial<Database['public']['Tables']['job_runs']['Insert']>;
      };
      analysis_results: {
        Row: {
          id: string;
          job_run_id: string;
          repo_id: string;
          commit_sha: string;
          created_at: string;
          unused_files_count: number;
          unused_exports_count: number;
          unused_deps_count: number;
          total_dead_code: number;
          unused_files_list: Json;
          unused_exports_list: Json;
          unused_deps_list: Json;
          knip_version: string;
          raw_output_url: string | null;
        };
        Insert: Omit<Database['public']['Tables']['analysis_results']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['analysis_results']['Insert']>;
      };
      alert_configs: {
        Row: {
          id: string;
          repo_id: string;
          threshold_pct: number;
          email_enabled: boolean;
          slack_webhook_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['alert_configs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['alert_configs']['Insert']>;
      };
    };
  };
}
