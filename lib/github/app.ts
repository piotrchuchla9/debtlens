import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

export function getAppOctokit() {
  const privateKey = Buffer.from(
    process.env.GITHUB_APP_PRIVATE_KEY!,
    'base64'
  ).toString('utf-8');

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey,
    },
  });
}

export async function getInstallationOctokit(installationId: number) {
  const privateKey = Buffer.from(
    process.env.GITHUB_APP_PRIVATE_KEY!,
    'base64'
  ).toString('utf-8');

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey,
      installationId,
    },
  });
}
