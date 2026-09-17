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

## Licentiebeveiliging (gratis via Lemon Squeezy)

`LicenseGuard` (`src/components/license/LicenseGuard.tsx`) valideert bij
opstart de opgeslagen licentiesleutel via de **Lemon Squeezy License API**
(`src/hooks/useLicense.ts`). Deze tool is gratis te gebruiken: geen
maandabonnement, enkel een transactiekost wanneer je er effectief via
verkoopt. Zonder geldige licentie:

- maximaal **2 opgeslagen projecten** (trialmodus),
- **PDF-export uitgeschakeld** (de exportknop wordt vergrendeld).

### Zelf instellen (5 minuten, gratis)

1. Maak een gratis account op [lemonsqueezy.com](https://www.lemonsqueezy.com/).
2. Maak een **Store** aan (kan in testmodus blijven, verkoop is niet vereist om zelf te testen).
3. Maak een **Product** van het type "License keys" aan (bv. "Lightning licentie").
4. Genereer onder dat product een testlicentiesleutel (Lemon Squeezy
   toont deze in het dashboard, of je genereert er automatisch één bij
   elke "testbestelling" in testmodus).
5. Kopieer `.env.example` naar `.env` — de standaard `VITE_LICENSE_API_URL`
   hoeft niet aangepast te worden, want het is een publiek, geauthenticeerd
   endpoint per licentiesleutel (geen API-sleutel nodig langs de kant van
   de app).
6. Start de app, klik op "Licentie activeren" en plak de sleutel.

De app roept `POST /v1/licenses/activate` aan bij het invoeren van een
sleutel (bindt de licentie aan dit toestel via een niet-herleidbare
machine-fingerprint, zie `get_machine_fingerprint` in
`src-tauri/src/commands.rs`) en nadien periodiek `POST
/v1/licenses/validate` om te bevestigen dat de licentie nog geldig is.
Volledige API-documentatie: <https://docs.lemonsqueezy.com/help/licensing/license-api>.

## Auto-updates

`src-tauri/tauri.conf.json` bevat de configuratie van
`tauri-plugin-updater`. Voor productie:

1. Genereer een sleutelpaar: `npm run tauri signer generate -- -w ~/.tauri/lightning.key`
2. Vervang `pubkey` in `tauri.conf.json` door de gegenereerde publieke sleutel.
3. Publiceer releases + een `latest.json` manifest op het
   `endpoints`-adres (bv. via GitHub Releases of een eigen updateserver).

## Aan de slag (lokaal ontwikkelen)

```bash
cd lightning
npm install
npm run tauri dev      # start de desktop-app in ontwikkelmodus
```

Testen en type-checken:

```bash
npm run test           # Vitest unit tests (validator, factories)
npx tsc -b --noEmit    # TypeScript type-check
```

Productiebuild op je eigen machine (genereert `.exe` op Windows / `.dmg`
op macOS — moet uitgevoerd worden **op** dat besturingssysteem zelf):

```bash
npm run tauri build
```

> Vereisten: Node.js 18+, Rust (stable toolchain), en de platform-
> specifieke Tauri-vereisten (zie https://v2.tauri.app/start/prerequisites/).

## De Windows- of macOS-installer downloaden (zonder zelf te bouwen)

Je hoeft **niets lokaal te installeren** om de `.exe`/`.msi` (Windows) of
`.dmg` (macOS) te krijgen: de meegeleverde GitHub Actions-workflow
(`.github/workflows/lightning-build.yml`) bouwt beide gratis via de
door GitHub gehoste build-servers (die dienst is gratis, ook voor
onbeperkt gebruik op publieke repositories).

**Zo download je de installer:**

1. Ga naar deze GitHub-repository in je browser.
2. Klik bovenaan op het tabblad **Actions**.
3. Kies in de lijst links **"Build Lightning installers"**.
4. Klik rechts op de knop **"Run workflow"** → laat de branch op
   `claude/lightning-arei-app-xxbmqv` (of `master` na een merge) staan →
   klik nogmaals op de groene knop **"Run workflow"**.
5. Wacht 10–15 minuten tot de drie builds (Windows, macOS Apple Silicon,
   macOS Intel) een groen vinkje krijgen.
6. Ga naar het tabblad **Releases** van de repository (rechts op de
   hoofdpagina, of `github.com/<gebruiker>/<repo>/releases`). Daar staat
   een nieuwe **(draft) release "Lightning v0.1.0"** met de installers
   als bijlage: een `.exe`/`.msi` voor Windows en twee `.dmg`-bestanden
   voor macOS (Apple Silicon/M-serie en Intel — kies de juiste voor jouw Mac).
7. Download het bestand voor jouw besturingssysteem en installeer het
   zoals je dat van elke andere app gewend bent.

> **Windows SmartScreen / macOS Gatekeeper-waarschuwing:** omdat dit een
> ongesigneerde build is (code signing voor Windows is niet gratis, en
> voor macOS vereist het een betaald Apple Developer-account van
> $99/jaar), zal het besturingssysteem een waarschuwing tonen bij de
> eerste installatie ("Windows heeft de app beschermd" / "onbekende
> ontwikkelaar"). Kies **"Meer info" → "Toch uitvoeren"** (Windows) of
> **rechtsklik → "Open"** (macOS) om verder te gaan. Dit is een eenmalige
> bevestiging per toestel.

## Wat is er al gebouwd (basis)

- Volledige projectstructuur en databank-/bestandslaag (SQLite + `.lightning`)
- Dashboard met zoeken/filteren, CRUD, dupliceren, import/export, auto-save
- AREI-regels-engine (JSON) + realtime TypeScript-validator
- Eendraadsschema-editor (borden/kringen, SVG-schemaweergave, validatiepaneel)
- Situatieschema-editor (plattegrond + drag-and-drop AREI-symbolenbibliotheek),
  met ondersteuning voor **meerdere plannen per project** (bv. per verdieping)
- **Undo/redo** (Ctrl+Z / Ctrl+Shift+Z, of de knoppen in de werkbalk)
- PDF-export (A4/A3) met keuringsstempelblok
- LicenseGuard met gratis Lemon Squeezy-licentievalidatie en trialbeperkingen
- Tauri auto-updater configuratie + een gegenereerd placeholder app-icoon
  (PNG/ICO/ICNS) zodat de app meteen bouwbaar is
- Automatische tests (Vitest) voor de AREI-validator en projectfabrieken
- Gratis GitHub Actions-workflow die Windows- en macOS-installers bouwt
  en publiceert als Release

## Volgende stappen (niet in deze basis inbegrepen)

- Eigen logo/branding ter vervanging van het gegenereerde placeholder-icoon
- Code signing voor Windows en macOS (verwijdert de SmartScreen/Gatekeeper-
  waarschuwing, maar vereist een betaald certificaat/Apple Developer-account)
- Volledige AREI Boek 1-regelset verder uitbreiden (o.a. spanningsval-,
  selectiviteits- en kortsluitberekeningen)
- Een eigen (betalend) Lemon Squeezy-product live zetten om echte
  licenties te verkopen, in plaats van test-/gratis sleutels
- End-to-end tests (bv. Playwright) bovenop de bestaande Vitest-unittests
