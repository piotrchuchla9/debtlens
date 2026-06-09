import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendPoint } from '@/types';
import { cn, deltaColor, deltaLabel, formatDate, shortSha } from '@/lib/utils';

interface CommitTableProps {
  trend: TrendPoint[];
  repoId: string;
}

export function CommitTable({ trend }: CommitTableProps) {
  const recent = [...trend].reverse().slice(0, 10);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Commit</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Delta</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recent.map(point => (
          <TableRow key={point.sha}>
            <TableCell>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{point.sha}</code>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{formatDate(point.date)}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">{point.total}</TableCell>
            <TableCell className={cn('text-right font-medium tabular-nums', deltaColor(point.delta))}>
              {deltaLabel(point.delta)}
            </TableCell>
          </TableRow>
        ))}
        {recent.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              No data yet
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
