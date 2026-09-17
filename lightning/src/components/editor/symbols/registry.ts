import type { SymbolType } from '@/types/project';

export interface SymbolDefinition {
  type: SymbolType;
  label: string;
  category: 'aansluitpunten' | 'schakelmateriaal' | 'bord' | 'energie';
}

export const SYMBOL_LIBRARY: SymbolDefinition[] = [
  { type: 'stopcontact', label: 'Stopcontact', category: 'aansluitpunten' },
  { type: 'stopcontact_geaard', label: 'Stopcontact geaard', category: 'aansluitpunten' },
  { type: 'lichtpunt', label: 'Lichtpunt', category: 'aansluitpunten' },
  { type: 'rookmelder', label: 'Rookmelder', category: 'aansluitpunten' },
  { type: 'data_aansluiting', label: 'Data-aansluiting', category: 'aansluitpunten' },
  { type: 'tv_aansluiting', label: 'TV-aansluiting', category: 'aansluitpunten' },
  { type: 'schakelaar_enkelpolig', label: 'Schakelaar enkelpolig', category: 'schakelmateriaal' },
  { type: 'schakelaar_wissel', label: 'Wisselschakelaar', category: 'schakelmateriaal' },
  { type: 'schakelaar_kruis', label: 'Kruisschakelaar', category: 'schakelmateriaal' },
  { type: 'drukknop', label: 'Drukknop', category: 'schakelmateriaal' },
  { type: 'verdeelbord', label: 'Verdeelbord', category: 'bord' },
  { type: 'automaat', label: 'Automaat', category: 'bord' },
  { type: 'differentieel', label: 'Differentieelschakelaar', category: 'bord' },
  { type: 'aardingsklem', label: 'Aardingsklem', category: 'bord' },
  { type: 'pv_omvormer', label: 'PV-omvormer', category: 'energie' },
  { type: 'thuisbatterij', label: 'Thuisbatterij', category: 'energie' },
  { type: 'ev_laadpaal', label: 'EV-laadpaal', category: 'energie' },
  { type: 'warmtepomp', label: 'Warmtepomp', category: 'energie' },
];

export const SYMBOL_CATEGORY_LABEL: Record<SymbolDefinition['category'], string> = {
  aansluitpunten: 'Aansluitpunten',
  schakelmateriaal: 'Schakelmateriaal',
  bord: 'Bord & beveiliging',
  energie: 'Energie & mobiliteit',
};
