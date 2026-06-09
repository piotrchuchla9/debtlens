import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async () => {
  try {
    // Claim oldest pending job
    const { data: job, error } = await supabase
      .from('job_runs')
      .select('*, repositories(*)')
      .eq('status', 'pending')
      .order('triggered_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !job) {
      return new Response(JSON.stringify({ message: 'No pending jobs' }), { status: 200 });
    }

    await supabase
      .from('job_runs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', job.id);

    // Trigger the analysis via Next.js API
    const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'http://localhost:3000';
    const response = await fetch(`${appUrl}/api/repos/${job.repo_id}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': Deno.env.get('INTERNAL_JOB_SECRET') ?? '',
      },
      body: JSON.stringify({ job_run_id: job.id }),
    });

    if (!response.ok) {
      throw new Error(`Analysis API returned ${response.status}`);
    }

    return new Response(JSON.stringify({ message: 'Job dispatched', job_id: job.id }), { status: 200 });
  } catch (err) {
    console.error('Job runner error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
