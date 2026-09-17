/**
 * Kern-datamodellen voor Lightning.
 * Eén Project komt overeen met één AREI-dossier/werf.
 */

export type CircuitType =
  | 'verlichting'
  | 'stopcontact'
  | 'stopcontact_badkamer'
  | 'wasmachine'
  | 'droogkast'
  | 'vaatwasser'
  | 'kookplaat'
  | 'oven'
  | 'boiler_elektrisch'
  | 'warmtepomp'
  | 'ev_laadpaal'
  | 'pv_omvormer'
  | 'thuisbatterij'
  | 'airco'
  | 'sauna'
  | 'tuinstopcontact'
  | 'algemeen';

export type DifferentialType = 'geen' | 'AC' | 'A' | 'F' | 'B';

export type CableType = 'XVB' | 'VOB' | 'VFVB' | 'H07RN-F' | 'YMVK';

export interface Cable {
  /** Doorsnede in mm² (bv. 1.5, 2.5, 6, 10) */
  sectionMm2: number;
  type: CableType;
  /** Lengte van de kring in meter, voor spanningsvalberekening */
  lengthM?: number;
  cores: number;
}

export interface DifferentialSwitch {
  id: string;
  type: DifferentialType;
  /** Nominale lekstroom in mA, bv. 30, 100, 300 */
  ratingMa: number;
  /** Aantal kringen dat door deze differentieel beschermd wordt */
  protectedCircuitIds: string[];
}

export interface Circuit {
  id: string;
  boardId: string;
  /** Kringlabel zoals getoond op het schema, bv. "A1", "B3" */
  label: string;
  name: string;
  type: CircuitType;
  /** Nominale stroom van de beveiligingsautomaat in A (bv. 10, 16, 20, 32) */
  breakerRatingA: number;
  breakerCurve: 'B' | 'C' | 'D';
  cable: Cable;
  differentialType: DifferentialType;
  differentialRatingMa?: number;
  /** Gekoppelde differentieelschakelaar, indien gedeeld met andere kringen */
  differentialSwitchId?: string;
  maxOutlets?: number;
  outletCount: number;
  /** Positie van de kringtekening op het eendraadsschema (canvas-coördinaten) */
  position?: { x: number; y: number };
  notes?: string;
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  location: string;
  /** true voor de hoofdbord (algemeen verdeelbord) */
  isMainBoard: boolean;
  parentBoardId?: string;
  mainBreakerRatingA: number;
  shortCircuitCapacityKa: number;
  differentials: DifferentialSwitch[];
  circuits: Circuit[];
  position?: { x: number; y: number };
}

export type SymbolType =
  | 'stopcontact'
  | 'stopcontact_geaard'
  | 'schakelaar_enkelpolig'
  | 'schakelaar_wissel'
  | 'schakelaar_kruis'
  | 'drukknop'
  | 'lichtpunt'
  | 'rookmelder'
  | 'verdeelbord'
  | 'pv_omvormer'
  | 'thuisbatterij'
  | 'ev_laadpaal'
  | 'warmtepomp'
  | 'automaat'
  | 'differentieel'
  | 'aardingsklem'
  | 'data_aansluiting'
  | 'tv_aansluiting';

export interface SymbolInstance {
  id: string;
  type: SymbolType;
  x: number;
  y: number;
  rotation: number;
  circuitId?: string;
  boardId?: string;
  label?: string;
  scale?: number;
}

export interface SituationPlan {
  id: string;
  projectId: string;
  name: string;
  /** Achtergrond-plattegrond, base64 of relatief pad binnen het .lightning-bestand */
  backgroundImage?: string;
  backgroundScale?: number;
  symbols: SymbolInstance[];
}

export type ProjectStatus = 'concept' | 'in_uitvoering' | 'gekeurd' | 'afgekeurd' | 'archief';

export interface Project {
  id: string;
  name: string;
  clientName: string;
  address: string;
  postalCode: string;
  city: string;
  eanCode?: string;
  installerName?: string;
  installerRegistrationNumber?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  inspectionDate?: string;
  boards: Board[];
  situationPlans: SituationPlan[];
  notes?: string;
  thumbnail?: string;
  /** Bestandsformaat-versie, voor migraties van .lightning-bestanden */
  schemaVersion: number;
}

export interface ValidationIssue {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  boardId?: string;
  circuitId?: string;
}

export const LIGHTNING_FILE_EXTENSION = '.lightning';
export const CURRENT_SCHEMA_VERSION = 1;
