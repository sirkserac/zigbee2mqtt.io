import type { Board, ValidationIssue } from '@/types/project';
import { AreiSymbol } from './symbols/AreiSymbol';
import clsx from 'clsx';

interface SchemaEditorProps {
  board: Board;
  selectedCircuitId: string | null;
  issues: ValidationIssue[];
  onSelectCircuit: (id: string) => void;
}

const ROW_HEIGHT = 46;
const TOP_MARGIN = 60;
const TRUNK_X = 140;

/**
 * Tekent het eendraadsschema van één bord: hoofdautomaat, algemene
 * differentieel(en) en de individuele kringen als vertakkingen op de
 * hoofdleiding — de klassieke AREI-voorstelling.
 */
export function SchemaEditor({ board, selectedCircuitId, issues, onSelectCircuit }: SchemaEditorProps) {
  const height = TOP_MARGIN + board.circuits.length * ROW_HEIGHT + 60;
  const width = 760;

  return (
    <div className="flex-1 overflow-auto bg-neutral-900 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto block bg-white shadow-lg" style={{ width: '100%', maxWidth: 900 }}>
        {/* Hoofdvoeding */}
        <line x1={TRUNK_X} y1={10} x2={TRUNK_X} y2={TOP_MARGIN} stroke="#171717" strokeWidth={1.6} />
        <g transform={`translate(${TRUNK_X - 16}, 14)`}>
          <AreiSymbol type="automaat" size={32} strokeColor="#171717" />
        </g>
        <text x={TRUNK_X + 24} y={30} fontSize={11} fill="#171717">
          Hoofdautomaat {board.mainBreakerRatingA}A
        </text>

        {board.differentials.map((diff, idx) => (
          <text key={diff.id} x={TRUNK_X + 24} y={44 + idx * 12} fontSize={9} fill="#525252">
            Differentieel Type {diff.type} — {diff.ratingMa}mA
          </text>
        ))}

        {/* Verticale trunk-lijn doorheen alle kringen */}
        <line x1={TRUNK_X} y1={TOP_MARGIN} x2={TRUNK_X} y2={TOP_MARGIN + board.circuits.length * ROW_HEIGHT} stroke="#171717" strokeWidth={1.6} />

        {board.circuits.map((circuit, idx) => {
          const y = TOP_MARGIN + idx * ROW_HEIGHT + ROW_HEIGHT / 2;
          const hasError = issues.some((i) => i.circuitId === circuit.id && i.severity === 'error');
          const hasWarning = issues.some((i) => i.circuitId === circuit.id && i.severity === 'warning');
          const isSelected = circuit.id === selectedCircuitId;

          return (
            <g
              key={circuit.id}
              onClick={() => onSelectCircuit(circuit.id)}
              className="cursor-pointer"
            >
              <line x1={TRUNK_X} y1={y} x2={TRUNK_X + 40} y2={y} stroke={isSelected ? '#f5a300' : '#171717'} strokeWidth={1.4} />
              <g transform={`translate(${TRUNK_X + 40}, ${y - 14})`}>
                <AreiSymbol type="automaat" size={28} strokeColor={isSelected ? '#f5a300' : '#171717'} />
              </g>
              <line x1={TRUNK_X + 68} y1={y} x2={TRUNK_X + 100} y2={y} stroke={isSelected ? '#f5a300' : '#171717'} strokeWidth={1.4} />
              <circle
                cx={TRUNK_X + 108}
                cy={y}
                r={5}
                fill={hasError ? '#dc2626' : hasWarning ? '#eab308' : '#22c55e'}
              />
              <text x={TRUNK_X + 122} y={y - 5} fontSize={11} fontWeight={600} fill="#171717">
                {circuit.label} — {circuit.name}
              </text>
              <text
                x={TRUNK_X + 122}
                y={y + 9}
                fontSize={9}
                fill="#525252"
                className={clsx(isSelected && 'font-semibold')}
              >
                {circuit.breakerRatingA}A {circuit.breakerCurve} · {circuit.cable.sectionMm2}mm² {circuit.cable.type}
                {circuit.differentialType !== 'geen' && ` · Δ ${circuit.differentialType} ${circuit.differentialRatingMa ?? ''}mA`}
              </text>
            </g>
          );
        })}

        {board.circuits.length === 0 && (
          <text x={TRUNK_X + 40} y={TOP_MARGIN + 20} fontSize={11} fill="#a3a3a3">
            Nog geen kringen — voeg er één toe via het paneel rechts.
          </text>
        )}
      </svg>
    </div>
  );
}
