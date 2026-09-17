import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useProjectStore } from '@/state/projectStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { createBoard, createCircuit } from '@/utils/factories';
import { exportProjectToPdf } from '@/utils/pdfExport';
import { useLicenseContext } from '@/components/license/LicenseContext';
import { Toolbar, type EditorTab } from './Toolbar';
import { BoardPanel } from './BoardPanel';
import { CircuitPanel } from './CircuitPanel';
import { SchemaEditor } from './SchemaEditor';
import { SituationEditor } from './SituationEditor';
import { PlanSwitcher } from './PlanSwitcher';
import { ValidationPanel } from './ValidationPanel';

export function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { license } = useLicenseContext();

  const activeProject = useProjectStore((s) => s.activeProject);
  const isDirty = useProjectStore((s) => s.isDirty);
  const validationIssues = useProjectStore((s) => s.validationIssues);
  const openProject = useProjectStore((s) => s.openProject);
  const closeProject = useProjectStore((s) => s.closeProject);
  const updateActiveProject = useProjectStore((s) => s.updateActiveProject);
  const updateCircuit = useProjectStore((s) => s.updateCircuit);
  const persistActiveProject = useProjectStore((s) => s.persistActiveProject);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const canUndo = useProjectStore((s) => s.past.length > 0);
  const canRedo = useProjectStore((s) => s.future.length > 0);

  const [activeTab, setActiveTab] = useState<EditorTab>('schema');
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [selectedCircuitId, setSelectedCircuitId] = useState<string | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  useAutoSave();

  useEffect(() => {
    if (projectId) void openProject(projectId);
    return () => closeProject();
  }, [projectId, openProject, closeProject]);

  useEffect(() => {
    if (activeProject && !activeBoardId) {
      setActiveBoardId(activeProject.boards[0]?.id ?? null);
    }
    if (activeProject && !activePlanId && activeProject.situationPlans[0]) {
      setActivePlanId(activeProject.situationPlans[0].id);
    }
  }, [activeProject, activeBoardId, activePlanId]);

  // Zorgt dat er altijd minstens één situatieplan bestaat zodra de gebruiker
  // naar dat tabblad gaat, zonder tijdens het renderen state bij te werken.
  useEffect(() => {
    if (activeTab === 'situatie' && activeProject && activeProject.situationPlans.length === 0) {
      const plan = { id: uuidv4(), projectId: activeProject.id, name: 'Gelijkvloers', symbols: [] };
      updateActiveProject((p) => ({ ...p, situationPlans: [...p.situationPlans, plan] }));
      setActivePlanId(plan.id);
    }
  }, [activeTab, activeProject, updateActiveProject]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod || e.key.toLowerCase() !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  if (!activeProject) {
    return <div className="flex h-screen items-center justify-center bg-neutral-950 text-neutral-400">Project laden…</div>;
  }

  const activeBoard = activeProject.boards.find((b) => b.id === activeBoardId) ?? activeProject.boards[0];
  const activePlan = activeProject.situationPlans.find((p) => p.id === activePlanId) ?? activeProject.situationPlans[0] ?? null;

  const handleAddBoard = () => {
    const board = createBoard(activeProject.id, `Bord ${activeProject.boards.length + 1}`);
    updateActiveProject((p) => ({ ...p, boards: [...p.boards, board] }));
    setActiveBoardId(board.id);
  };

  const handleAddCircuit = () => {
    if (!activeBoard) return;
    const nextLetter = String.fromCharCode(65 + activeBoard.circuits.length);
    const circuit = createCircuit(activeBoard.id, nextLetter);
    updateActiveProject((p) => ({
      ...p,
      boards: p.boards.map((b) => (b.id === activeBoard.id ? { ...b, circuits: [...b.circuits, circuit] } : b)),
    }));
    setSelectedCircuitId(circuit.id);
  };

  const handleAddPlan = () => {
    const plan = { id: uuidv4(), projectId: activeProject.id, name: `Plan ${activeProject.situationPlans.length + 1}`, symbols: [] };
    updateActiveProject((p) => ({ ...p, situationPlans: [...p.situationPlans, plan] }));
    setActivePlanId(plan.id);
  };

  const handleRenamePlan = (id: string, name: string) => {
    updateActiveProject((p) => ({
      ...p,
      situationPlans: p.situationPlans.map((plan) => (plan.id === id ? { ...plan, name } : plan)),
    }));
  };

  const handleDeletePlan = (id: string) => {
    updateActiveProject((p) => ({ ...p, situationPlans: p.situationPlans.filter((plan) => plan.id !== id) }));
    if (activePlanId === id) {
      const remaining = activeProject.situationPlans.filter((plan) => plan.id !== id);
      setActivePlanId(remaining[0]?.id ?? null);
    }
  };

  const handleExportPdf = async () => {
    if (!license.canExport) return;
    await exportProjectToPdf(activeProject);
  };

  return (
    <div className="flex h-screen flex-col bg-neutral-900">
      <Toolbar
        projectName={activeProject.name}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDirty={isDirty}
        onSave={() => void persistActiveProject()}
        onExportPdf={() => void handleExportPdf()}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'schema' && activeBoard ? (
          <>
            <BoardPanel boards={activeProject.boards} activeBoardId={activeBoard.id} onSelect={setActiveBoardId} onAddBoard={handleAddBoard} />
            <div className="flex flex-1 flex-col overflow-hidden">
              <SchemaEditor board={activeBoard} selectedCircuitId={selectedCircuitId} issues={validationIssues} onSelectCircuit={setSelectedCircuitId} />
              <ValidationPanel issues={validationIssues} />
            </div>
            <CircuitPanel
              board={activeBoard}
              selectedCircuitId={selectedCircuitId}
              issues={validationIssues}
              onSelect={setSelectedCircuitId}
              onAddCircuit={handleAddCircuit}
              onUpdateCircuit={(id, patch) => updateCircuit(activeBoard.id, id, (c) => ({ ...c, ...patch }))}
            />
          </>
        ) : activePlan ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <PlanSwitcher
              plans={activeProject.situationPlans}
              activePlanId={activePlan.id}
              onSelect={setActivePlanId}
              onAdd={handleAddPlan}
              onRename={handleRenamePlan}
              onDelete={handleDeletePlan}
            />
            <SituationEditor
              plan={activePlan}
              onChange={(plan) =>
                updateActiveProject((p) => ({
                  ...p,
                  situationPlans: p.situationPlans.map((existing) => (existing.id === plan.id ? plan : existing)),
                }))
              }
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-neutral-500">Situatieplan wordt aangemaakt…</div>
        )}
      </div>
    </div>
  );
}
