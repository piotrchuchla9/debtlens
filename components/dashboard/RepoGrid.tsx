'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { RepoCard } from './RepoCard';
import { RepositoryWithLatestAnalysis } from '@/types';

export function RepoGrid({ repos }: { repos: RepositoryWithLatestAnalysis[] }) {
  const [query, setQuery] = useState('');

  const filtered = repos.filter(r =>
    r.full_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {repos.length > 5 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Filter repositories…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No repositories match &ldquo;{query}&rdquo;
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(repo => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </div>
  );
}
