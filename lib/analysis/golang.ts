import { readFile, readdir } from 'fs/promises';
import { join, relative } from 'path';
import { ExportEntry } from '@/types';

export interface GoAnalysisResult {
  unusedDeps: string[];
  unusedExports: ExportEntry[];
  unusedFiles: string[];
}

async function findGoFiles(dir: string, root: string, acc: string[] = []): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === 'vendor' || e.name.startsWith('.') || e.name === 'node_modules') continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) await findGoFiles(full, root, acc);
      else if (e.isFile() && e.name.endsWith('.go') && !e.name.endsWith('_test.go')) acc.push(full);
    }
  } catch {}
  return acc;
}

function parseGoMod(content: string): string[] {
  const deps: string[] = [];
  let inRequire = false;
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('require (')) { inRequire = true; continue; }
    if (inRequire && trimmed === ')') { inRequire = false; continue; }
    if (inRequire || trimmed.startsWith('require ')) {
      const part = trimmed.replace(/^require\s+/, '').trim();
      const match = part.match(/^([^\s]+)/);
      if (match && !match[1].startsWith('//')) deps.push(match[1]);
    }
  }
  return deps;
}

function parseGoImports(content: string): string[] {
  const imports: string[] = [];
  // single import
  const single = content.match(/^import\s+"([^"]+)"/m);
  if (single) imports.push(single[1]);
  // import block
  const blockMatch = content.match(/import\s*\(([\s\S]*?)\)/);
  if (blockMatch) {
    for (const line of blockMatch[1].split('\n')) {
      const m = line.match(/"([^"]+)"/);
      if (m) imports.push(m[1]);
    }
  }
  return imports;
}

function parseGoExports(content: string, relPath: string): ExportEntry[] {
  const exports: ExportEntry[] = [];
  const funcRegex = /^func\s+([A-Z][a-zA-Z0-9_]*)\s*[\[(]/gm;
  const typeRegex = /^type\s+([A-Z][a-zA-Z0-9_]*)\s+/gm;
  let m;
  while ((m = funcRegex.exec(content)) !== null) exports.push({ name: m[1], file: relPath, type: 'function' });
  while ((m = typeRegex.exec(content)) !== null) exports.push({ name: m[1], file: relPath, type: 'type' });
  return exports;
}

export async function analyzeGo(workDir: string): Promise<GoAnalysisResult> {
  const goModPath = join(workDir, 'go.mod');
  let moduleName = '';
  let declaredDeps: string[] = [];

  try {
    const goModContent = await readFile(goModPath, 'utf-8');
    const moduleLine = goModContent.match(/^module\s+(\S+)/m);
    if (moduleLine) moduleName = moduleLine[1];
    declaredDeps = parseGoMod(goModContent);
  } catch {
    return { unusedDeps: [], unusedExports: [], unusedFiles: [] };
  }

  const goFiles = await findGoFiles(workDir, workDir);
  const allImports = new Set<string>();
  const allExports: ExportEntry[] = [];
  const allDefinedNames = new Set<string>();
  const fileContents: Map<string, string> = new Map();

  for (const file of goFiles) {
    try {
      const content = await readFile(file, 'utf-8');
      const relPath = relative(workDir, file);
      fileContents.set(file, content);
      for (const imp of parseGoImports(content)) allImports.add(imp);
      for (const exp of parseGoExports(content, relPath)) {
        allExports.push(exp);
        allDefinedNames.add(exp.name);
      }
    } catch {}
  }

  // Unused dependencies: in go.mod but never imported
  const unusedDeps = declaredDeps.filter(dep => {
    if (dep === moduleName) return false;
    return !Array.from(allImports).some(imp => imp === dep || imp.startsWith(dep + '/'));
  });

  // Unused exports: exported name not referenced in any other file
  const allText = Array.from(fileContents.values()).join('\n');
  const unusedExports = allExports.filter(exp => {
    const occurrences = (allText.match(new RegExp(`\\b${exp.name}\\b`, 'g')) ?? []).length;
    return occurrences <= 1; // only the definition itself
  }).slice(0, 50);

  return { unusedDeps, unusedExports, unusedFiles: [] };
}
