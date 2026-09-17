import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import clsx from 'clsx';
import type { SituationPlan } from '@/types/project';

interface PlanSwitcherProps {
  plans: SituationPlan[];
  activePlanId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Tabbladen om tussen meerdere situatieplannen (bv. per verdieping) te
 * wisselen: gelijkvloers, eerste verdieping, tuin, etc.
 */
export function PlanSwitcher({ plans, activePlanId, onSelect, onAdd, onRename, onDelete }: PlanSwitcherProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  const startRename = (plan: SituationPlan) => {
    setEditingId(plan.id);
    setDraftName(plan.name);
  };

  const commitRename = () => {
    if (editingId && draftName.trim()) {
      onRename(editingId, draftName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-800 bg-neutral-950 px-2 py-1.5">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={clsx(
            'group flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs',
            plan.id === activePlanId ? 'bg-arei-500/20 text-arei-300' : 'text-neutral-400 hover:bg-neutral-900',
          )}
        >
          {editingId === plan.id ? (
            <>
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && commitRename()}
                className="w-28 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-xs text-white outline-none"
              />
              <button onClick={commitRename} className="hover:text-green-400">
                <Check className="h-3 w-3" />
              </button>
              <button onClick={() => setEditingId(null)} className="hover:text-red-400">
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onSelect(plan.id)} className="max-w-[10rem] truncate">
                {plan.name}
              </button>
              <button onClick={() => startRename(plan)} className="opacity-0 hover:text-arei-400 group-hover:opacity-100">
                <Pencil className="h-3 w-3" />
              </button>
              {plans.length > 1 && (
                <button onClick={() => onDelete(plan.id)} className="opacity-0 hover:text-red-400 group-hover:opacity-100">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </>
          )}
        </div>
      ))}
      <button
        onClick={onAdd}
        title="Plan toevoegen"
        className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-900 hover:text-arei-400"
      >
        <Plus className="h-3.5 w-3.5" />
        Plan
      </button>
    </div>
  );
}
