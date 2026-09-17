import { ArrowLeft, FileDown, Save, LayoutGrid, MapPin, Lock } from 'lucide-react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useLicenseContext } from '@/components/license/LicenseContext';

export type EditorTab = 'schema' | 'situatie';

interface ToolbarProps {
  projectName: string;
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  isDirty: boolean;
  onSave: () => void;
  onExportPdf: () => void;
}

export function Toolbar({ projectName, activeTab, onTabChange, isDirty, onSave, onExportPdf }: ToolbarProps) {
  const navigate = useNavigate();
  const { license } = useLicenseContext();

  return (
    <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-3 py-2">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="truncate text-sm font-semibold text-white">{projectName}</h1>
        <span className="text-xs text-neutral-500">{isDirty ? 'Niet opgeslagen wijzigingen…' : 'Opgeslagen'}</span>
      </div>

      <div className="flex items-center gap-1 rounded-md bg-neutral-900 p-1">
        <TabButton icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Eendraadsschema" active={activeTab === 'schema'} onClick={() => onTabChange('schema')} />
        <TabButton icon={<MapPin className="h-3.5 w-3.5" />} label="Situatieschema" active={activeTab === 'situatie'} onClick={() => onTabChange('situatie')} />
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onSave} className="flex items-center gap-1.5 rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-arei-500">
          <Save className="h-3.5 w-3.5" />
          Opslaan
        </button>
        <button
          onClick={onExportPdf}
          disabled={!license.canExport}
          title={!license.canExport ? 'Activeer een licentie om te exporteren' : undefined}
          className="flex items-center gap-1.5 rounded-md bg-arei-500 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-arei-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {license.canExport ? <FileDown className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          PDF exporteren
        </button>
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium',
        active ? 'bg-arei-500 text-neutral-900' : 'text-neutral-400 hover:text-white',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
