import { jsPDF } from 'jspdf';
import type { Project } from '@/types/project';
import { getAreiRulesVersion, validateProject } from '@/utils/areiValidator';

export type PaperSize = 'a4' | 'a3';

const MARGIN = 15;
const STAMP_BLOCK_WIDTH = 70;
const STAMP_BLOCK_HEIGHT = 40;

function drawHeader(doc: jsPDF, project: Project, pageWidth: number) {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AREI Eendraadsschema', MARGIN, MARGIN + 4);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const infoLines = [
    `Project: ${project.name}`,
    `Klant: ${project.clientName || '-'}`,
    `Adres: ${project.address || '-'}, ${project.postalCode || ''} ${project.city || ''}`.trim(),
    project.eanCode ? `EAN: ${project.eanCode}` : undefined,
    `Datum: ${new Date().toLocaleDateString('nl-BE')}`,
  ].filter(Boolean) as string[];

  infoLines.forEach((line, idx) => {
    doc.text(line, MARGIN, MARGIN + 12 + idx * 5);
  });

  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text(`Regelset: AREI Boek 1 — ${getAreiRulesVersion()}`, pageWidth - MARGIN, MARGIN + 4, { align: 'right' });
  doc.setTextColor(0);
}

/**
 * Tekent het keuringsstempelblok rechtsonder op de pagina: een gestandaardiseerd
 * kader waarin de externe keuringsinstantie haar stempel, visum en datum van
 * (goed/afgekeurde) keuring aanbrengt.
 */
function drawInspectionStampBlock(doc: jsPDF, pageWidth: number, pageHeight: number) {
  const x = pageWidth - MARGIN - STAMP_BLOCK_WIDTH;
  const y = pageHeight - MARGIN - STAMP_BLOCK_HEIGHT;

  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.rect(x, y, STAMP_BLOCK_WIDTH, STAMP_BLOCK_HEIGHT);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('KEURINGSSTEMPEL', x + STAMP_BLOCK_WIDTH / 2, y + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.line(x, y + STAMP_BLOCK_HEIGHT - 10, x + STAMP_BLOCK_WIDTH, y + STAMP_BLOCK_HEIGHT - 10);
  doc.text('Keuringsorganisme:', x + 2, y + STAMP_BLOCK_HEIGHT - 6);
  doc.text('Datum keuring:', x + 2, y + STAMP_BLOCK_HEIGHT - 2);

  doc.setLineWidth(0.2);
  doc.rect(x + STAMP_BLOCK_WIDTH - 22, y + 6, 20, 20);
  doc.setFontSize(6);
  doc.text('Visum', x + STAMP_BLOCK_WIDTH - 12, y + 17, { align: 'center' });
}

function drawSingleLineDiagram(doc: jsPDF, project: Project, pageWidth: number, startY: number): number {
  let y = startY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);

  project.boards.forEach((board) => {
    if (y > 250) {
      doc.addPage();
      y = MARGIN;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${board.name}${board.isMainBoard ? ' (hoofdbord)' : ''} — hoofdautomaat ${board.mainBreakerRatingA}A`, MARGIN, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    board.circuits.forEach((circuit) => {
      const line = `${circuit.label}  ${circuit.name} — ${circuit.breakerRatingA}A ${circuit.breakerCurve} · ${circuit.cable.sectionMm2}mm² ${circuit.cable.type}${
        circuit.differentialType !== 'geen' ? ` · Δ${circuit.differentialType} ${circuit.differentialRatingMa ?? ''}mA` : ''
      }`;
      doc.text(line, MARGIN + 4, y, { maxWidth: pageWidth - 2 * MARGIN - 4 });
      y += 5;
    });
    y += 4;
  });

  return y;
}

function drawValidationSummary(doc: jsPDF, project: Project, pageWidth: number, startY: number) {
  const issues = validateProject(project);
  let y = startY;
  if (y > 250) {
    doc.addPage();
    y = MARGIN;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('AREI-conformiteitscontrole', MARGIN, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (issues.length === 0) {
    doc.text('Geen opmerkingen — installatie conform de gecontroleerde AREI-regels.', MARGIN, y);
    return;
  }
  issues.slice(0, 20).forEach((issue) => {
    doc.text(`[${issue.severity.toUpperCase()}] ${issue.message}`, MARGIN, y, { maxWidth: pageWidth - 2 * MARGIN });
    y += 5;
  });
}

/**
 * Exporteert het project naar een A4- of A3-PDF met eendraadsschema-overzicht,
 * conformiteitscontrole en keuringsstempelblok. Deze functie wordt afgeschermd
 * door LicenseGuard: zonder geldige licentie is export uitgeschakeld.
 */
export async function exportProjectToPdf(project: Project, paperSize: PaperSize = 'a4'): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: paperSize });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  drawHeader(doc, project, pageWidth);
  const afterDiagramY = drawSingleLineDiagram(doc, project, pageWidth, MARGIN + 32);
  drawValidationSummary(doc, project, pageWidth, afterDiagramY + 4);
  drawInspectionStampBlock(doc, pageWidth, pageHeight);

  doc.save(`${project.name.replace(/[\\/:*?"<>|]/g, '_')}-eendraadsschema.pdf`);
}
