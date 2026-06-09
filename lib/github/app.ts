import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

function resolvePrivateKey(): string {
  const raw = process.env.GITHUB_APP_PRIVATE_KEY!;
  // Already a PEM key
  if (raw.trim().startsWith('-----')) return raw.trim();
  // Base64-encoded PEM
  return Buffer.from(raw.trim().replace(/%\s*$/, ''), 'base64').toString('utf-8');
}

export function getAppOctokit() {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey: resolvePrivateKey(),
    },
  });
}

export async function getInstallationOctokit(installationId: number) {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey: resolvePrivateKey(),
      installationId,
    },
  });
}
