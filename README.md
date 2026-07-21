# B-Browser — build the .exe

This sandbox has no internet access, so the actual compiling has to happen on
a machine that does (your PC — Windows, Mac, or Linux all work; electron-builder
cross-builds Windows exes from any OS).

## Steps

1. Install [Node.js LTS](https://nodejs.org) if you don't have it.
2. Unzip this folder, open a terminal inside it.
3. Install dependencies:
   ```
   npm install
   ```
4. (Optional) preview the app in a real window before building:
   ```
   npm start
   ```
5. Build the Windows executable:
   ```
   npm run dist
   ```

That produces, inside `dist/`:
- `B-Browser-portable.exe` — a single-file exe, no install needed, just double-click.
- `B-Browser-Setup.exe` — a normal Windows installer.

## Notes

- The custom title bar (red/yellow/green dots) *is* the real window frame —
  they're wired to actually close/minimize/maximize the window via Electron.
- Sites that send `X-Frame-Options` / CSP `frame-ancestors` (Google, Amazon,
  most big sites) will refuse to render inside the page, same as in a normal
  browser tab. Use the "Open directly" fallback — in the packaged app it opens
  your real default browser.
- Unsigned Windows exes will show a SmartScreen warning on first run
  ("Windows protected your PC") — click "More info" → "Run anyway". Code-signing
  costs money and isn't something I can do for you here.
