import { SYMBOL_CATEGORY_LABEL, SYMBOL_LIBRARY, type SymbolDefinition } from './symbols/registry';
import { AreiSymbol } from './symbols/AreiSymbol';

const CATEGORIES: SymbolDefinition['category'][] = ['aansluitpunten', 'schakelmateriaal', 'bord', 'energie'];

export const SYMBOL_DRAG_MIME = 'application/x-lightning-symbol';

export function SymbolLibrary() {
  return (
    <aside className="w-56 shrink-0 overflow-y-auto border-r border-neutral-800 bg-neutral-950 p-3">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Symbolenbibliotheek</h2>
      {CATEGORIES.map((category) => (
        <div key={category} className="mb-4">
          <h3 className="mb-2 text-xs font-medium text-neutral-400">{SYMBOL_CATEGORY_LABEL[category]}</h3>
          <div className="grid grid-cols-3 gap-2">
            {SYMBOL_LIBRARY.filter((s) => s.category === category).map((symbol) => (
              <div
                key={symbol.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(SYMBOL_DRAG_MIME, symbol.type);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                title={symbol.label}
                className="flex cursor-grab flex-col items-center gap-1 rounded border border-neutral-800 bg-neutral-900 p-2 text-neutral-300 hover:border-arei-500 hover:text-arei-400 active:cursor-grabbing"
              >
                <AreiSymbol type={symbol.type} size={24} />
                <span className="w-full truncate text-center text-[10px] leading-tight">{symbol.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
