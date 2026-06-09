'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ScanPollerProps {
  isActive: boolean;
}

export function ScanPoller({ isActive }: ScanPollerProps) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, router]);

  return null;
}
