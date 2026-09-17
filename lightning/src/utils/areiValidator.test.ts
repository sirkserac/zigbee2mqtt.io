import { describe, expect, it } from 'vitest';
import { validateProject } from './areiValidator';
import { createBoard, createCircuit, createEmptyProject } from './factories';
import type { Project } from '@/types/project';

function projectWithCircuitPatch(patch: Partial<ReturnType<typeof createCircuit>>): Project {
  const project = createEmptyProject('Testproject');
  const board = project.boards[0];
  board.mainBreakerRatingA = 40;
  board.differentials = [{ id: 'd1', type: 'AC', ratingMa: 300, protectedCircuitIds: [] }];
  const circuit = { ...createCircuit(board.id, 'A'), ...patch };
  board.circuits = [circuit];
  return project;
}

describe('validateProject', () => {
  it('reports no issues for a compliant standard socket circuit', () => {
    const project = projectWithCircuitPatch({
      type: 'stopcontact',
      breakerRatingA: 16,
      cable: { sectionMm2: 2.5, type: 'VOB', cores: 3 },
      differentialType: 'AC',
      differentialRatingMa: 30,
      differentialSwitchId: 'd1',
      outletCount: 6,
    });

    const issues = validateProject(project);
    expect(issues).toHaveLength(0);
  });

  it('flags more than 8 outlets on one circuit (MAX_OUTLETS_PER_CIRCUIT)', () => {
    const project = projectWithCircuitPatch({
      type: 'stopcontact',
      outletCount: 9,
      differentialSwitchId: 'd1',
    });

    const issues = validateProject(project);
    expect(issues.some((i) => i.ruleId === 'MAX_OUTLETS_PER_CIRCUIT')).toBe(true);
  });

  it('flags a breaker that is too heavy for the cable section', () => {
    const project = projectWithCircuitPatch({
      type: 'algemeen',
      breakerRatingA: 32,
      cable: { sectionMm2: 1.5, type: 'VOB', cores: 3 },
      differentialSwitchId: 'd1',
    });

    const issues = validateProject(project);
    expect(issues.some((i) => i.ruleId === 'CABLE_SECTION_VS_BREAKER' && i.severity === 'error')).toBe(true);
  });

  it('requires a 30mA RCD on bathroom sockets', () => {
    const project = projectWithCircuitPatch({
      type: 'stopcontact_badkamer',
      differentialType: 'geen',
      differentialSwitchId: 'd1',
    });

    const issues = validateProject(project);
    expect(issues.some((i) => i.ruleId === 'RCD_30MA_WET_ROOMS')).toBe(true);
  });

  it('accepts a washing machine circuit protected by a 30mA Type A RCD', () => {
    const project = projectWithCircuitPatch({
      type: 'wasmachine',
      differentialType: 'A',
      differentialRatingMa: 30,
      differentialSwitchId: 'd1',
    });

    const issues = validateProject(project);
    expect(issues.some((i) => i.ruleId === 'RCD_APPLIANCE_REQUIRED')).toBe(false);
  });

  it('flags a circuit breaker rated above the board main breaker', () => {
    const project = projectWithCircuitPatch({
      breakerRatingA: 63,
      cable: { sectionMm2: 16, type: 'VOB', cores: 3 },
      differentialSwitchId: 'd1',
    });
    project.boards[0].mainBreakerRatingA = 40;

    const issues = validateProject(project);
    expect(issues.some((i) => i.ruleId === 'MAIN_BREAKER_SELECTIVITY')).toBe(true);
  });

  it('requires a general 300mA RCD on the main board', () => {
    const project = projectWithCircuitPatch({ differentialSwitchId: 'd1' });
    project.boards[0].differentials = [];

    const issues = validateProject(project);
    expect(issues.some((i) => i.ruleId === 'GENERAL_RCD_100PCT_COVERAGE')).toBe(true);
  });

  it('adds a second board without affecting the first board validation', () => {
    const project = projectWithCircuitPatch({ differentialSwitchId: 'd1' });
    const extraBoard = createBoard(project.id, 'Bord 2');
    project.boards.push(extraBoard);

    const issues = validateProject(project);
    expect(issues.some((i) => i.boardId === extraBoard.id)).toBe(false);
  });
});
