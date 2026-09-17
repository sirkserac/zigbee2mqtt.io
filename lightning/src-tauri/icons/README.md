# App-iconen

Deze map bevat een gegenereerd placeholder-icoon (amber vierkant met
bliksemschicht) in alle formaten die Tauri nodig heeft om te bouwen:
`32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.ico` (Windows) en
`icon.icns` (macOS), plus enkele extra formaten voor Linux
desktop-entries.

Vervang dit later door je eigen logo:

```bash
npm run tauri icon pad/naar/logo.png
```

Dit vult deze map automatisch met alle vereiste formaten uit één
bronafbeelding (bij voorkeur 1024x1024 PNG).
