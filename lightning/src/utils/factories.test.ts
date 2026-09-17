import { describe, expect, it } from 'vitest';
import { createBoard, createCircuit, createEmptyProject } from './factories';
import { duplicateProject } from './lightningFile';

describe('createEmptyProject', () => {
  it('creates a project with a single main board and no circuits', () => {
    const project = createEmptyProject('Mijn werf');
    expect(project.name).toBe('Mijn werf');
    expect(project.boards).toHaveLength(1);
    expect(project.boards[0].isMainBoard).toBe(true);
    expect(project.boards[0].circuits).toHaveLength(0);
    expect(project.status).toBe('concept');
  });
});

describe('createCircuit / createBoard', () => {
  it('creates a circuit with sensible AREI defaults', () => {
    const circuit = createCircuit('board-1', 'A');
    expect(circuit.boardId).toBe('board-1');
    expect(circuit.label).toBe('A');
    expect(circuit.breakerRatingA).toBe(16);
    expect(circuit.cable.sectionMm2).toBe(2.5);
  });

  it('creates a non-main board', () => {
    const board = createBoard('project-1', 'Bijbord garage');
    expect(board.isMainBoard).toBe(false);
    expect(board.projectId).toBe('project-1');
  });
});

describe('duplicateProject', () => {
  it('assigns new ids to the project, its boards and circuits', () => {
    const original = createEmptyProject('Origineel');
    const board = original.boards[0];
    board.circuits.push(createCircuit(board.id, 'A'));

    const copy = duplicateProject(original);

    expect(copy.id).not.toBe(original.id);
    expect(copy.boards[0].id).not.toBe(original.boards[0].id);
    expect(copy.boards[0].circuits[0].id).not.toBe(original.boards[0].circuits[0].id);
    expect(copy.boards[0].circuits[0].boardId).toBe(copy.boards[0].id);
    expect(copy.name).toBe('Origineel (kopie)');
    expect(copy.status).toBe('concept');
  });
});
