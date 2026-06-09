'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CreditCard, Home, GitBranch, ChevronRight, Loader2, CheckCircle2, AlertTriangle, XCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/billing', label: 'Billing', icon: CreditCard },
];

function RepoStatusDot({ status }: { status?: string }) {
  if (!status) return <Circle className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />;

  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />;
    case 'running':
    case 'pending':
      return <Loader2 className="h-3 w-3 text-yellow-500 animate-spin shrink-0" />;
    case 'failed':
      return <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0" />;
    case 'dead':
      return <XCircle className="h-3 w-3 text-red-500 shrink-0" />;
    default:
      return <Circle className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />;
  }
}

interface SidebarProps {
  repos?: { id: string; full_name: string }[];
  jobStatusByRepo?: Record<string, string>;
}

export function Sidebar({ repos = [], jobStatusByRepo = {} }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-border/60 bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border/60 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <BarChart3 className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold tracking-tight">DebtLens</span>
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {/* Main nav */}
        <nav className="flex flex-col gap-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Repos */}
        {repos.length > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Repositories
            </div>
            <nav className="flex flex-col gap-0.5">
              {repos.map(repo => {
                const active = pathname.startsWith(`/repo/${repo.id}`);
                const status = jobStatusByRepo[repo.id];
                return (
                  <Link
                    key={repo.id}
                    href={`/repo/${repo.id}`}
                    prefetch={false}
                    className={cn(
                      'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-accent font-medium text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    )}
                  >
                    <RepoStatusDot status={status} />
                    <span className="flex-1 truncate">{repo.full_name.split('/')[1]}</span>
                    {active && <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}
