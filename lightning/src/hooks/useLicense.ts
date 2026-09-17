import { useCallback, useEffect, useState } from 'react';
import { fetch } from '@tauri-apps/plugin-http';
import type { LicenseState } from '@/types/license';
import { TRIAL_PROJECT_LIMIT } from '@/types/license';

const LICENSE_STORAGE_KEY = 'lightning.licenseKey';
const LICENSE_API_URL = import.meta.env.VITE_LICENSE_API_URL ?? 'https://api.keygen.sh/v1/accounts/lightning/licenses/actions/validate-key';

const TRIAL_STATE: LicenseState = {
  status: 'trial',
  maxProjects: TRIAL_PROJECT_LIMIT,
  canExport: false,
  message: `Proefversie: maximaal ${TRIAL_PROJECT_LIMIT} projecten, export uitgeschakeld.`,
};

interface ValidateKeyResponse {
  meta: {
    valid: boolean;
    detail?: string;
  };
  data?: {
    attributes?: {
      expiry?: string;
    };
  };
}

async function validateKeyRemote(key: string): Promise<LicenseState> {
  try {
    const response = await fetch(LICENSE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/vnd.api+json' },
      body: JSON.stringify({ meta: { key } }),
    });

    if (!response.ok) {
      return { ...TRIAL_STATE, status: 'offline', message: 'Kon licentieserver niet bereiken, proefmodus actief.' };
    }

    const payload = (await response.json()) as ValidateKeyResponse;

    if (payload.meta.valid) {
      return {
        status: 'licensed',
        key,
        maxProjects: -1,
        canExport: true,
        expiresAt: payload.data?.attributes?.expiry,
        lastCheckedAt: new Date().toISOString(),
      };
    }

    return {
      status: 'invalid',
      key,
      maxProjects: TRIAL_PROJECT_LIMIT,
      canExport: false,
      message: payload.meta.detail ?? 'Ongeldige licentiesleutel.',
      lastCheckedAt: new Date().toISOString(),
    };
  } catch {
    return { ...TRIAL_STATE, status: 'offline', message: 'Geen internetverbinding, proefmodus actief.' };
  }
}

/**
 * Beheert de licentiestatus van de applicatie. Bij ontstentenis van een
 * geldige licentie wordt de proefmodus toegepast: export geblokkeerd en
 * maximaal TRIAL_PROJECT_LIMIT opgeslagen projecten.
 */
export function useLicense() {
  const [license, setLicense] = useState<LicenseState>({ status: 'checking', maxProjects: TRIAL_PROJECT_LIMIT, canExport: false });

  const checkLicense = useCallback(async (key?: string) => {
    const storedKey = key ?? localStorage.getItem(LICENSE_STORAGE_KEY) ?? undefined;
    if (!storedKey) {
      setLicense(TRIAL_STATE);
      return;
    }
    setLicense((prev) => ({ ...prev, status: 'checking' }));
    const result = await validateKeyRemote(storedKey);
    setLicense(result);
  }, []);

  const activate = useCallback(
    async (key: string) => {
      localStorage.setItem(LICENSE_STORAGE_KEY, key);
      await checkLicense(key);
    },
    [checkLicense],
  );

  const deactivate = useCallback(() => {
    localStorage.removeItem(LICENSE_STORAGE_KEY);
    setLicense(TRIAL_STATE);
  }, []);

  useEffect(() => {
    void checkLicense();
  }, [checkLicense]);

  return { license, activate, deactivate, refresh: checkLicense };
}
