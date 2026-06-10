import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendPoint } from '@/types';
import { cn, deltaColor, deltaLabel, formatDateTime } from '@/lib/utils';

interface CommitTableProps {
  trend: TrendPoint[];
  repoId: string;
}

export function CommitTable({ trend, repoId }: CommitTableProps) {
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
          <TableRow key={point.sha} className="cursor-pointer hover:bg-muted/50">
            <TableCell>
              <Link href={`/repo/${repoId}/commit/${point.sha}`} className="block">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{point.sha}</code>
              </Link>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              <Link href={`/repo/${repoId}/commit/${point.sha}`} className="block">
                {formatDateTime(point.date)}
              </Link>
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              <Link href={`/repo/${repoId}/commit/${point.sha}`} className="block">
                {point.total}
              </Link>
            </TableCell>
            <TableCell className={cn('text-right font-medium tabular-nums', deltaColor(point.delta))}>
              <Link href={`/repo/${repoId}/commit/${point.sha}`} className="block">
                {deltaLabel(point.delta)}
              </Link>
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
