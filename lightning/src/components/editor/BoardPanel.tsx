import { Plus, PanelsTopLeft } from 'lucide-react';
import clsx from 'clsx';
import type { Board } from '@/types/project';

interface BoardPanelProps {
  boards: Board[];
  activeBoardId: string | null;
  onSelect: (id: string) => void;
  onAddBoard: () => void;
}

export function BoardPanel({ boards, activeBoardId, onSelect, onAddBoard }: BoardPanelProps) {
  return (
    <div className="w-52 shrink-0 border-r border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          <PanelsTopLeft className="h-3.5 w-3.5" />
          Borden
        </h2>
        <button onClick={onAddBoard} title="Bord toevoegen" className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-arei-400">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <ul className="space-y-1">
        {boards.map((board) => (
          <li key={board.id}>
            <button
              onClick={() => onSelect(board.id)}
              className={clsx(
                'w-full rounded px-2 py-1.5 text-left text-sm',
                board.id === activeBoardId ? 'bg-arei-500/20 text-arei-300' : 'text-neutral-300 hover:bg-neutral-900',
              )}
            >
              <div className="truncate font-medium">{board.name}</div>
              <div className="truncate text-xs text-neutral-500">
                {board.circuits.length} kring{board.circuits.length === 1 ? '' : 'en'}
                {board.isMainBoard && ' · hoofdbord'}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
