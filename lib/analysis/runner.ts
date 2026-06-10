import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { KnipOutput } from '@/types';
import { detectLanguages } from './detect';
import { analyzePython } from './python';
import { analyzeGo } from './golang';

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

export async function runAnalysis(
  workDir: string,
  configOverride?: Record<string, unknown> | null
): Promise<{ output: KnipOutput; version: string; languages: string[] }> {
  const langs = await detectLanguages(workDir);
  const languages: string[] = [];
  let merged: KnipOutput = { ...EMPTY_KNIP_OUTPUT };
  let version = 'multi';

  const tasks: Promise<void>[] = [];

  if (langs.js) {
    languages.push('js');
    tasks.push(
      runKnip(workDir, configOverride).then(({ output, version: v }) => {
        version = v;
        merged = mergeKnip(merged, output);
      }).catch(() => {})
    );
  }

  if (langs.python) {
    languages.push('python');
    tasks.push(
      analyzePython(workDir).then(result => {
        merged.dependencies = [
          ...merged.dependencies,
          ...result.unusedDeps.map(name => ({ name, package: name })),
        ];
        merged.exports = [
          ...merged.exports,
          ...result.unusedExports.map(e => ({ name: e.name, file: e.file, type: e.type })),
        ];
        merged.files = [...merged.files, ...result.unusedFiles];
      }).catch(() => {})
    );
  }

  if (langs.go) {
    languages.push('go');
    tasks.push(
      analyzeGo(workDir).then(result => {
        merged.dependencies = [
          ...merged.dependencies,
          ...result.unusedDeps.map(name => ({ name, package: name })),
        ];
        merged.exports = [
          ...merged.exports,
          ...result.unusedExports.map(e => ({ name: e.name, file: e.file, type: e.type })),
        ];
        merged.files = [...merged.files, ...result.unusedFiles];
      }).catch(() => {})
    );
  }

  // Fallback: treat as JS if nothing detected
  if (languages.length === 0) {
    languages.push('js');
    const { output, version: v } = await runKnip(workDir, configOverride).catch(() => ({ output: EMPTY_KNIP_OUTPUT, version: '5.x' }));
    merged = output;
    version = v;
  } else {
    await Promise.all(tasks);
  }

  if (languages.length > 1) version = `multi (${languages.join('+')})`;

  return { output: merged, version, languages };
}

// Keep runKnip exported for backwards compat
export async function runKnip(
  workDir: string,
  configOverride?: Record<string, unknown> | null
): Promise<{ output: KnipOutput; version: string }> {
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

function mergeKnip(a: KnipOutput, b: KnipOutput): KnipOutput {
  return {
    files: [...(a.files ?? []), ...(b.files ?? [])],
    exports: [...(a.exports ?? []), ...(b.exports ?? [])],
    types: [...(a.types ?? []), ...(b.types ?? [])],
    dependencies: [...(a.dependencies ?? []), ...(b.dependencies ?? [])],
    devDependencies: [...(a.devDependencies ?? []), ...(b.devDependencies ?? [])],
  };
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
