import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileBreakdown, ExportBreakdown } from '@/types';
import { FileX, PackageX, FunctionSquare } from 'lucide-react';

interface BreakdownTabsProps {
  files: FileBreakdown[];
  exports: ExportBreakdown[];
  deps: string[];
}

export function BreakdownTabs({ files, exports, deps }: BreakdownTabsProps) {
  const filesWithExports = files.filter(f => (f.unusedExports ?? 0) > 0);
  const deadFiles = files.filter(f => (f.unusedExports ?? 0) === 0);

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
                <span className="font-mono text-xs text-muted-foreground truncate">{f.file}</span>
                <span className="ml-4 shrink-0">
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    unused file
                  </Badge>
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
              {exports.slice(0, 20).map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs font-medium">{e.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">{e.file}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="text-[10px]">{e.type}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {exports.length > 20 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-xs text-muted-foreground">
                    +{exports.length - 20} more
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
              <Badge key={dep} variant="outline" className="font-mono text-xs">{dep}</Badge>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
