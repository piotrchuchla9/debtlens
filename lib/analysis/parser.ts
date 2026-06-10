import { KnipOutput, FileEntry, ExportEntry } from '@/types';

export interface ParsedAnalysis {
  unused_files_count: number;
  unused_exports_count: number;
  unused_deps_count: number;
  total_dead_code: number;
  unused_files_list: FileEntry[];
  unused_exports_list: ExportEntry[];
  unused_deps_list: string[];
}

export function parseKnipOutput(output: KnipOutput): ParsedAnalysis {
  const allExports: ExportEntry[] = [];
  const allDeps: string[] = [];

  for (const fileIssues of output.issues ?? []) {
    for (const exp of fileIssues.exports ?? []) {
      allExports.push({ name: exp.name, file: fileIssues.file, type: 'export' });
    }
    for (const t of fileIssues.types ?? []) {
      allExports.push({ name: t.name, file: fileIssues.file, type: 'type' });
    }
    for (const dep of fileIssues.dependencies ?? []) {
      allDeps.push(dep.name);
    }
    for (const dep of fileIssues.devDependencies ?? []) {
      allDeps.push(dep.name);
    }
  }

  const fileExportCounts = allExports.reduce<Record<string, number>>((acc, e) => {
    acc[e.file] = (acc[e.file] ?? 0) + 1;
    return acc;
  }, {});

  const unusedFilesList: FileEntry[] = (output.files ?? []).map(file => ({
    file,
    exportCount: fileExportCounts[file] ?? 0,
  }));

  return {
    unused_files_count: unusedFilesList.length,
    unused_exports_count: allExports.length,
    unused_deps_count: allDeps.length,
    total_dead_code: unusedFilesList.length + allExports.length + allDeps.length,
    unused_files_list: unusedFilesList,
    unused_exports_list: allExports,
    unused_deps_list: allDeps,
  };
}
