import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, Upload, Zap } from 'lucide-react';
import { useProjectStore } from '@/state/projectStore';
import { useLicenseContext } from '@/components/license/LicenseContext';
import { ProjectCard } from './ProjectCard';
import { ProjectSearchBar } from './ProjectSearchBar';
import { NewProjectModal } from './NewProjectModal';

export function Dashboard() {
  const navigate = useNavigate();
  const { license } = useLicenseContext();
  const projects = useProjectStore((s) => s.projects);
  const isLoading = useProjectStore((s) => s.isLoading);
  const loadProjectList = useProjectStore((s) => s.loadProjectList);
  const setSearchFilters = useProjectStore((s) => s.setSearchFilters);
  const createProject = useProjectStore((s) => s.createProject);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);
  const removeProject = useProjectStore((s) => s.removeProject);
  const importProject = useProjectStore((s) => s.importProject);
  const [showNewProject, setShowNewProject] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    void loadProjectList();
  }, [loadProjectList]);

  const handleCreate = async (name: string) => {
    const project = await createProject(name, license.maxProjects);
    setShowNewProject(false);
    if (!project) {
      setLimitReached(true);
      return;
    }
    navigate(`/editor/${project.id}`);
  };

  const handleExport = async (id: string) => {
    const { exportActiveProject, openProject } = useProjectStore.getState();
    await openProject(id);
    await exportActiveProject();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Dit project definitief verwijderen? Dit kan niet ongedaan gemaakt worden.')) {
      await removeProject(id);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-arei-500" />
          <h1 className="text-xl font-bold text-white">Lightning — Projecten</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void importProject()}
            className="flex items-center gap-1.5 rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:border-arei-500"
          >
            <Upload className="h-4 w-4" />
            Importeren
          </button>
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-1.5 rounded-md bg-arei-500 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-arei-400"
          >
            <FolderPlus className="h-4 w-4" />
            Nieuw project
          </button>
        </div>
      </header>

      {limitReached && (
        <div className="mb-4 rounded-md border border-arei-700 bg-arei-900/40 px-4 py-2 text-sm text-arei-200">
          Je hebt het maximum van {license.maxProjects} projecten in de proefversie bereikt. Activeer een licentie om
          onbeperkt projecten aan te maken.
        </div>
      )}

      <ProjectSearchBar onChange={(filters) => void setSearchFilters(filters)} />

      {isLoading ? (
        <div className="py-16 text-center text-neutral-500">Projecten laden…</div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-800 py-16 text-center text-neutral-500">
          <p className="mb-3">Nog geen projecten. Maak je eerste AREI-dossier aan.</p>
          <button onClick={() => setShowNewProject(true)} className="rounded-md bg-arei-500 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-arei-400">
            Nieuw project aanmaken
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={(id) => navigate(`/editor/${id}`)}
              onDuplicate={(id) => void duplicateProject(id)}
              onDelete={(id) => void handleDelete(id)}
              onExport={(id) => void handleExport(id)}
            />
          ))}
        </div>
      )}

      <NewProjectModal open={showNewProject} onClose={() => setShowNewProject(false)} onCreate={(name) => void handleCreate(name)} />
    </div>
  );
}
