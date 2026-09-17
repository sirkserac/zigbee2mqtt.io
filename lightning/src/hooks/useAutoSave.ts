import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/state/projectStore';

const AUTO_SAVE_INTERVAL_MS = 15_000;

/**
 * Bewaart het actieve project automatisch, telkens er wijzigingen zijn en
 * er minstens AUTO_SAVE_INTERVAL_MS verstreken is sinds de laatste opslag.
 * Wordt gemount op het niveau van de schema-editor.
 */
export function useAutoSave(): { isDirty: boolean; lastSavedAt: Date | null } {
  const isDirty = useProjectStore((s) => s.isDirty);
  const persistActiveProject = useProjectStore((s) => s.persistActiveProject);
  const lastSavedAtRef = useRef<Date | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      await persistActiveProject();
      lastSavedAtRef.current = new Date();
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isDirty, persistActiveProject]);

  // Sla ook op wanneer de gebruiker de editor verlaat of het venster sluit.
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (useProjectStore.getState().isDirty) {
        void persistActiveProject();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [persistActiveProject]);

  return { isDirty, lastSavedAt: lastSavedAtRef.current };
}
