import { useCallback, useEffect, useState } from 'react';
import { fetch } from '@tauri-apps/plugin-http';
import { invoke } from '@tauri-apps/api/core';
import type { LicenseState } from '@/types/license';
import { TRIAL_PROJECT_LIMIT } from '@/types/license';

/**
 * Licentievalidatie via de Lemon Squeezy License API — gratis te gebruiken
 * (geen abonnement, enkel een transactiekost bij verkoop via hun platform).
 * Zie https://docs.lemonsqueezy.com/help/licensing/license-api voor de
 * volledige documentatie. Aanmaken van een gratis account + "license key"
 * product volstaat om zelf sleutels te genereren en te testen.
 */
const LICENSE_KEY_STORAGE = 'lightning.licenseKey';
const INSTANCE_ID_STORAGE = 'lightning.licenseInstanceId';
const LICENSE_API_BASE = import.meta.env.VITE_LICENSE_API_URL ?? 'https://api.lemonsqueezy.com/v1/licenses';

const TRIAL_STATE: LicenseState = {
  status: 'trial',
  maxProjects: TRIAL_PROJECT_LIMIT,
  canExport: false,
  message: `Proefversie: maximaal ${TRIAL_PROJECT_LIMIT} projecten, export uitgeschakeld.`,
};

interface LemonSqueezyLicenseResponse {
  valid: boolean;
  error: string | null;
  license_key?: {
    status: 'inactive' | 'active' | 'expired' | 'disabled';
    key: string;
    activation_limit: number;
    activation_usage: number;
    expires_at: string | null;
  };
  instance?: { id: string; name: string } | null;
}

async function postLicenseApi(action: 'activate' | 'validate' | 'deactivate', params: Record<string, string>): Promise<LemonSqueezyLicenseResponse | null> {
  try {
    const response = await fetch(`${LICENSE_API_BASE}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams(params).toString(),
    });
    return (await response.json()) as LemonSqueezyLicenseResponse;
  } catch {
    return null;
  }
}

async function getInstanceName(): Promise<string> {
  try {
    return await invoke<string>('get_machine_fingerprint');
  } catch {
    return 'lightning-desktop';
  }
}

async function activateRemote(key: string): Promise<LicenseState> {
  const instanceName = await getInstanceName();
  const result = await postLicenseApi('activate', { license_key: key, instance_name: instanceName });

  if (!result) {
    return { ...TRIAL_STATE, status: 'offline', message: 'Geen internetverbinding, proefmodus actief.' };
  }
  if (!result.valid || !result.instance) {
    return {
      status: 'invalid',
      key,
      maxProjects: TRIAL_PROJECT_LIMIT,
      canExport: false,
      message: result.error ?? 'Ongeldige licentiesleutel.',
      lastCheckedAt: new Date().toISOString(),
    };
  }

  localStorage.setItem(INSTANCE_ID_STORAGE, result.instance.id);
  return {
    status: 'licensed',
    key,
    maxProjects: -1,
    canExport: true,
    expiresAt: result.license_key?.expires_at ?? undefined,
    lastCheckedAt: new Date().toISOString(),
  };
}

async function validateRemote(key: string, instanceId: string): Promise<LicenseState> {
  const result = await postLicenseApi('validate', { license_key: key, instance_id: instanceId });

  if (!result) {
    return { ...TRIAL_STATE, status: 'offline', message: 'Kon licentieserver niet bereiken, proefmodus actief.' };
  }
  if (!result.valid) {
    return {
      status: 'invalid',
      key,
      maxProjects: TRIAL_PROJECT_LIMIT,
      canExport: false,
      message: result.error ?? 'Licentie is niet langer geldig op dit toestel.',
      lastCheckedAt: new Date().toISOString(),
    };
  }

  return {
    status: 'licensed',
    key,
    maxProjects: -1,
    canExport: true,
    expiresAt: result.license_key?.expires_at ?? undefined,
    lastCheckedAt: new Date().toISOString(),
  };
}

/**
 * Beheert de licentiestatus van de applicatie. Bij ontstentenis van een
 * geldige licentie wordt de proefmodus toegepast: export geblokkeerd en
 * maximaal TRIAL_PROJECT_LIMIT opgeslagen projecten.
 */
export function useLicense() {
  const [license, setLicense] = useState<LicenseState>({ status: 'checking', maxProjects: TRIAL_PROJECT_LIMIT, canExport: false });

  const checkLicense = useCallback(async () => {
    const storedKey = localStorage.getItem(LICENSE_KEY_STORAGE);
    const storedInstanceId = localStorage.getItem(INSTANCE_ID_STORAGE);
    if (!storedKey || !storedInstanceId) {
      setLicense(TRIAL_STATE);
      return;
    }
    setLicense((prev) => ({ ...prev, status: 'checking' }));
    setLicense(await validateRemote(storedKey, storedInstanceId));
  }, []);

  const activate = useCallback(async (key: string) => {
    setLicense((prev) => ({ ...prev, status: 'checking' }));
    const result = await activateRemote(key);
    if (result.status === 'licensed') {
      localStorage.setItem(LICENSE_KEY_STORAGE, key);
    }
    setLicense(result);
  }, []);

  const deactivate = useCallback(async () => {
    const key = localStorage.getItem(LICENSE_KEY_STORAGE);
    const instanceId = localStorage.getItem(INSTANCE_ID_STORAGE);
    if (key && instanceId) {
      await postLicenseApi('deactivate', { license_key: key, instance_id: instanceId });
    }
    localStorage.removeItem(LICENSE_KEY_STORAGE);
    localStorage.removeItem(INSTANCE_ID_STORAGE);
    setLicense(TRIAL_STATE);
  }, []);

  useEffect(() => {
    void checkLicense();
  }, [checkLicense]);

  return { license, activate, deactivate, refresh: checkLicense };
}
