# Slayer Hub Alpha 1.9.13 — updater setup

Source repo: private `GrantConnor/Slayer`. Distribution feed: public `GrantConnor/Slayer-Hub-Releases` (create it separately, with a README). Publishing releases makes compiled game files and artwork publicly downloadable; source repository stays private, but Electron packages are not secret or DRM-protected. Do not publish if you lack distribution rights or want playtester-only access.

## Initial source upload
Extract the entire source ZIP. If the private repo is empty, run from the extracted folder:

```bat
git init -b main
git add .
git commit -m "Slayer Hub 1.9.13 updater"
git remote add origin https://github.com/GrantConnor/Slayer.git
git push -u origin main
```
If it already contains commits, clone it and copy the source into that clone, then commit and push. Do not force push. No saves or credentials should be committed.

## Windows installer
Run `Build-Installer.cmd` on Windows or use Actions > Windows installer > Run workflow in the private repository (leave publish_release unchecked to build only). Download the installer artifact, extract it, and run `Slayer-Hub-Setup-1.9.13.exe`. The source `Build-and-Play.cmd` is still supported but does not auto-update.

## Publish updates
Create the public release repository first. For automated publishing create a fine-grained GitHub PAT limited to that release repository with Contents read/write, and store it in the PRIVATE source repository Actions secret `RELEASE_TOKEN`. Never put it in source or the client. Run the workflow with publish_release checked only when ready to distribute publicly. Alternatively, create a GitHub release tagged `v1.9.13` in the public release repo and upload the installer, `.exe.blockmap` and `latest.yml` together; publish as a normal release (not draft/prerelease). For subsequent releases increment package.json version and matching UI/window version, then build and publish a new tag. Do not overwrite old releases. Keep the generated feed metadata unmodified.

Installed Windows clients check after game boot, download updates in the background, and install on normal close after a successful save. Reopen the game after installation finishes. Check for updates is available in-game. Offline or failed checks do not prevent gameplay. Existing saves remain in `%APPDATA%/Slayer Hub/saves` and are not packaged. Back up saves before the first installer test. The installer is unsigned; SmartScreen warnings are possible. SHA-512 verification is handled by electron-updater, but code signing is recommended before wider distribution. Test initial install and a real next-version update on Windows before sharing.
