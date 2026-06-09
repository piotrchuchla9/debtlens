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
  const allExports: ExportEntry[] = [
    ...(output.exports ?? []).map(e => ({ name: e.name, file: e.file, type: e.type })),
    ...(output.types ?? []).map(t => ({ name: t.name, file: t.file, type: 'type' })),
  ];

  const allDeps = [
    ...(output.dependencies ?? []).map(d => d.package ?? d.name),
    ...(output.devDependencies ?? []).map(d => d.package ?? d.name),
  ];

  const fileExportCounts = allExports.reduce<Record<string, number>>((acc, e) => {
    acc[e.file] = (acc[e.file] ?? 0) + 1;
    return acc;
  }, {});

  const unusedFilesList: FileEntry[] = (output.files ?? []).map(file => ({
    file,
    exportCount: fileExportCounts[file] ?? 0,
  }));

  const unusedFilesCount = unusedFilesList.length;
  const unusedExportsCount = allExports.length;
  const unusedDepsCount = allDeps.length;

  return {
    unused_files_count: unusedFilesCount,
    unused_exports_count: unusedExportsCount,
    unused_deps_count: unusedDepsCount,
    total_dead_code: unusedFilesCount + unusedExportsCount + unusedDepsCount,
    unused_files_list: unusedFilesList,
    unused_exports_list: allExports,
    unused_deps_list: allDeps,
  };
}
