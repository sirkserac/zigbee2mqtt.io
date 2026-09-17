import areiRules from '@/config/arei-rules-2026.json';
import type { Board, Circuit, CircuitType, DifferentialType, Project, ValidationIssue } from '@/types/project';

interface CircuitTypeDefault {
  minCableSectionMm2: number;
  maxBreakerA: number;
  maxOutlets: number;
  requiredDifferentialType?: DifferentialType;
  requiredDifferentialMaxMa?: number;
  note?: string;
}

interface CableSectionRow {
  sectionMm2: number;
  maxBreakerA: number;
}

const rules = areiRules as {
  version: string;
  cableSectionToBreaker: { table: CableSectionRow[] };
  circuitTypeDefaults: Record<CircuitType, CircuitTypeDefault>;
};

const RCD_LEVELS: DifferentialType[] = ['geen', 'AC', 'A', 'F', 'B'];

/** Type B dekt ook wat A dekt, A dekt ook wat AC dekt, enz. */
function differentialSatisfies(actual: DifferentialType, required: DifferentialType): boolean {
  if (required === 'geen') return true;
  if (actual === 'geen') return false;
  return RCD_LEVELS.indexOf(actual) >= RCD_LEVELS.indexOf(required);
}

function maxBreakerForSection(sectionMm2: number): number | undefined {
  const sorted = [...rules.cableSectionToBreaker.table].sort((a, b) => a.sectionMm2 - b.sectionMm2);
  const row = sorted.find((r) => r.sectionMm2 === sectionMm2);
  if (row) return row.maxBreakerA;
  // Interpoleer conservatief naar de eerstvolgende kleinere sectie in de tabel.
  const lower = [...sorted].reverse().find((r) => r.sectionMm2 < sectionMm2);
  return lower?.maxBreakerA;
}

function validateCircuit(circuit: Circuit, board: Board, issues: ValidationIssue[]): void {
  const defaults = rules.circuitTypeDefaults[circuit.type];

  if (defaults && circuit.outletCount > defaults.maxOutlets) {
    issues.push({
      ruleId: 'MAX_OUTLETS_PER_CIRCUIT',
      severity: 'error',
      message: `Kring ${circuit.label} (${circuit.name}) heeft ${circuit.outletCount} aansluitpunten, max. ${defaults.maxOutlets} toegelaten.`,
      boardId: board.id,
      circuitId: circuit.id,
    });
  }

  const maxBreaker = maxBreakerForSection(circuit.cable.sectionMm2);
  if (maxBreaker !== undefined && circuit.breakerRatingA > maxBreaker) {
    issues.push({
      ruleId: 'CABLE_SECTION_VS_BREAKER',
      severity: 'error',
      message: `Kring ${circuit.label}: automaat ${circuit.breakerRatingA}A is te zwaar voor kabelsectie ${circuit.cable.sectionMm2}mm² (max. ${maxBreaker}A).`,
      boardId: board.id,
      circuitId: circuit.id,
    });
  }

  if (defaults && circuit.cable.sectionMm2 < defaults.minCableSectionMm2) {
    issues.push({
      ruleId: 'CABLE_SECTION_VS_BREAKER',
      severity: 'warning',
      message: `Kring ${circuit.label}: kabelsectie ${circuit.cable.sectionMm2}mm² is kleiner dan de aanbevolen minimumsectie ${defaults.minCableSectionMm2}mm² voor ${circuit.type}.`,
      boardId: board.id,
      circuitId: circuit.id,
    });
  }

  if (circuit.breakerRatingA > board.mainBreakerRatingA) {
    issues.push({
      ruleId: 'MAIN_BREAKER_SELECTIVITY',
      severity: 'error',
      message: `Kring ${circuit.label} (${circuit.breakerRatingA}A) overschrijdt de hoofdautomaat van bord ${board.name} (${board.mainBreakerRatingA}A).`,
      boardId: board.id,
      circuitId: circuit.id,
    });
  }

  if (defaults?.requiredDifferentialType) {
    const requiredType = defaults.requiredDifferentialType;
    const ruleId =
      circuit.type === 'stopcontact_badkamer' || circuit.type === 'tuinstopcontact' || circuit.type === 'sauna'
        ? 'RCD_30MA_WET_ROOMS'
        : circuit.type === 'ev_laadpaal'
          ? 'RCD_TYPE_B_DC_SOURCES'
          : 'RCD_APPLIANCE_REQUIRED';

    const satisfiesType = differentialSatisfies(circuit.differentialType, requiredType);
    const satisfiesRating =
      defaults.requiredDifferentialMaxMa === undefined ||
      (circuit.differentialRatingMa !== undefined && circuit.differentialRatingMa <= defaults.requiredDifferentialMaxMa);

    if (!satisfiesType || !satisfiesRating) {
      issues.push({
        ruleId,
        severity: ruleId === 'RCD_TYPE_B_DC_SOURCES' ? 'warning' : 'error',
        message: `Kring ${circuit.label} (${circuit.type}) vereist minstens Type ${requiredType} differentieel${
          defaults.requiredDifferentialMaxMa ? ` van max. ${defaults.requiredDifferentialMaxMa}mA` : ''
        }, huidige instelling: ${circuit.differentialType}${circuit.differentialRatingMa ? ` ${circuit.differentialRatingMa}mA` : ''}.`,
        boardId: board.id,
        circuitId: circuit.id,
      });
    }
  }

  if (!circuit.differentialSwitchId && circuit.differentialType === 'geen') {
    issues.push({
      ruleId: 'DIFFERENTIAL_COVERAGE',
      severity: 'warning',
      message: `Kring ${circuit.label} is niet gekoppeld aan een differentieelschakelaar.`,
      boardId: board.id,
      circuitId: circuit.id,
    });
  }

  if (circuit.type === 'kookplaat') {
    const otherCircuitsOnSameLoad = board.circuits.filter(
      (c) => c.id !== circuit.id && c.type === 'kookplaat',
    );
    if (otherCircuitsOnSameLoad.length > 0) {
      issues.push({
        ruleId: 'SPECIAL_LOCATION_KITCHEN_HOB',
        severity: 'info',
        message: `Meerdere kookplaat-kringen gevonden op bord ${board.name}; controleer of elk toestel een eigen kring heeft.`,
        boardId: board.id,
        circuitId: circuit.id,
      });
    }
  }
}

function validateBoard(board: Board, issues: ValidationIssue[]): void {
  board.circuits.forEach((circuit) => validateCircuit(circuit, board, issues));

  const hasGeneral300mA = board.differentials.some((d) => d.type !== 'geen' && d.ratingMa <= 300);
  if (board.isMainBoard && !hasGeneral300mA) {
    issues.push({
      ruleId: 'GENERAL_RCD_100PCT_COVERAGE',
      severity: 'error',
      message: `Bord ${board.name} heeft geen algemene differentieelschakelaar (max. 300mA) die alle kringen dekt.`,
      boardId: board.id,
    });
  }
}

/**
 * Voert een volledige AREI-controle uit op het geopende project en geeft
 * een lijst van issues terug, gesorteerd op ernst (error > warning > info).
 */
export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  project.boards.forEach((board) => validateBoard(board, issues));

  const severityOrder: Record<ValidationIssue['severity'], number> = { error: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export function validateCircuitStandalone(circuit: Circuit, board: Board): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  validateCircuit(circuit, board, issues);
  return issues;
}

export function getAreiRulesVersion(): string {
  return rules.version;
}
