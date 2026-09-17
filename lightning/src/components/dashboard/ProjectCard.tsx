import { Copy, Trash2, FileDown, MapPin, User, Calendar, Zap } from 'lucide-react';
import clsx from 'clsx';
import type { ProjectListItem } from '@/utils/db';
import type { ProjectStatus } from '@/types/project';

interface ProjectCardProps {
  project: ProjectListItem;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  concept: 'Concept',
  in_uitvoering: 'In uitvoering',
  gekeurd: 'Gekeurd',
  afgekeurd: 'Afgekeurd',
  archief: 'Archief',
};

const STATUS_COLOR: Record<ProjectStatus, string> = {
  concept: 'bg-neutral-700 text-neutral-200',
  in_uitvoering: 'bg-blue-900 text-blue-200',
  gekeurd: 'bg-green-900 text-green-200',
  afgekeurd: 'bg-red-900 text-red-200',
  archief: 'bg-neutral-800 text-neutral-400',
};

export function ProjectCard({ project, onOpen, onDuplicate, onDelete, onExport }: ProjectCardProps) {
  return (
    <div className="group flex flex-col justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition hover:border-arei-500/60">
      <button onClick={() => onOpen(project.id)} className="mb-3 flex-1 text-left">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="truncate text-base font-semibold text-white">{project.name}</h3>
          <span className={clsx('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLOR[project.status])}>
            {STATUS_LABEL[project.status]}
          </span>
        </div>
        <div className="space-y-1 text-sm text-neutral-400">
          {project.clientName && (
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{project.clientName}</span>
            </div>
          )}
          {project.address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{project.address}</span>
            </div>
          )}
          {project.eanCode && (
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-mono text-xs">{project.eanCode}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{new Date(project.updatedAt).toLocaleDateString('nl-BE')}</span>
          </div>
        </div>
      </button>

      <div className="flex items-center justify-end gap-1 border-t border-neutral-800 pt-2 opacity-0 transition group-hover:opacity-100">
        <button
          title="Exporteren als .lightning"
          onClick={() => onExport(project.id)}
          className="rounded p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-arei-400"
        >
          <FileDown className="h-4 w-4" />
        </button>
        <button
          title="Dupliceren als sjabloon"
          onClick={() => onDuplicate(project.id)}
          className="rounded p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-arei-400"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          title="Verwijderen"
          onClick={() => onDelete(project.id)}
          className="rounded p-1.5 text-neutral-400 hover:bg-red-900/60 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
