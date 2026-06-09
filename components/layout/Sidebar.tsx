'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Settings, CreditCard, Home, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/billing', label: 'Billing', icon: CreditCard },
];

interface SidebarProps {
  repos?: { id: string; full_name: string }[];
}

export function Sidebar({ repos = [] }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-muted/30 p-4">
      <div className="mb-6 flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">DebtLens</span>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
              pathname === href && 'bg-accent font-medium'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {repos.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Repositories
          </p>
          <nav className="flex flex-col gap-1">
            {repos.map(repo => (
              <Link
                key={repo.id}
                href={`/repo/${repo.id}`}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent truncate',
                  pathname.startsWith(`/repo/${repo.id}`) && 'bg-accent font-medium'
                )}
              >
                <GitBranch className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{repo.full_name.split('/')[1]}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </aside>
  );
}
