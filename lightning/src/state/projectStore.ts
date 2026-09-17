import { create } from 'zustand';
import type { Board, Circuit, Project, ValidationIssue } from '@/types/project';
import { validateProject } from '@/utils/areiValidator';
import { countProjects, deleteProject as dbDeleteProject, getProject, listProjects, saveProject, type ProjectListItem, type ProjectSearchFilters } from '@/utils/db';
import { duplicateProject as duplicateProjectData, exportProjectToFile, importProjectFromFile } from '@/utils/lightningFile';
import { createEmptyProject } from '@/utils/factories';

const MAX_HISTORY = 50;

interface ProjectStore {
  projects: ProjectListItem[];
  activeProject: Project | null;
  validationIssues: ValidationIssue[];
  isLoading: boolean;
  isDirty: boolean;
  searchFilters: ProjectSearchFilters;
  /** Undo/redo-geschiedenis van het actieve project (in-memory, per sessie). */
  past: Project[];
  future: Project[];

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
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  activeProject: null,
  validationIssues: [],
  isLoading: false,
  isDirty: false,
  searchFilters: {},
  past: [],
  future: [],

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
    set({ activeProject: project, isLoading: false, isDirty: false, past: [], future: [] });
    get().runValidation();
  },

  closeProject: () => set({ activeProject: null, validationIssues: [], isDirty: false, past: [], future: [] }),

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
    const past = [...get().past, current].slice(-MAX_HISTORY);
    set({ activeProject: updated, isDirty: true, past, future: [] });
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

  undo: () => {
    const { past, activeProject } = get();
    if (past.length === 0 || !activeProject) return;
    const previous = past[past.length - 1];
    set({
      activeProject: previous,
      past: past.slice(0, -1),
      future: [activeProject, ...get().future].slice(0, MAX_HISTORY),
      isDirty: true,
    });
    get().runValidation();
  },

  redo: () => {
    const { future, activeProject } = get();
    if (future.length === 0 || !activeProject) return;
    const next = future[0];
    set({
      activeProject: next,
      future: future.slice(1),
      past: [...get().past, activeProject].slice(-MAX_HISTORY),
      isDirty: true,
    });
    get().runValidation();
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
