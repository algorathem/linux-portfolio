# Helix OS — Linux-style portfolio

A Hyprland-inspired desktop in the browser. Boot the machine, unlock it, then use the dock, file manager, and a real-enough shell.

- **Live:** https://helix-os.kcleck06.workers.dev
- **Source:** https://github.com/algorathem/linux-portfolio

Personal bits live in `data.js` (name, projects, skills, GitHub). Swap those and the desktop is yours.

## Run it

Any static server:

```powershell
cd $env:USERPROFILE\linux-portfolio
python -m http.server 8765
```

Then open [http://localhost:8765](http://localhost:8765).

Skip the boot sequence with `http://localhost:8765/?skip` (goes to the lock screen). Jump straight onto the desktop with `?desktop`. Settings can also skip boot on later visits.

## What you can do

- Drag, resize, minimize, maximize windows
- Four workspaces (`Ctrl+1` … `Ctrl+4`)
- Dock + desktop icons + launcher (`Ctrl+Space`)
- Terminal: `help`, `neofetch`, `ls`, `cd`, `cat`, `tree`, `open projects`, `cmatrix`, `sl`, `theme phosphor`
- Files app for `~/Projects`, `~/Documents`, `~/Pictures`
- Themes: Helix, Phosphor, Nord, Rose (right-click the wallpaper to cycle)

Classic Linux muscle memory: `Ctrl+Alt+T` for a terminal, `Alt+Q` to close the focused window.

## Deploy

```powershell
npx wrangler deploy
```

That publishes to `https://helix-os.kcleck06.workers.dev`.
