# sshuttle-gui

A menu bar / tray front end for [sshuttle](https://github.com/sshuttle/sshuttle), built with Electron. It starts sshuttle with your settings, shows the connection state in the tray icon, and reconnects automatically if the tunnel drops.

## Requirements

- macOS or Linux
- [Node.js](https://nodejs.org/) and npm
- [sshuttle](https://github.com/sshuttle/sshuttle) 1.x installed system-wide and on your `PATH`
  - macOS: `brew install sshuttle`
- SSH access to a jumpbox/remote host that has `python3`

## Install

```sh
git clone https://github.com/wmantly/sshuttle-gui.git
cd sshuttle-gui
npm install
cp .env.example .env
```

Then edit `.env` (see [Configuration](#configuration)).

## Run

```sh
npm start
```

On first run the app needs to allow sshuttle to run as root without a password. It generates a sudoers entry (`sshuttle --sudoers-no-modify`), validates it with `visudo`, and installs it as `/etc/sudoers.d/sshuttle_gui_auto`. You will be asked for your sudo password once, in the terminal.

> **Security note:** a passwordless sudo rule for sshuttle is effectively passwordless root for your user (sshuttle can run arbitrary commands via `--ssh-cmd`). Only use this on a machine you trust.

The sudoers entry points at the current sshuttle install path. After upgrading sshuttle (e.g. `brew upgrade sshuttle`), remove it and restart the app so it is regenerated:

```sh
sudo rm /etc/sudoers.d/sshuttle_gui_auto
```

## Configuration

Settings are read from `.env` in the project root (it is gitignored). See `.env.example`.

| Variable | Description |
| --- | --- |
| `SSHUTTLE_REMOTE` | SSH target passed to `-r`. Can be an alias from `~/.ssh/config`. If set, user/host/port below are ignored. |
| `SSHUTTLE_USER` | SSH user (required if `SSHUTTLE_REMOTE` is not set). |
| `SSHUTTLE_HOST` | SSH host (required if `SSHUTTLE_REMOTE` is not set). |
| `SSHUTTLE_PORT` | SSH port. Optional, defaults to 22. |
| `SSHUTTLE_SUBNETS` | Comma-separated subnets to route through the tunnel. Defaults to `0/0` (everything). |
| `SSHUTTLE_EXCLUDE` | Comma-separated subnets/IPs to exclude (`-x`). Optional. |
| `SSHUTTLE_DNS` | Forward DNS through the tunnel (`--dns`). Defaults to `true`; set `false` to disable. |

Example, equivalent to
`sshuttle 10.5.10.0/24 192.168.100.0/24 --remote=my-jumpbox`:

```sh
SSHUTTLE_REMOTE=my-jumpbox
SSHUTTLE_SUBNETS=10.5.10.0/24,192.168.100.0/24
SSHUTTLE_DNS=false
```

## Usage

The app lives in the tray / menu bar. The icon color shows the state:

| Color | Meaning |
| --- | --- |
| Green | Connected |
| Orange | Connecting |
| Red | Disconnected or error |

Hover for the current public IP and location. Right-click (or click) the icon for the menu:

- **Disconnect / Connect**: stop or start the tunnel. A manual disconnect will not auto-reconnect.
- **Reconnect**: restart the tunnel.
- **Quit**: stop sshuttle and exit.

## Troubleshooting

- **`npm install` fails downloading Electron**: make sure you are on the current `package.json` (Electron 33+; old Electron 2.x has no Apple Silicon build).
- **Prompted for a password / tunnel won't start**: the sudoers entry is missing or stale. Remove `/etc/sudoers.d/sshuttle_gui_auto` and restart the app.
- **`server died` / Python errors from the remote**: use sshuttle 1.x locally (check `sshuttle --version`) and make sure the remote has `python3`.
- **Check nothing is left running after quitting**: `pgrep -fl sshuttle`.
