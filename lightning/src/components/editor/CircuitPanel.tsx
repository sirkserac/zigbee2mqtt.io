import { Plus } from 'lucide-react';
import clsx from 'clsx';
import type { Board, CableType, Circuit, CircuitType, DifferentialType, ValidationIssue } from '@/types/project';

interface CircuitPanelProps {
  board: Board;
  selectedCircuitId: string | null;
  issues: ValidationIssue[];
  onSelect: (id: string) => void;
  onAddCircuit: () => void;
  onUpdateCircuit: (id: string, patch: Partial<Circuit>) => void;
}

const CIRCUIT_TYPE_OPTIONS: { value: CircuitType; label: string }[] = [
  { value: 'verlichting', label: 'Verlichting' },
  { value: 'stopcontact', label: 'Stopcontact' },
  { value: 'stopcontact_badkamer', label: 'Stopcontact badkamer' },
  { value: 'wasmachine', label: 'Wasmachine' },
  { value: 'droogkast', label: 'Droogkast' },
  { value: 'vaatwasser', label: 'Vaatwasser' },
  { value: 'kookplaat', label: 'Kookplaat' },
  { value: 'oven', label: 'Oven' },
  { value: 'boiler_elektrisch', label: 'Elektrische boiler' },
  { value: 'warmtepomp', label: 'Warmtepomp' },
  { value: 'ev_laadpaal', label: 'EV-laadpaal' },
  { value: 'pv_omvormer', label: 'PV-omvormer' },
  { value: 'thuisbatterij', label: 'Thuisbatterij' },
  { value: 'airco', label: 'Airco' },
  { value: 'sauna', label: 'Sauna' },
  { value: 'tuinstopcontact', label: 'Tuinstopcontact' },
  { value: 'algemeen', label: 'Algemeen' },
];

const CABLE_TYPES: CableType[] = ['XVB', 'VOB', 'VFVB', 'H07RN-F', 'YMVK'];
const DIFFERENTIAL_TYPES: DifferentialType[] = ['geen', 'AC', 'A', 'F', 'B'];
const CABLE_SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25];
const BREAKER_RATINGS = [6, 10, 13, 16, 20, 25, 32, 40];

export function CircuitPanel({ board, selectedCircuitId, issues, onSelect, onAddCircuit, onUpdateCircuit }: CircuitPanelProps) {
  const selectedCircuit = board.circuits.find((c) => c.id === selectedCircuitId) ?? null;
  const circuitIssues = selectedCircuit ? issues.filter((i) => i.circuitId === selectedCircuit.id) : [];

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-neutral-800 bg-neutral-950">
      <div className="flex items-center justify-between border-b border-neutral-800 p-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Kringen — {board.name}</h2>
        <button onClick={onAddCircuit} title="Kring toevoegen" className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-arei-400">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <ul className="max-h-48 overflow-y-auto border-b border-neutral-800">
        {board.circuits.map((circuit) => {
          const hasError = issues.some((i) => i.circuitId === circuit.id && i.severity === 'error');
          return (
            <li key={circuit.id}>
              <button
                onClick={() => onSelect(circuit.id)}
                className={clsx(
                  'flex w-full items-center justify-between px-3 py-1.5 text-left text-sm',
                  circuit.id === selectedCircuitId ? 'bg-arei-500/20 text-arei-300' : 'text-neutral-300 hover:bg-neutral-900',
                )}
              >
                <span className="truncate">
                  <span className="font-mono text-xs text-neutral-500">{circuit.label}</span> {circuit.name}
                </span>
                {hasError && <span className="ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />}
              </button>
            </li>
          );
        })}
      </ul>

      {selectedCircuit ? (
        <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
          <Field label="Label">
            <input
              value={selectedCircuit.label}
              onChange={(e) => onUpdateCircuit(selectedCircuit.id, { label: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Naam">
            <input
              value={selectedCircuit.name}
              onChange={(e) => onUpdateCircuit(selectedCircuit.id, { name: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Type">
            <select
              value={selectedCircuit.type}
              onChange={(e) => onUpdateCircuit(selectedCircuit.id, { type: e.target.value as CircuitType })}
              className="input"
            >
              {CIRCUIT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Automaat (A)">
              <select
                value={selectedCircuit.breakerRatingA}
                onChange={(e) => onUpdateCircuit(selectedCircuit.id, { breakerRatingA: Number(e.target.value) })}
                className="input"
              >
                {BREAKER_RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {r}A
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Curve">
              <select
                value={selectedCircuit.breakerCurve}
                onChange={(e) => onUpdateCircuit(selectedCircuit.id, { breakerCurve: e.target.value as Circuit['breakerCurve'] })}
                className="input"
              >
                {(['B', 'C', 'D'] as const).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Kabelsectie (mm²)">
              <select
                value={selectedCircuit.cable.sectionMm2}
                onChange={(e) => onUpdateCircuit(selectedCircuit.id, { cable: { ...selectedCircuit.cable, sectionMm2: Number(e.target.value) } })}
                className="input"
              >
                {CABLE_SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kabeltype">
              <select
                value={selectedCircuit.cable.type}
                onChange={(e) => onUpdateCircuit(selectedCircuit.id, { cable: { ...selectedCircuit.cable, type: e.target.value as CableType } })}
                className="input"
              >
                {CABLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Differentieel">
              <select
                value={selectedCircuit.differentialType}
                onChange={(e) => onUpdateCircuit(selectedCircuit.id, { differentialType: e.target.value as DifferentialType })}
                className="input"
              >
                {DIFFERENTIAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === 'geen' ? 'Geen' : `Type ${t}`}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="mA">
              <input
                type="number"
                value={selectedCircuit.differentialRatingMa ?? ''}
                onChange={(e) => onUpdateCircuit(selectedCircuit.id, { differentialRatingMa: e.target.value ? Number(e.target.value) : undefined })}
                className="input"
              />
            </Field>
          </div>
          <Field label="Aantal aansluitpunten">
            <input
              type="number"
              min={0}
              value={selectedCircuit.outletCount}
              onChange={(e) => onUpdateCircuit(selectedCircuit.id, { outletCount: Number(e.target.value) })}
              className="input"
            />
          </Field>

          {circuitIssues.length > 0 && (
            <div className="space-y-1.5 rounded border border-neutral-800 bg-neutral-900 p-2">
              {circuitIssues.map((issue, idx) => (
                <p
                  key={idx}
                  className={clsx(
                    'text-xs',
                    issue.severity === 'error' && 'text-red-400',
                    issue.severity === 'warning' && 'text-yellow-400',
                    issue.severity === 'info' && 'text-neutral-400',
                  )}
                >
                  {issue.message}
                </p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-neutral-500">
          Selecteer een kring om de eigenschappen te bewerken.
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-neutral-500">{label}</span>
      {children}
    </label>
  );
}
