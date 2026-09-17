import { useState } from 'react';

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function NewProjectModal({ open, onClose, onCreate }: NewProjectModalProps) {
  const [name, setName] = useState('');

  if (!open) return null;

  const submit = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName('');
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg bg-neutral-900 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-white">Nieuw project</h2>
        <label className="mb-1 block text-sm text-neutral-400">Projectnaam / werf</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="bv. Verkaveling De Bruyne – Lot 4"
          className="mb-4 w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-arei-500"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded px-3 py-1.5 text-sm text-neutral-400 hover:text-white">
            Annuleren
          </button>
          <button onClick={submit} className="rounded bg-arei-500 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-arei-400">
            Aanmaken
          </button>
        </div>
      </div>
    </div>
  );
}
