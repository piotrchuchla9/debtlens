import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = await params;
  const supabase = await createServiceClient();

  const { data: results } = await supabase
    .from('analysis_results')
    .select('total_dead_code, created_at')
    .eq('repo_id', repoId)
    .order('created_at', { ascending: false })
    .limit(2);

  const latest = results?.[0];
  const previous = results?.[1];

  const count = latest?.total_dead_code ?? 0;
  const delta = latest && previous ? count - previous.total_dead_code : 0;

  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';
  const color = delta > 0 ? '#e74c3c' : delta < 0 ? '#2ecc71' : '#f39c12';
  const label = `${count} dead ${arrow}`;
  const labelWidth = label.length * 7 + 10;
  const totalWidth = 70 + labelWidth;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <rect rx="3" width="${totalWidth}" height="20" fill="#555"/>
  <rect rx="3" x="70" width="${labelWidth}" height="20" fill="${color}"/>
  <rect rx="3" width="${totalWidth}" height="20" fill="url(#s)"/>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="35" y="15" fill="#010101" fill-opacity=".3">DebtLens</text>
    <text x="35" y="14">DebtLens</text>
    <text x="${70 + labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${70 + labelWidth / 2}" y="14">${label}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'max-age=3600',
    },
  });
}
