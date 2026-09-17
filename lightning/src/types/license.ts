export type LicenseStatus = 'checking' | 'licensed' | 'trial' | 'invalid' | 'offline';

export interface LicenseState {
  status: LicenseStatus;
  key?: string;
  /** Aantal projecten toegestaan; 2 in trial-modus, onbeperkt (-1) bij geldige licentie */
  maxProjects: number;
  canExport: boolean;
  expiresAt?: string;
  lastCheckedAt?: string;
  message?: string;
}

export const TRIAL_PROJECT_LIMIT = 2;
