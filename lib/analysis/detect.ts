import { access, readdir } from 'fs/promises';
import { join } from 'path';

export interface DetectedLanguages {
  js: boolean;
  python: boolean;
  go: boolean;
}

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

async function hasFilesWithExtension(dir: string, ext: string): Promise<boolean> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith(ext)) return true;
    }
  } catch {}
  return false;
}

export async function detectLanguages(workDir: string): Promise<DetectedLanguages> {
  const [hasPackageJson, hasGoMod, hasReqTxt, hasPyproject, hasSetupPy, hasPipfile] =
    await Promise.all([
      exists(join(workDir, 'package.json')),
      exists(join(workDir, 'go.mod')),
      exists(join(workDir, 'requirements.txt')),
      exists(join(workDir, 'pyproject.toml')),
      exists(join(workDir, 'setup.py')),
      exists(join(workDir, 'Pipfile')),
    ]);

  let python = hasReqTxt || hasPyproject || hasSetupPy || hasPipfile;
  if (!python) python = await hasFilesWithExtension(workDir, '.py');

  return { js: hasPackageJson, python, go: hasGoMod };
}
