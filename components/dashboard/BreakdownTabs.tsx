import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileBreakdown, ExportBreakdown } from '@/types';
import { FileX, PackageX, FunctionSquare, ExternalLink } from 'lucide-react';

interface BreakdownTabsProps {
  files: FileBreakdown[];
  exports: ExportBreakdown[];
  deps: string[];
  repoFullName?: string;
  commitSha?: string;
  defaultBranch?: string;
}

function ghUrl(repoFullName: string, ref: string, file: string, line?: number): string {
  const base = `https://github.com/${repoFullName}/blob/${ref}/${file}`;
  return line ? `${base}#L${line}` : base;
}

export function BreakdownTabs({ files, exports, deps, repoFullName, commitSha, defaultBranch }: BreakdownTabsProps) {
  const ref = (!commitSha || commitSha === 'manual') ? (defaultBranch ?? 'main') : commitSha;
  const canLink = !!repoFullName;

  return (
    <Tabs defaultValue="files">
      <TabsList>
        <TabsTrigger value="files" className="gap-1.5">
          <FileX className="h-3.5 w-3.5" />
          Unused Files ({files.length})
        </TabsTrigger>
        <TabsTrigger value="exports" className="gap-1.5">
          <FunctionSquare className="h-3.5 w-3.5" />
          Unused Exports ({exports.length})
        </TabsTrigger>
        <TabsTrigger value="deps" className="gap-1.5">
          <PackageX className="h-3.5 w-3.5" />
          Unused Deps ({deps.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="files" className="mt-4">
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No unused files</p>
        ) : (
          <div className="space-y-1">
            {files.map(f => (
              <div key={f.file} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50">
                {canLink ? (
                  <a
                    href={ghUrl(repoFullName!, ref, f.file)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground truncate min-w-0"
                  >
                    <span className="truncate">{f.file}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                  </a>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground truncate">{f.file}</span>
                )}
                <span className="ml-4 shrink-0">
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">unused file</Badge>
                </span>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="exports" className="mt-4">
        {exports.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No unused exports</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Export</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exports.slice(0, 30).map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs font-medium">{e.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[220px]">
                    {canLink ? (
                      <a
                        href={ghUrl(repoFullName!, ref, e.file, e.line)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-foreground truncate"
                      >
                        <span className="truncate">{e.file}{e.line ? `:${e.line}` : ''}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                      </a>
                    ) : (
                      <span className="truncate block">{e.file}{e.line ? `:${e.line}` : ''}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="text-[10px]">{e.type}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {exports.length > 30 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-xs text-muted-foreground">
                    +{exports.length - 30} more
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="deps" className="mt-4">
        {deps.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No unused dependencies</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {deps.map(dep => (
              <a
                key={dep}
                href={`https://www.npmjs.com/package/${dep}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Badge variant="outline" className="font-mono text-xs hover:bg-accent cursor-pointer gap-1">
                  {dep}
                  <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                </Badge>
              </a>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
