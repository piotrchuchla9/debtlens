import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';
import { ExportEntry } from '@/types';

export interface PythonAnalysisResult {
  unusedDeps: string[];
  unusedExports: ExportEntry[];
  unusedFiles: string[];
}

// Embedded Python script — uses only stdlib (ast, os, sys, json, re)
const PYTHON_SCRIPT = `
import ast, os, sys, json, re

IGNORE_DIRS = {'__pycache__', '.git', 'venv', 'env', '.venv', '.tox', 'node_modules', 'dist', 'build', '.mypy_cache'}

def find_py_files(root):
    result = []
    for dirpath, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS and not d.startswith('.')]
        for f in files:
            if f.endswith('.py'):
                result.append(os.path.join(dirpath, f))
    return result[:300]  # cap to avoid timeouts

def get_imports(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            source = f.read()
        tree = ast.parse(source, filename=filepath)
        imports = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.add(alias.name.split('.')[0].lower())
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.add(node.module.split('.')[0].lower())
        return imports
    except:
        return set()

def get_top_level_defs(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            source = f.read()
        tree = ast.parse(source, filename=filepath)
        result = []
        for node in tree.body:
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if not node.name.startswith('_'):
                    result.append({'name': node.name, 'line': node.lineno, 'type': 'function'})
            elif isinstance(node, ast.ClassDef):
                if not node.name.startswith('_'):
                    result.append({'name': node.name, 'line': node.lineno, 'type': 'class'})
        return result
    except:
        return []

def parse_requirements(root):
    reqs = set()
    for fname in ['requirements.txt', 'requirements-dev.txt', 'requirements/base.txt']:
        path = os.path.join(root, fname)
        if os.path.exists(path):
            with open(path, 'r', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and not line.startswith('-') and not line.startswith('http'):
                        pkg = re.split(r'[>=<!;\\[\\s]', line)[0].strip().lower().replace('-', '_')
                        if pkg:
                            reqs.add(pkg)
    return reqs

root = sys.argv[1]
py_files = find_py_files(root)

all_imports = set()
file_defs = {}

for filepath in py_files:
    imports = get_imports(filepath)
    all_imports.update(imports)
    defs = get_top_level_defs(filepath)
    if defs:
        file_defs[filepath] = defs

reqs = parse_requirements(root)
unused_deps = [r for r in reqs if r not in all_imports and r.replace('_', '-') not in all_imports]

# Build full text corpus for cross-file reference check
full_text = ''
for fp in py_files:
    try:
        with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
            full_text += f.read() + '\\n'
    except:
        pass

unused_exports = []
for filepath, defs in list(file_defs.items())[:50]:
    rel = os.path.relpath(filepath, root)
    for d in defs:
        name = d['name']
        count = len(re.findall(r'\\b' + re.escape(name) + r'\\b', full_text))
        if count <= 1:
            unused_exports.append({'name': name, 'file': rel, 'type': d['type']})

print(json.dumps({
    'unused_deps': unused_deps[:30],
    'unused_exports': unused_exports[:50],
    'unused_files': []
}))
`;

function runPython(scriptPath: string, workDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const proc = spawn('python3', [scriptPath, workDir], {
      env: { ...process.env, HOME: '/tmp' },
    });
    proc.stdout.on('data', (c: Buffer) => (stdout += c.toString()));
    proc.stderr.on('data', (c: Buffer) => (stderr += c.toString()));
    proc.on('close', () => resolve(stdout));
    proc.on('error', reject);
  });
}

export async function analyzePython(workDir: string): Promise<PythonAnalysisResult> {
  const scriptPath = join('/tmp', 'debtlens_python_analyzer.py');

  try {
    await writeFile(scriptPath, PYTHON_SCRIPT, 'utf-8');
    const output = await runPython(scriptPath, workDir);
    const jsonStart = output.indexOf('{');
    if (jsonStart === -1) return { unusedDeps: [], unusedExports: [], unusedFiles: [] };

    const parsed = JSON.parse(output.slice(jsonStart));
    return {
      unusedDeps: parsed.unused_deps ?? [],
      unusedExports: (parsed.unused_exports ?? []).map((e: { name: string; file: string; type: string }) => ({
        name: e.name,
        file: e.file,
        type: e.type,
      })),
      unusedFiles: parsed.unused_files ?? [],
    };
  } catch {
    return { unusedDeps: [], unusedExports: [], unusedFiles: [] };
  } finally {
    await unlink(scriptPath).catch(() => {});
  }
}
