import { createContext, useContext } from 'react';
import type { LicenseState } from '@/types/license';

export interface LicenseContextValue {
  license: LicenseState;
  activate: (key: string) => Promise<void>;
  deactivate: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const LicenseContext = createContext<LicenseContextValue | null>(null);

export function useLicenseContext(): LicenseContextValue {
  const ctx = useContext(LicenseContext);
  if (!ctx) throw new Error('useLicenseContext moet binnen <LicenseGuard> gebruikt worden.');
  return ctx;
}
