# Slayer Hub — public GitHub updates

Slayer Hub is distributed from the public repository GrantConnor/Slayer.
No GitHub account, credentials or separate release repository are required.

## One-time Windows setup

Install Git for Windows and Node.js LTS. Back up the existing save folder
at %APPDATA%/Slayer Hub/saves before switching from an old installation.

Open Command Prompt in your chosen parent folder and run:

```bat
git clone https://github.com/GrantConnor/Slayer.git Slayer
cd Slayer
Play-Slayer.cmd
```

If you already have a clean checkout on main, use its existing Play-Slayer.cmd.
Always launch with this file, not an older installed executable, HTML file,
or Portable directory. The launcher checks origin/main before starting,
fast-forwards only a clean checkout and installs dependencies when necessary.
If the network is unavailable it can play an existing local installation.

## In-game update status

Check GitHub updates displays the running version, latest public version and
whether the local Git revision differs. A clean Windows checkout can save and
restart through Play-Slayer.cmd. Same-version hotfixes are detected by revision.
If an update is blocked by local changes, do not force reset your files.
Close the game and run the launcher again if the restart fails.

The old NSIS installer has no active update feed. Players still on Alpha
1.9.13 must switch to the public launcher once. Saves remain outside the Git
checkout at %APPDATA%/Slayer Hub/saves; no Git operation targets this folder.
