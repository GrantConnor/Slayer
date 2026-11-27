# Slayer Hub: authenticated, fast-forward-only source updater.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
function Update-Source {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Warning 'Git is not installed. Playing local files only.'
        return
    }
    $root = & git rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $root -or
        [IO.Path]::GetFullPath($root) -ne [IO.Path]::GetFullPath($PSScriptRoot)) {
        Write-Warning 'This is not a Git checkout. Clone GrantConnor/Slayer once to enable updates.'
        return
    }
    $remote = & git remote get-url origin
    if ($LASTEXITCODE -ne 0 -or $remote -notmatch '^(https://github\.com/GrantConnor/Slayer(?:\.git)?/?|git@github\.com:GrantConnor/Slayer(?:\.git)?)$') {
        Write-Warning 'Unexpected Git remote. Skipping update.'
        return
    }
    $branch = & git branch --show-current
    if ($LASTEXITCODE -ne 0 -or $branch -ne 'main') {
        Write-Warning 'Not on main. Skipping update to protect your work.'
        return
    }
    $dirty = & git status --porcelain --untracked-files=no
    if ($LASTEXITCODE -ne 0 -or $dirty) {
        Write-Warning 'Local tracked changes found. Skipping update to protect your work.'
        return
    }
    Write-Host 'Checking Slayer Hub for updates...'
    $oldPrompt = $env:GIT_TERMINAL_PROMPT
    $oldInteractive = $env:GCM_INTERACTIVE
    try {
        $env:GIT_TERMINAL_PROMPT = '0'
        $env:GCM_INTERACTIVE = 'never'
        & git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 fetch --no-tags origin main
        if ($LASTEXITCODE -ne 0) {
            Write-Warning 'Update check failed. Playing the local version. To renew access, run git fetch origin main manually.'
            return
        }
        $before = & git rev-parse HEAD
        & git merge --ff-only FETCH_HEAD
        if ($LASTEXITCODE -ne 0) {
            Write-Warning 'Cannot fast-forward. No reset or forced update performed.'
            return
        }
        $after = & git rev-parse HEAD
        if ($before -eq $after) { Write-Host 'No incoming update.' }
        else { Write-Host "Slayer Hub updated: $after" }
    } finally {
        $env:GIT_TERMINAL_PROMPT = $oldPrompt
        $env:GCM_INTERACTIVE = $oldInteractive
    }
}
try {
    Update-Source
    if (-not (Get-Command node -ErrorAction SilentlyContinue) -or
        -not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
        throw 'Install Node.js LTS before launching Slayer Hub.'
    }
    foreach ($file in @('package.json','main.js','preload.js','updater.js','Slayer.html','Splash.html','Loading.gif','assets/interface/gold.png')) {
        if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing game file: $file" }
    }
    $pkg = Get-Content -LiteralPath 'package.json' -Raw | ConvertFrom-Json
    $spec = [ordered]@{ dependencies=$pkg.dependencies; devDependencies=$pkg.devDependencies }
    $fingerprint = $spec | ConvertTo-Json -Depth 20 -Compress
    $marker = 'node_modules/.slayer-dependencies.json'
    $installed = ''
    if (Test-Path -LiteralPath $marker) { $installed = Get-Content -LiteralPath $marker -Raw }
    if (-not (Test-Path -LiteralPath 'node_modules/electron/dist/electron.exe') -or $installed.Trim() -ne $fingerprint) {
        Write-Host 'Installing required game dependencies...'
        # Ignore legacy lock files without modifying the tracked checkout.
        & npm.cmd install --no-package-lock --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Check your internet connection and npm output.' }
        if (-not (Test-Path -LiteralPath 'node_modules/electron/dist/electron.exe')) { throw 'Electron installation is incomplete.' }
        Set-Content -LiteralPath $marker -Value $fingerprint -Encoding UTF8
    }
    Write-Host "Launching Slayer Hub Alpha $($pkg.version)"
    & npm.cmd start
    exit $LASTEXITCODE
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
