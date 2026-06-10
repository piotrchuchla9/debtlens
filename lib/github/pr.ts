import { Octokit } from '@octokit/rest';

interface AnalysisCounts {
  total: number;
  files: number;
  exports: number;
  deps: number;
}

export async function postCommitStatus(
  octokit: Octokit,
  owner: string,
  repo: string,
  sha: string,
  current: AnalysisCounts,
  base: AnalysisCounts | null,
  dashboardUrl: string,
): Promise<void> {
  const diff = base ? current.total - base.total : null;
  const state: 'success' | 'failure' = diff !== null && diff > 0 ? 'failure' : 'success';
  const description =
    diff === null ? `Dead code: ${current.total} items`
    : diff > 0   ? `Dead code ↑ +${diff} (${current.total} total)`
    : diff < 0   ? `Dead code ↓ ${diff} (${current.total} total)`
    :              `No change in dead code (${current.total} total)`;

  await octokit.repos.createCommitStatus({
    owner,
    repo,
    sha,
    state,
    description: description.slice(0, 140),
    context: 'DebtLens / dead-code',
    target_url: dashboardUrl,
  });
}

export async function postPRComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  current: AnalysisCounts,
  base: AnalysisCounts | null,
  dashboardUrl: string,
): Promise<void> {
  const diff = base ? current.total - base.total : null;
  const headerEmoji = diff !== null && diff > 0 ? '⚠️' : '✅';

  const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);

  let body = `## ${headerEmoji} DebtLens Dead Code Report\n\n`;

  if (base && diff !== null) {
    body += `| Category | Base | This PR | Change |\n`;
    body += `|----------|------|---------|--------|\n`;
    body += `| **Total** | ${base.total} | **${current.total}** | **${fmt(diff)}** |\n`;
    body += `| Unused files | ${base.files} | ${current.files} | ${fmt(current.files - base.files)} |\n`;
    body += `| Unused exports | ${base.exports} | ${current.exports} | ${fmt(current.exports - base.exports)} |\n`;
    body += `| Unused deps | ${base.deps} | ${current.deps} | ${fmt(current.deps - base.deps)} |\n`;
  } else {
    body += `| Category | Count |\n`;
    body += `|----------|-------|\n`;
    body += `| **Total dead code** | **${current.total}** |\n`;
    body += `| Unused files | ${current.files} |\n`;
    body += `| Unused exports | ${current.exports} |\n`;
    body += `| Unused deps | ${current.deps} |\n`;
  }

  body += `\n[📊 View full dashboard](${dashboardUrl})`;
  body += `\n\n<sub>Powered by [DebtLens](https://www.debtlens.live) · Knip v5</sub>`;

  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
}

export async function postPendingStatus(
  octokit: Octokit,
  owner: string,
  repo: string,
  sha: string,
  dashboardUrl: string,
): Promise<void> {
  await octokit.repos.createCommitStatus({
    owner,
    repo,
    sha,
    state: 'pending',
    description: 'Scanning for dead code…',
    context: 'DebtLens / dead-code',
    target_url: dashboardUrl,
  });
}
