'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, GitBranch, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface BranchComboboxProps {
  repoId: string;
  value: string;
  defaultBranch: string;
  onChange: (value: string) => void;
}

export function BranchCombobox({ repoId, value, defaultBranch, onChange }: BranchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

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

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) fetchBranches();
  }

  const displayValue = value || defaultBranch;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-64 justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayValue}</span>
            {!value && <span className="text-muted-foreground">(default)</span>}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search branch..." />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading branches…
              </div>
            )}
            {!loading && (
              <>
                <CommandEmpty>No branch found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value=""
                    onSelect={() => { onChange(''); setOpen(false); }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', !value ? 'opacity-100' : 'opacity-0')} />
                    <span>{defaultBranch}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">(default)</span>
                  </CommandItem>
                  {branches.filter(b => b !== defaultBranch).map(branch => (
                    <CommandItem
                      key={branch}
                      value={branch}
                      onSelect={(v) => { onChange(v); setOpen(false); }}
                    >
                      <Check className={cn('mr-2 h-4 w-4', value === branch ? 'opacity-100' : 'opacity-0')} />
                      {branch}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
