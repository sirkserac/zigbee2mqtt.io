import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LicenseGuard } from '@/components/license/LicenseGuard';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { EditorPage } from '@/components/editor/EditorPage';

/**
 * HashRouter wordt gebruikt (i.p.v. BrowserRouter) omdat de app als lokaal
 * bestand (tauri://) draait zonder server-side routing.
 */
export default function App() {
  return (
    <LicenseGuard>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor/:projectId" element={<EditorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </LicenseGuard>
  );
}
