import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ValidationIssue } from '@/types/project';
import { getAreiRulesVersion } from '@/utils/areiValidator';

interface ValidationPanelProps {
  issues: ValidationIssue[];
}

export function ValidationPanel({ issues }: ValidationPanelProps) {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');

  return (
    <div className="max-h-40 overflow-y-auto border-t border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
        <span>AREI-validatie (regelset {getAreiRulesVersion()})</span>
        {issues.length === 0 ? (
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Geen opmerkingen
          </span>
        ) : (
          <span>
            {errors.length} fout{errors.length === 1 ? '' : 'en'} · {warnings.length} waarschuwing
            {warnings.length === 1 ? '' : 'en'}
          </span>
        )}
      </div>
      <ul className="space-y-1">
        {[...errors, ...warnings, ...infos].map((issue, idx) => (
          <li key={idx} className="flex items-start gap-1.5 text-xs">
            {issue.severity === 'error' && <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />}
            {issue.severity === 'warning' && <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500" />}
            {issue.severity === 'info' && <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" />}
            <span className="text-neutral-300">{issue.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
