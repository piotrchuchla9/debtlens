'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ScanPollerProps {
  isActive: boolean;
  jobId: string | null;
}

const MAX_POLLS = 20; // stop after ~2 minutes (20 × 6s)

export function ScanPoller({ isActive, jobId }: ScanPollerProps) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(0);
  const lastJobId = useRef<string | null>(null);

  useEffect(() => {
    if (!isActive || !jobId) return;

    // Reset counter when a new job starts
    if (jobId !== lastJobId.current) {
      countRef.current = 0;
      lastJobId.current = jobId;
    }

    intervalRef.current = setInterval(() => {
      countRef.current += 1;
      if (countRef.current > MAX_POLLS) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      router.refresh();
    }, 6000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, jobId, router]);

  return null;
}
