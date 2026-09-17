import { type ReactNode, useState } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, WifiOff } from 'lucide-react';
import { useLicense } from '@/hooks/useLicense';
import { LicenseContext } from './LicenseContext';

interface LicenseGuardProps {
  children: ReactNode;
}

/**
 * Controleert de licentiesleutel bij het opstarten en stelt de licentiestatus
 * via context beschikbaar aan de rest van de applicatie. Blokkeert de UI niet
 * volledig (proefmodus blijft bruikbaar), maar activeert de beperkingen:
 * max. 2 projecten en geen export zonder geldige licentie.
 */
export function LicenseGuard({ children }: LicenseGuardProps) {
  const { license, activate, deactivate, refresh } = useLicense();
  const [keyInput, setKeyInput] = useState('');
  const [activating, setActivating] = useState(false);
  const [showActivation, setShowActivation] = useState(false);

  const handleActivate = async () => {
    if (!keyInput.trim()) return;
    setActivating(true);
    await activate(keyInput.trim());
    setActivating(false);
  };

  if (license.status === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-neutral-300">
        <div className="animate-pulse text-sm">Licentie controleren…</div>
      </div>
    );
  }

  return (
    <LicenseContext.Provider value={{ license, activate, deactivate, refresh }}>
      {(license.status === 'trial' || license.status === 'invalid' || license.status === 'offline') && (
        <div className="flex items-center justify-between gap-3 bg-arei-900/90 px-4 py-2 text-sm text-arei-100">
          <div className="flex items-center gap-2">
            {license.status === 'offline' ? <WifiOff className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            <span>{license.message}</span>
          </div>
          <button
            onClick={() => setShowActivation((v) => !v)}
            className="flex items-center gap-1 rounded bg-arei-500 px-3 py-1 font-medium text-neutral-900 hover:bg-arei-400"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Licentie activeren
          </button>
        </div>
      )}

      {license.status === 'licensed' && (
        <div className="flex items-center gap-2 bg-green-900/40 px-4 py-1 text-xs text-green-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Licentie actief{license.expiresAt ? ` — geldig tot ${new Date(license.expiresAt).toLocaleDateString('nl-BE')}` : ''}
        </div>
      )}

      {showActivation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-lg bg-neutral-900 p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-semibold text-white">Licentiesleutel activeren</h2>
            <p className="mb-4 text-sm text-neutral-400">
              Voer de licentiesleutel in die je bij aankoop van Lightning hebt ontvangen.
            </p>
            <input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="mb-4 w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2 font-mono text-sm text-white outline-none focus:border-arei-500"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowActivation(false)} className="rounded px-3 py-1.5 text-sm text-neutral-400 hover:text-white">
                Annuleren
              </button>
              <button
                onClick={handleActivate}
                disabled={activating}
                className="rounded bg-arei-500 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-arei-400 disabled:opacity-50"
              >
                {activating ? 'Bezig…' : 'Activeren'}
              </button>
            </div>
          </div>
        </div>
      )}

      {children}
    </LicenseContext.Provider>
  );
}
