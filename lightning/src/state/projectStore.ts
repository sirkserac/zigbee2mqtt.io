import { create } from 'zustand';
import type { Board, Circuit, Project, ValidationIssue } from '@/types/project';
import { validateProject } from '@/utils/areiValidator';
import { countProjects, deleteProject as dbDeleteProject, getProject, listProjects, saveProject, type ProjectListItem, type ProjectSearchFilters } from '@/utils/db';
import { duplicateProject as duplicateProjectData, exportProjectToFile, importProjectFromFile } from '@/utils/lightningFile';
import { createEmptyProject } from '@/utils/factories';

interface ProjectStore {
  projects: ProjectListItem[];
  activeProject: Project | null;
  validationIssues: ValidationIssue[];
  isLoading: boolean;
  isDirty: boolean;
  searchFilters: ProjectSearchFilters;

  loadProjectList: () => Promise<void>;
  setSearchFilters: (filters: ProjectSearchFilters) => Promise<void>;
  openProject: (id: string) => Promise<void>;
  closeProject: () => void;
  createProject: (name: string, projectLimit: number) => Promise<Project | null>;
  duplicateProject: (id: string) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  importProject: () => Promise<void>;
  exportActiveProject: () => Promise<string | null>;
  updateActiveProject: (updater: (project: Project) => Project) => void;
  updateBoard: (boardId: string, updater: (board: Board) => Board) => void;
  updateCircuit: (boardId: string, circuitId: string, updater: (circuit: Circuit) => Circuit) => void;
  persistActiveProject: () => Promise<void>;
  runValidation: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  activeProject: null,
  validationIssues: [],
  isLoading: false,
  isDirty: false,
  searchFilters: {},

  loadProjectList: async () => {
    set({ isLoading: true });
    const projects = await listProjects(get().searchFilters);
    set({ projects, isLoading: false });
  },

  setSearchFilters: async (filters) => {
    set({ searchFilters: filters });
    await get().loadProjectList();
  },

  openProject: async (id) => {
    set({ isLoading: true });
    const project = await getProject(id);
    set({ activeProject: project, isLoading: false, isDirty: false });
    get().runValidation();
  },

  closeProject: () => set({ activeProject: null, validationIssues: [], isDirty: false }),

  createProject: async (name, projectLimit) => {
    const existingCount = await countProjects();
    if (projectLimit !== -1 && existingCount >= projectLimit) {
      return null;
    }
    const project = createEmptyProject(name);
    await saveProject(project);
    await get().loadProjectList();
    set({ activeProject: project, isDirty: false });
    return project;
  },

  duplicateProject: async (id) => {
    const original = await getProject(id);
    if (!original) return;
    const copy = duplicateProjectData(original);
    await saveProject(copy);
    await get().loadProjectList();
  },

  removeProject: async (id) => {
    await dbDeleteProject(id);
    if (get().activeProject?.id === id) {
      set({ activeProject: null });
    }
    await get().loadProjectList();
  },

  importProject: async () => {
    const imported = await importProjectFromFile();
    if (!imported) return;
    await saveProject(imported);
    await get().loadProjectList();
  },

  exportActiveProject: async () => {
    const project = get().activeProject;
    if (!project) return null;
    return exportProjectToFile(project);
  },

  updateActiveProject: (updater) => {
    const current = get().activeProject;
    if (!current) return;
    const updated = updater({ ...current, updatedAt: new Date().toISOString() });
    set({ activeProject: updated, isDirty: true });
    get().runValidation();
  },

  updateBoard: (boardId, updater) => {
    get().updateActiveProject((project) => ({
      ...project,
      boards: project.boards.map((board) => (board.id === boardId ? updater(board) : board)),
    }));
  },

  updateCircuit: (boardId, circuitId, updater) => {
    get().updateActiveProject((project) => ({
      ...project,
      boards: project.boards.map((board) =>
        board.id !== boardId
          ? board
          : {
              ...board,
              circuits: board.circuits.map((circuit) => (circuit.id === circuitId ? updater(circuit) : circuit)),
            },
      ),
    }));
  },

  persistActiveProject: async () => {
    const project = get().activeProject;
    if (!project) return;
    await saveProject(project);
    set({ isDirty: false });
    await get().loadProjectList();
  },

  runValidation: () => {
    const project = get().activeProject;
    set({ validationIssues: project ? validateProject(project) : [] });
  },
}));
