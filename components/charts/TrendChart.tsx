'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendPoint } from '@/types';
import { formatDate, shortSha } from '@/lib/utils';

interface TrendChartProps {
  data: TrendPoint[];
  isPro: boolean;
  onPointClick?: (sha: string) => void;
}

export function TrendChart({ data, isPro, onPointClick }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No data yet — push a commit to trigger the first scan
      </div>
    );
  }

  const chartData = data.map((p, i) => ({
    ...p,
    label: shortSha(p.sha),
    dateLabel: formatDate(p.date),
    idx: i,
  }));

  return (
    <div className="relative">
      {!isPro && data.length >= 20 && (
        <div className="absolute right-0 top-0 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
          Showing last 90 days · Upgrade for full history
        </div>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} onClick={(e: any) => e?.activePayload?.[0] && onPointClick?.(e.activePayload[0].payload.sha)}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="idx"
            tick={{ fontSize: 11 }}
            tickFormatter={(val: number) => chartData[val]?.label ?? ''}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as typeof chartData[0];
              return (
                <div className="rounded-lg border bg-background p-3 shadow-sm text-xs">
                  <div className="font-medium">{d.dateLabel} · {d.label}</div>
                  <div className="mt-1 space-y-0.5">
                    <div>Total: <span className="font-semibold">{d.total}</span></div>
                    <div>Files: {d.files} · Exports: {d.exports} · Deps: {d.deps}</div>
                    {d.delta !== null && (
                      <div className={d.delta > 0 ? 'text-red-500' : 'text-green-500'}>
                        Delta: {d.delta > 0 ? '+' : ''}{d.delta}
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Total" />
          <Line type="monotone" dataKey="files" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="8 3" name="Files" />
          <Line type="monotone" dataKey="exports" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="3 3" name="Exports" />
          <Line type="monotone" dataKey="deps" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="1 3" name="Deps" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
