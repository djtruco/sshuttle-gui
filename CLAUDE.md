# sshuttle-gui

Electron tray app (main process only, no renderer window) that runs the system `sshuttle` and shows its state in the menu bar. Forked from wmantly/sshuttle-gui; keep William Mantly Jr's copyright and `author` credit (MIT).

## Layout

- `app.js`: Electron main process. Tray icon, tray context menu (Connect/Disconnect/Reconnect/Quit), tooltip with public IP, auto-reconnect via `electron-pubsub` events.
- `lib/process_sshuttle.js`: spawns/stops sshuttle, installs the sudoers rule, parses sshuttle output and publishes `sshuttle.*` events. Reads config from `.env`.
- `lib/wtfismyip.js`: public IP lookup for the tooltip.
- `static/img/vpn_*.png`: 128px tray icons (resized to 18px in `app.js`).

## Run

```sh
npm install
cp .env.example .env   # then edit
npm start              # electron app.js
```

There are no tests (`npm test` is a placeholder). Verify changes by running the app and checking the tray icon, menu and `pgrep -fl sshuttle`.

## Conventions and gotchas

- Config comes from `.env` (gitignored). Add new options to both `lib/process_sshuttle.js` and `.env.example`, and document them in the README table. Never commit `.env` or hardcode hosts/IPs.
- Uses the official sshuttle 1.x from Homebrew, not a bundled copy. Do not re-vendor Python code.
- `manager()` in `lib/process_sshuttle.js` is called WITHOUT `new`, so `this` is `globalThis`. Keep state in the local `self` object; assigning `this.process` clobbers Node's global `process`.
- The `enabled` flag in `app.js` suppresses auto-reconnect. Anything that stops sshuttle on purpose (Disconnect, Quit, `before-quit`) must clear it first, or the `sshuttle.exit` handler reconnects.
- sshuttle 1.x logs `c : Connected to server.`; the match regex accepts both that and the old `client: Connected`.
- Sudoers: `/etc/sudoers.d/sshuttle_gui_auto` is generated from `sshuttle --sudoers-no-modify`, validated with `visudo -cf`, installed via `sudo`. sshuttle 1.3.2's generator has a bug (extra `/sshuttle` in `PYTHONPATH`), so the code rewrites it. The rule is tied to the Homebrew path/version; after `brew upgrade sshuttle`, delete the file so it is regenerated. A passwordless rule is effectively passwordless root, so treat changes here as security-sensitive.
- Electron is pinned to ^33 (v2 has no Apple Silicon build). Tray icons are plain colored PNGs, not macOS template images.

## Git

- Commit with the repo-local email (already set via `git config --local user.email`); don't change the global config.
- Group commits by topic, with a descriptive body explaining why.

## Planned work

- Ask the user before installing the sudoers rule (consent dialog, saved choice, `osascript` admin prompt, tray item to change). Details are in the project memory `sudoers-consent-prompt`.
