import { spawn } from 'child_process';
import { writeFile, access } from 'fs/promises';
import { join } from 'path';
import { KnipOutput } from '@/types';

const DEFAULT_KNIP_CONFIG = `export default {
  ignore: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'],
  ignoreDependencies: ['typescript', 'eslint', 'prettier'],
  ignoreExportsUsedInFile: true
};
`;

export async function runKnip(
  workDir: string,
  configOverride?: Record<string, unknown> | null
): Promise<{ output: KnipOutput; version: string }> {
  const configPath = join(workDir, 'knip.config.ts');

  try {
    await access(configPath);
  } catch {
    const configContent = configOverride
      ? `export default ${JSON.stringify(configOverride, null, 2)};\n`
      : DEFAULT_KNIP_CONFIG;
    await writeFile(configPath, configContent, 'utf-8');
  }

  const output = await new Promise<string>((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const proc = spawn(
      'npx',
      ['knip@5', '--reporter', 'json', '--no-exit-code'],
      {
        cwd: workDir,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          HOME: '/tmp',
          npm_config_cache: '/tmp/.npm',
        },
      }
    );

    proc.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
    proc.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));

    proc.on('close', (code) => {
      if (stdout.trim()) {
        resolve(stdout);
      } else {
        reject(new Error(`Knip produced no output. Exit code: ${code}. Stderr: ${stderr.slice(0, 500)}`));
      }
    });

    proc.on('error', reject);
  });

  const parsed: KnipOutput = JSON.parse(output);

  const versionOutput = await new Promise<string>((resolve) => {
    let out = '';
    const proc = spawn('npx', ['knip@5', '--version'], {
      cwd: workDir,
      env: { ...process.env, HOME: '/tmp', npm_config_cache: '/tmp/.npm' },
    });
    proc.stdout.on('data', (c: Buffer) => (out += c.toString()));
    proc.on('close', () => resolve(out.trim()));
    proc.on('error', () => resolve('5.x'));
  });

  return { output: parsed, version: versionOutput };
}
