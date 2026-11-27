# Slayer Hub — private Git update setup

The current distribution uses one private repository: GrantConnor/Slayer.
The installer updater and separate release feed configuration are retained for
future use only; no release repository is needed for Git-based updates.

## One-time setup (Windows)

Install Git for Windows and Node.js LTS. In a parent folder, run:

```bat
git clone https://github.com/GrantConnor/Slayer.git Slayer
cd Slayer
Play-Slayer.cmd
```

Sign into GitHub when Git Credential Manager asks. If you already have a
clean checkout of this repository on main, run `git pull --ff-only` once,
then launch Play-Slayer.cmd (or Build-and-Play.cmd inside the checkout).

On subsequent launches, Play-Slayer checks origin/main and fast-forwards
only if the checkout is clean. If Git cannot fetch, the launcher attempts
to play the local version. It never forces a reset or embeds credentials.
Dependencies must already be installed for offline play; the first launch
and dependency changes may require internet access. Close the game before
launching again. The game launches directly from the checkout, not the old
Portable directory or installed executable.

Friends must have their own authorized GitHub access to the private repo
and must clone and authenticate on their own PCs. Do not share tokens.
Giving repository access also gives access to the game source and assets.

Saves remain in %APPDATA%/Slayer Hub/saves. Back up character.json and
character.json.bak before switching launch methods. No Git operation
targets that folder.

## Future installer distribution

The separate public release feed and installer workflow from 1.9.13 remain
dormant. Do not enable release publishing until a distribution method is
explicitly approved. Build-Installer.cmd can still build a local installer,
but Git updates only work through the Git checkout launcher.
