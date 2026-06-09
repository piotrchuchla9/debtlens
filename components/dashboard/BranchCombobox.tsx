'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, GitBranch, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BranchComboboxProps {
  repoId: string;
  value: string;
  defaultBranch: string;
  onChange: (value: string) => void;
}

export function BranchCombobox({ repoId, value, defaultBranch, onChange }: BranchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function fetchBranches() {
    if (fetched) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/repos/${repoId}/branches`);
      const data = await res.json();
      setBranches(data.branches ?? []);
      setFetched(true);
    } catch {
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }

  function openDropdown() {
    setOpen(true);
    fetchBranches();
    setTimeout(() => inputRef.current?.focus(), 10);
  }

  function select(branch: string) {
    onChange(branch);
    setOpen(false);
    setSearch('');
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const allBranches = [defaultBranch, ...branches.filter(b => b !== defaultBranch)];
  const filtered = allBranches.filter(b => b.toLowerCase().includes(search.toLowerCase()));
  const displayValue = value || defaultBranch;

  return (
    <div ref={containerRef} className="relative w-64">
      <button
        type="button"
        onClick={openDropdown}
        className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className="flex items-center gap-2 truncate">
          <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{displayValue}</span>
          {!value && <span className="text-muted-foreground text-xs">(default)</span>}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search branch..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">No branch found.</div>
            )}
            {!loading && filtered.map(branch => {
              const isDefault = branch === defaultBranch;
              const isSelected = value === branch || (!value && isDefault);
              return (
                <button
                  key={branch}
                  type="button"
                  onClick={() => select(isDefault && !value ? '' : branch === defaultBranch ? '' : branch)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <Check className={cn('h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                  <span>{branch}</span>
                  {isDefault && <span className="text-xs text-muted-foreground">(default)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
