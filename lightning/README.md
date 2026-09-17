# Lightning — Belgische AREI eendraads- en situatieschema editor

Lightning is een desktoptoepassing (Windows `.exe` / macOS `.dmg`) voor
elektrotechnische installateurs om AREI-conforme eendraadsschema's en
situatieschema's op te stellen, te valideren en te exporteren naar PDF.

Deze map bevat de **basis** van de applicatie: projectstructuur,
datamodellen, de AREI-regels-engine, een werkende dashboard- en
editor-UI, licentiebeveiliging en de Tauri-configuratie voor
cross-platform builds en auto-updates.

## Techstack

- **Tauri v2** — lichtgewicht cross-platform shell (Rust-backend, native webview)
- **React 18 + TypeScript + Tailwind CSS** — UI
- **SQLite** via `@tauri-apps/plugin-sql` — lokale projectendatabank
- **`.lightning`-bestanden** (JSON) — import/export om projecten te delen
- **lucide-react** — iconen
- **HTML5 SVG** — schema- en situatie-editor rendering
- **jsPDF** — PDF-export met keuringsstempelblok

## Projectstructuur

```
lightning/
├── src/                          # React-frontend
│   ├── config/
│   │   └── arei-rules-2026.json  # AREI Boek 1 regelset (kabelsecties, RCD-vereisten, max. aansluitpunten)
│   ├── types/
│   │   ├── project.ts            # Project / Board (Bord) / Circuit (Kring) / SymbolInstance datamodellen
│   │   └── license.ts            # Licentiestatus-model
│   ├── utils/
│   │   ├── areiValidator.ts      # Realtime AREI-validator op basis van de regelset
│   │   ├── db.ts                 # SQLite-laag (CRUD, zoeken/filteren)
│   │   ├── lightningFile.ts      # .lightning import/export + dupliceren
│   │   ├── factories.ts          # Fabrieksfuncties voor nieuwe projecten/borden/kringen
│   │   └── pdfExport.ts          # A4/A3 PDF-export met keuringsstempelblok
│   ├── state/
│   │   └── projectStore.ts       # Zustand store: actief project, validatie, dirty-state
│   ├── hooks/
│   │   ├── useAutoSave.ts        # Automatisch opslaan tijdens het tekenen
│   │   └── useLicense.ts         # Licentievalidatie via HTTPS API
│   └── components/
│       ├── dashboard/            # Multi-project dashboard (zoeken, CRUD, import/export)
│       ├── editor/                # Eendraadsschema- en situatieschema-editor + AREI-symbolenbibliotheek
│       └── license/               # LicenseGuard + React context
├── src-tauri/                    # Rust-backend (Tauri v2)
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   └── commands.rs           # Tauri commands (versie-info, machine-fingerprint voor licentiebinding)
│   ├── capabilities/default.json # Tauri v2 permissiemodel voor de plugins
│   └── tauri.conf.json           # Auto-updater endpoint + bundlerconfiguratie
└── package.json
```

## Datamodel (kern)

- **Project** — één AREI-dossier/werf: klant, adres, EAN-code, status,
  lijst van `Board`s en `SituationPlan`s.
- **Board** (bord) — hoofd- of onderverdeelbord: hoofdautomaat,
  kortsluitvastheid, differentieelschakelaars, lijst van `Circuit`s.
- **Circuit** (kring) — label (A, B, C…), type (stopcontact, badkamer,
  wasmachine, kookplaat, warmtepomp, PV, EV-laadpaal…), automaatwaarde,
  kabelsectie/-type, differentieeltype en -waarde, aantal aansluitpunten.
- **SituationPlan** — plattegrond (achtergrondafbeelding) + geplaatste
  `SymbolInstance`s (AREI-symbolen op positie x/y met rotatie).

Zie `src/types/project.ts` voor de volledige TypeScript-definities.

## AREI Rules Engine

`src/config/arei-rules-2026.json` bevat een configureerbare regelset:
kabelsectie-vs-automaat-tabel, minimale kabelsecties en verplichte
differentieeltypes per kringtype (bv. 30mA op badkamerstopcontacten en
wasmachines, Type A/B op PV/EV/warmtepomp), en maximaal 8 aansluitpunten
per kring.

`src/utils/areiValidator.ts` leest deze regelset en controleert het
geopende project realtime; resultaten verschijnen in het
validatiepaneel onderaan de editor en worden meegenomen in de
PDF-export. **Belangrijk:** dit is een hulpmiddel — de officiële
AREI-tekst (RGIE Boek 1) blijft bindend; regels kunnen aangepast worden
door het JSON-bestand te bewerken naarmate de wetgeving evolueert
(vandaar het jaartal in de bestandsnaam).

## Licentiebeveiliging

`LicenseGuard` (`src/components/license/LicenseGuard.tsx`) valideert bij
opstart de opgeslagen licentiesleutel via een HTTPS-call naar de
configureerbare `VITE_LICENSE_API_URL` (compatibel met bv. Keygen.sh of
Lemon Squeezy validate-key endpoints). Zonder geldige licentie:

- maximaal **2 opgeslagen projecten** (trialmodus),
- **PDF-export uitgeschakeld** (de exportknop wordt vergrendeld).

Kopieer `.env.example` naar `.env` en vul je eigen licentie-API-URL in.

## Auto-updates

`src-tauri/tauri.conf.json` bevat de configuratie van
`tauri-plugin-updater`. Voor productie:

1. Genereer een sleutelpaar: `npm run tauri signer generate -- -w ~/.tauri/lightning.key`
2. Vervang `pubkey` in `tauri.conf.json` door de gegenereerde publieke sleutel.
3. Publiceer releases + een `latest.json` manifest op het
   `endpoints`-adres (bv. via GitHub Releases of een eigen updateserver).

## Aan de slag

```bash
cd lightning
npm install
npm run tauri dev      # start de desktop-app in ontwikkelmodus
```

Productiebuild (genereert `.exe` op Windows / `.dmg` op macOS):

```bash
npm run tauri build
```

> Vereisten: Node.js 18+, Rust (stable toolchain), en de platform-
> specifieke Tauri-vereisten (zie https://v2.tauri.app/start/prerequisites/).
> Genereer app-iconen met `npm run tauri icon pad/naar/logo.png` (zie
> `src-tauri/icons/README.md`).

## Wat is er al gebouwd (basis)

- Volledige projectstructuur en databank-/bestandslaag (SQLite + `.lightning`)
- Dashboard met zoeken/filteren, CRUD, dupliceren, import/export, auto-save
- AREI-regels-engine (JSON) + realtime TypeScript-validator
- Eendraadsschema-editor (borden/kringen, SVG-schemaweergave, validatiepaneel)
- Situatieschema-editor (plattegrond + drag-and-drop AREI-symbolenbibliotheek)
- PDF-export (A4/A3) met keuringsstempelblok
- LicenseGuard met trialbeperkingen + Tauri auto-updater configuratie

## Volgende stappen (niet in deze basis inbegrepen)

- Werkende backend-integratie met een gekozen licentieprovider (accountaanmaak, webhooks)
- Volledige AREI Boek 1-regelset verder uitbreiden (o.a. spanningsval-, selectiviteits- en kortsluitberekeningen)
- Undo/redo in de editors, meerdere situatieplannen per verdieping
- Gegenereerde app-iconen en code signing voor Windows/macOS
- Geautomatiseerde tests (Vitest/Playwright) en CI-pipeline
