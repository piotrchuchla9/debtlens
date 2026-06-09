import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { KnipOutput } from '@/types';

const EMPTY_KNIP_OUTPUT: KnipOutput = { files: [], exports: [], types: [], dependencies: [], devDependencies: [] };

const DEFAULT_KNIP_CONFIG = JSON.stringify({
  ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'],
  ignoreDependencies: ['typescript', 'eslint', 'prettier'],
  ignoreExportsUsedInFile: true,
}, null, 2);

const SPAWN_ENV: NodeJS.ProcessEnv = {
  ...process.env,
  HOME: '/tmp',
  npm_config_cache: '/tmp/.npm',
};

export async function runKnip(
  workDir: string,
  configOverride?: Record<string, unknown> | null
): Promise<{ output: KnipOutput; version: string }> {
  // Remove TS/JS knip configs that require a loader — we'll use knip.json
  const tsConfigs = ['knip.ts', 'knip.js', 'knip.config.ts', 'knip.config.js', '.knip.ts', '.knip.js'];
  await Promise.all(tsConfigs.map(f => unlink(join(workDir, f)).catch(() => {})));

  const configContent = configOverride ? JSON.stringify(configOverride, null, 2) : DEFAULT_KNIP_CONFIG;
  await writeFile(join(workDir, 'knip.json'), configContent, 'utf-8');

  const stdout = await runProcess(
    'npx', ['knip@5', '--config', 'knip.json', '--reporter', 'json', '--no-exit-code'],
    workDir
  );

  const jsonStart = stdout.search(/[[{]/);
  const output: KnipOutput = jsonStart !== -1
    ? JSON.parse(stdout.slice(jsonStart))
    : EMPTY_KNIP_OUTPUT;

  const version = await runProcess('npx', ['knip@5', '--version'], workDir)
    .then(v => v.trim())
    .catch(() => '5.x');

  return { output, version };
}

function runProcess(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const proc = spawn(cmd, args, { cwd, env: SPAWN_ENV });
    proc.stdout.on('data', (c: Buffer) => (stdout += c.toString()));
    proc.stderr.on('data', (c: Buffer) => (stderr += c.toString()));
    proc.on('close', (code) => {
      if (stdout.trim()) resolve(stdout);
      else reject(new Error(`Exit ${code}. Stderr: ${stderr.slice(0, 400)}`));
    });
    proc.on('error', reject);
  });
}
