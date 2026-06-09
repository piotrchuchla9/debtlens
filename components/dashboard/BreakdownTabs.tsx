import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileBreakdown, ExportBreakdown } from '@/types';

interface BreakdownTabsProps {
  files: FileBreakdown[];
  exports: ExportBreakdown[];
  deps: string[];
}

export function BreakdownTabs({ files, exports, deps }: BreakdownTabsProps) {
  return (
    <Tabs defaultValue="files">
      <TabsList>
        <TabsTrigger value="files">Top Files ({files.length})</TabsTrigger>
        <TabsTrigger value="deps">Unused Deps ({deps.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="files" className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead className="text-right">Unused exports</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map(f => (
              <TableRow key={f.file}>
                <TableCell className="font-mono text-xs">{f.file}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{f.unusedExports ?? 0}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {files.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">No unused files</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TabsContent>

      <TabsContent value="deps" className="mt-4">
        <div className="flex flex-wrap gap-2">
          {deps.map(dep => (
            <Badge key={dep} variant="outline" className="font-mono text-xs">{dep}</Badge>
          ))}
          {deps.length === 0 && (
            <p className="text-sm text-muted-foreground">No unused dependencies</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
