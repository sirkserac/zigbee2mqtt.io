import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { ProjectSearchFilters } from '@/utils/db';
import type { ProjectStatus } from '@/types/project';

interface ProjectSearchBarProps {
  onChange: (filters: ProjectSearchFilters) => void;
}

const STATUS_OPTIONS: { value: ProjectStatus | ''; label: string }[] = [
  { value: '', label: 'Alle statussen' },
  { value: 'concept', label: 'Concept' },
  { value: 'in_uitvoering', label: 'In uitvoering' },
  { value: 'gekeurd', label: 'Gekeurd' },
  { value: 'afgekeurd', label: 'Afgekeurd' },
  { value: 'archief', label: 'Archief' },
];

export function ProjectSearchBar({ onChange }: ProjectSearchBarProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ProjectStatus | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const emit = (next: { query?: string; status?: ProjectStatus | ''; fromDate?: string; toDate?: string }) => {
    const merged = {
      query,
      status,
      fromDate,
      toDate,
      ...next,
    };
    setQuery(merged.query ?? '');
    setStatus((merged.status as ProjectStatus | '') ?? '');
    setFromDate(merged.fromDate ?? '');
    setToDate(merged.toDate ?? '');
    onChange({
      query: merged.query || undefined,
      status: merged.status || undefined,
      fromDate: merged.fromDate || undefined,
      toDate: merged.toDate || undefined,
    });
  };

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            value={query}
            onChange={(e) => emit({ query: e.target.value })}
            placeholder="Zoek op klantnaam, adres, datum of EAN-code…"
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-arei-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => emit({ status: e.target.value as ProjectStatus | '' })}
          className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-arei-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1.5 rounded-md border border-neutral-800 px-3 py-2 text-sm text-neutral-300 hover:border-arei-500"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Datum
        </button>
      </div>

      {showAdvanced && (
        <div className="flex items-center gap-2 text-sm text-neutral-300">
          <label className="flex items-center gap-1.5">
            Van
            <input type="date" value={fromDate} onChange={(e) => emit({ fromDate: e.target.value })} className="rounded border border-neutral-800 bg-neutral-900 px-2 py-1" />
          </label>
          <label className="flex items-center gap-1.5">
            Tot
            <input type="date" value={toDate} onChange={(e) => emit({ toDate: e.target.value })} className="rounded border border-neutral-800 bg-neutral-900 px-2 py-1" />
          </label>
        </div>
      )}
    </div>
  );
}
