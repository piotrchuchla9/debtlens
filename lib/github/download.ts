import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import * as tar from 'tar';

const MAX_REPO_SIZE_MB = 400;

export async function checkRepoSize(
  octokit: Awaited<ReturnType<typeof import('./app').getInstallationOctokit>>,
  owner: string,
  repo: string
): Promise<void> {
  const { data } = await octokit.repos.get({ owner, repo });
  const sizeMB = (data.size ?? 0) / 1024;
  if (sizeMB > MAX_REPO_SIZE_MB) {
    throw new Error(`Repository is ${sizeMB.toFixed(0)} MB — exceeds ${MAX_REPO_SIZE_MB} MB limit`);
  }
}

export async function downloadAndExtractRepo(
  octokit: Awaited<ReturnType<typeof import('./app').getInstallationOctokit>>,
  owner: string,
  repo: string,
  sha: string,
  jobRunId: string
): Promise<string> {
  const workDir = `/tmp/${jobRunId}`;
  const tarPath = `${workDir}.tar.gz`;

  await mkdir(workDir, { recursive: true });

  const response = await octokit.repos.downloadTarballArchive({
    owner,
    repo,
    ref: sha,
  });

  const arrayBuffer = response.data as ArrayBuffer;
  const buffer = Buffer.from(arrayBuffer);
  await import('fs/promises').then(fs => fs.writeFile(tarPath, buffer));

  await tar.extract({ file: tarPath, cwd: workDir, strip: 1 });

  await import('fs/promises').then(fs => fs.unlink(tarPath));

  return workDir;
}

export async function cleanupWorkDir(jobRunId: string): Promise<void> {
  const workDir = `/tmp/${jobRunId}`;
  await rm(workDir, { recursive: true, force: true });
}
