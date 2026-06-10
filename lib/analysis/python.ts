import { readFile, readdir } from 'fs/promises';
import { join, relative } from 'path';
import { ExportEntry } from '@/types';

export interface PythonAnalysisResult {
  unusedDeps: string[];
  unusedExports: ExportEntry[];
  unusedFiles: string[];
}

const IGNORE_DIRS = new Set(['__pycache__', '.git', 'venv', 'env', '.venv', '.tox', 'node_modules', 'dist', 'build', '.mypy_cache', '.pytest_cache']);

async function findPyFiles(dir: string, result: string[] = []): Promise<string[]> {
  if (result.length >= 300) return result;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return result;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
        await findPyFiles(join(dir, entry.name), result);
      }
    } else if (entry.isFile() && entry.name.endsWith('.py')) {
      result.push(join(dir, entry.name));
    }
  }
  return result;
}

function extractImports(source: string): Set<string> {
  const imports = new Set<string>();
  for (const m of source.matchAll(/^import\s+([\w.]+)/gm)) {
    imports.add(m[1].split('.')[0].toLowerCase());
  }
  for (const m of source.matchAll(/^from\s+([\w.]+)\s+import/gm)) {
    imports.add(m[1].split('.')[0].toLowerCase());
  }
  return imports;
}

function extractTopLevelDefs(source: string): Array<{ name: string; line: number; type: string }> {
  const defs: Array<{ name: string; line: number; type: string }> = [];
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fnMatch = line.match(/^def\s+([A-Za-z][A-Za-z0-9_]*)\s*\(/);
    if (fnMatch) defs.push({ name: fnMatch[1], line: i + 1, type: 'function' });
    const clsMatch = line.match(/^class\s+([A-Za-z][A-Za-z0-9_]*)\s*[:(]/);
    if (clsMatch) defs.push({ name: clsMatch[1], line: i + 1, type: 'class' });
  }
  return defs;
}

async function parseRequirements(root: string): Promise<Set<string>> {
  const reqs = new Set<string>();
  for (const fname of ['requirements.txt', 'requirements-dev.txt', 'requirements/base.txt']) {
    try {
      const content = await readFile(join(root, fname), 'utf-8');
      for (const raw of content.split('\n')) {
        const line = raw.trim();
        if (!line || line.startsWith('#') || line.startsWith('-') || line.startsWith('http')) continue;
        const pkg = line.split(/[>=<!;\s[]/)[0].trim().toLowerCase().replace(/-/g, '_');
        if (pkg) reqs.add(pkg);
      }
    } catch {}
  }
  return reqs;
}

export async function analyzePython(workDir: string): Promise<PythonAnalysisResult> {
  const pyFiles = await findPyFiles(workDir);

  const allImports = new Set<string>();
  const fileDefs = new Map<string, Array<{ name: string; line: number; type: string }>>();
  const sources: string[] = [];

  for (const filepath of pyFiles) {
    try {
      const source = await readFile(filepath, 'utf-8');
      sources.push(source);
      for (const imp of extractImports(source)) allImports.add(imp);
      const defs = extractTopLevelDefs(source);
      if (defs.length > 0) fileDefs.set(filepath, defs);
    } catch {}
  }

  const fullText = sources.join('\n');

  const reqs = await parseRequirements(workDir);
  const unusedDeps = [...reqs].filter(r => !allImports.has(r) && !allImports.has(r.replace(/_/g, '-')));

  const unusedExports: ExportEntry[] = [];
  let fileCount = 0;
  for (const [filepath, defs] of fileDefs) {
    if (fileCount++ >= 50) break;
    const rel = relative(workDir, filepath);
    for (const def of defs) {
      const escaped = def.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const count = (fullText.match(new RegExp(`\\b${escaped}\\b`, 'g')) ?? []).length;
      if (count <= 1) {
        unusedExports.push({ name: def.name, file: rel, type: def.type, line: def.line });
      }
    }
  }

  return {
    unusedDeps: unusedDeps.slice(0, 30),
    unusedExports: unusedExports.slice(0, 50),
    unusedFiles: [],
  };
}
