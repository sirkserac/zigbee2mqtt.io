import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { v4 as uuidv4 } from 'uuid';
import type { Project } from '@/types/project';
import { CURRENT_SCHEMA_VERSION, LIGHTNING_FILE_EXTENSION } from '@/types/project';

interface LightningFileEnvelope {
  format: 'lightning-project';
  schemaVersion: number;
  exportedAt: string;
  project: Project;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'project';
}

/**
 * Exporteert een project naar een .lightning-bestand zodat het gedeeld kan
 * worden met collega's (bv. via e-mail of een gedeelde schijf).
 */
export async function exportProjectToFile(project: Project): Promise<string | null> {
  const envelope: LightningFileEnvelope = {
    format: 'lightning-project',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    project,
  };

  const targetPath = await save({
    defaultPath: `${sanitizeFileName(project.name)}${LIGHTNING_FILE_EXTENSION}`,
    filters: [{ name: 'Lightning project', extensions: ['lightning'] }],
  });

  if (!targetPath) return null;
  await writeTextFile(targetPath, JSON.stringify(envelope, null, 2));
  return targetPath;
}

/**
 * Importeert een .lightning-bestand. Kent het project altijd een nieuw ID
 * toe zodat import nooit een bestaand project in de databank overschrijft;
 * gebruikers die willen bijwerken, doen dat expliciet via "vervangen".
 */
export async function importProjectFromFile(): Promise<Project | null> {
  const selected = await open({
    multiple: false,
    filters: [{ name: 'Lightning project', extensions: ['lightning'] }],
  });

  if (!selected || Array.isArray(selected)) return null;

  const raw = await readTextFile(selected);
  const envelope = JSON.parse(raw) as LightningFileEnvelope;

  if (envelope.format !== 'lightning-project') {
    throw new Error('Ongeldig .lightning-bestand: onbekend formaat.');
  }

  return {
    ...envelope.project,
    id: uuidv4(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Maakt een kopie van een project (als sjabloon), met nieuw ID en naam.
 */
export function duplicateProject(project: Project, newName?: string): Project {
  const now = new Date().toISOString();
  const idMap = new Map<string, string>();

  const boards = project.boards.map((board) => {
    const newBoardId = uuidv4();
    idMap.set(board.id, newBoardId);
    const circuits = board.circuits.map((circuit) => {
      const newCircuitId = uuidv4();
      idMap.set(circuit.id, newCircuitId);
      return { ...circuit, id: newCircuitId, boardId: newBoardId };
    });
    return {
      ...board,
      id: newBoardId,
      projectId: '',
      circuits,
      differentials: board.differentials.map((d) => ({
        ...d,
        id: uuidv4(),
        protectedCircuitIds: d.protectedCircuitIds.map((cid) => idMap.get(cid) ?? cid),
      })),
    };
  });

  const newId = uuidv4();
  return {
    ...project,
    id: newId,
    name: newName ?? `${project.name} (kopie)`,
    status: 'concept',
    createdAt: now,
    updatedAt: now,
    boards: boards.map((b) => ({ ...b, projectId: newId })),
    situationPlans: project.situationPlans.map((plan) => ({
      ...plan,
      id: uuidv4(),
      projectId: newId,
      symbols: plan.symbols.map((s) => ({ ...s, id: uuidv4() })),
    })),
  };
}
