'use client';

import { TrendChart } from './TrendChart';
import { TrendPoint } from '@/types';

interface TrendChartWrapperProps {
  data: TrendPoint[];
  isPro: boolean;
}

export function TrendChartWrapper({ data, isPro }: TrendChartWrapperProps) {
  return <TrendChart data={data} isPro={isPro} />;
}
