import { v4 as uuidv4 } from 'uuid';
import type { Board, Circuit, Project } from '@/types/project';
import { CURRENT_SCHEMA_VERSION } from '@/types/project';

export function createEmptyProject(name = 'Nieuw project'): Project {
  const now = new Date().toISOString();
  const projectId = uuidv4();

  const mainBoard: Board = {
    id: uuidv4(),
    projectId,
    name: 'Hoofdbord',
    location: 'Technische ruimte',
    isMainBoard: true,
    mainBreakerRatingA: 40,
    shortCircuitCapacityKa: 6,
    differentials: [],
    circuits: [],
  };

  return {
    id: projectId,
    name,
    clientName: '',
    address: '',
    postalCode: '',
    city: '',
    status: 'concept',
    createdAt: now,
    updatedAt: now,
    boards: [mainBoard],
    situationPlans: [],
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

export function createCircuit(boardId: string, label: string): Circuit {
  return {
    id: uuidv4(),
    boardId,
    label,
    name: 'Nieuwe kring',
    type: 'stopcontact',
    breakerRatingA: 16,
    breakerCurve: 'C',
    cable: { sectionMm2: 2.5, type: 'VOB', cores: 3 },
    differentialType: 'geen',
    outletCount: 1,
  };
}

export function createBoard(projectId: string, name: string): Board {
  return {
    id: uuidv4(),
    projectId,
    name,
    location: '',
    isMainBoard: false,
    mainBreakerRatingA: 40,
    shortCircuitCapacityKa: 6,
    differentials: [],
    circuits: [],
  };
}
