import { useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RotateCw, Trash2, ImagePlus } from 'lucide-react';
import type { SituationPlan, SymbolInstance, SymbolType } from '@/types/project';
import { AreiSymbol } from './symbols/AreiSymbol';
import { SymbolLibrary, SYMBOL_DRAG_MIME } from './SymbolLibrary';

interface SituationEditorProps {
  plan: SituationPlan;
  onChange: (plan: SituationPlan) => void;
}

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;

export function SituationEditor({ plan, onChange }: SituationEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toCanvasCoords = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  };

  const handleDrop = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    const type = e.dataTransfer.getData(SYMBOL_DRAG_MIME) as SymbolType;
    if (!type) return;
    const { x, y } = toCanvasCoords(e.clientX, e.clientY);
    const symbol: SymbolInstance = { id: uuidv4(), type, x, y, rotation: 0 };
    onChange({ ...plan, symbols: [...plan.symbols, symbol] });
    setSelectedId(symbol.id);
  };

  const updateSymbol = (id: string, patch: Partial<SymbolInstance>) => {
    onChange({ ...plan, symbols: plan.symbols.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    onChange({ ...plan, symbols: plan.symbols.filter((s) => s.id !== selectedId) });
    setSelectedId(null);
  };

  const handleBackgroundUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onChange({ ...plan, backgroundImage: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-full">
      <SymbolLibrary />
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-950 px-3 py-2">
          <label className="flex cursor-pointer items-center gap-1.5 rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:border-arei-500">
            <ImagePlus className="h-3.5 w-3.5" />
            Plattegrond laden
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleBackgroundUpload(e.target.files[0])}
            />
          </label>
          {selectedId && (
            <>
              <button
                onClick={() => updateSymbol(selectedId, { rotation: ((plan.symbols.find((s) => s.id === selectedId)?.rotation ?? 0) + 45) % 360 })}
                className="flex items-center gap-1.5 rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:border-arei-500"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Draaien
              </button>
              <button onClick={deleteSelected} className="flex items-center gap-1.5 rounded border border-neutral-700 px-2 py-1 text-xs text-red-300 hover:border-red-500">
                <Trash2 className="h-3.5 w-3.5" />
                Verwijderen
              </button>
            </>
          )}
        </div>

        <div className="flex-1 overflow-auto bg-neutral-900 p-4">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
            className="mx-auto block bg-white shadow-lg"
            style={{ width: '100%', maxWidth: 1100, aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => setSelectedId(null)}
          >
            {plan.backgroundImage && (
              <image href={plan.backgroundImage} x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} preserveAspectRatio="xMidYMid meet" opacity={0.9} />
            )}
            {plan.symbols.map((symbol) => (
              <g
                key={symbol.id}
                transform={`translate(${symbol.x}, ${symbol.y}) rotate(${symbol.rotation})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(symbol.id);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setSelectedId(symbol.id);
                  const onMove = (moveEvent: MouseEvent) => {
                    const { x, y } = toCanvasCoords(moveEvent.clientX, moveEvent.clientY);
                    updateSymbol(symbol.id, { x, y });
                  };
                  const onUp = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                  };
                  window.addEventListener('mousemove', onMove);
                  window.addEventListener('mouseup', onUp);
                }}
                className="cursor-move text-neutral-900"
              >
                <foreignObject x={-16} y={-16} width={32} height={32}>
                  <AreiSymbol type={symbol.type} size={32} strokeColor={symbol.id === selectedId ? '#f5a300' : '#171717'} />
                </foreignObject>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
