# Runbook — OneDrive setup for this repo

> **Why this runbook exists:** the repo lives under `c:\Users\gondy\OneDrive\Desktop\Tchart`. OneDrive's file sync is incompatible with the file-locking patterns of `pnpm install`, `prisma generate`, and Next.js's `.next/` cache. Without the steps below, you will see intermittent `EBUSY`, `EPERM`, and "file is in use by another process" failures.

This is fixable. Do these three things **before** the first `pnpm install`.

---

## 1. Pause OneDrive sync for the project tree

OneDrive cannot lock files inside an excluded folder, which is what we need.

### Option A (preferred) — exclude folders via OneDrive UI

1. Right-click the OneDrive icon in the system tray → **Settings**.
2. Go to **Account** → **Choose folders**.
3. Uncheck **Desktop\Tchart\node_modules**, **Desktop\Tchart\.next**, **Desktop\Tchart\.turbo**, and any **dist** / **build** / **coverage** folders. (You may need to create these directories first by running `pnpm install` once and accepting the errors, then re-trying after exclusion.)

This works on per-app basis: `apps/web/node_modules`, `apps/api/node_modules`, `packages/*/node_modules`. Easier: see Option B.

### Option B (more reliable) — mark folders "Free up space" + add to OneDrive ignore list

After the first `pnpm install`, run these from PowerShell **as administrator**:

```powershell
$root = "c:\Users\gondy\OneDrive\Desktop\Tchart"

# Make any directory matching these patterns not synced
$patterns = @("node_modules", ".next", ".turbo", "dist", "build", "coverage", ".cache")

Get-ChildItem -Path $root -Recurse -Directory -Force -ErrorAction SilentlyContinue |
  Where-Object { $patterns -contains $_.Name } |
  ForEach-Object {
    # Mark as offline-only / freed-up (won't sync, won't even appear)
    attrib +U -P $_.FullName /S /D
  }
```

### Option C (nuclear) — move the repo out of OneDrive

If the above doesn't hold up, the cleanest fix is to move the repo to `C:\dev\tcharts` (outside OneDrive) and create a junction back to the OneDrive location only if you specifically need OneDrive to see the *source files*.

```powershell
# Move
Move-Item "c:\Users\gondy\OneDrive\Desktop\Tchart" "C:\dev\tcharts"

# Optional: keep a OneDrive-visible source-only copy (no node_modules)
# (Use a regular file-sync tool, NOT a junction, since junctions confuse OneDrive)
```

We did **not** take this path because the product owner explicitly chose to keep the repo in OneDrive.

---

## 2. Configure pnpm to keep its store off OneDrive

pnpm's content-addressed store grows large and **must** live outside OneDrive.

```powershell
# Use a store outside OneDrive
pnpm config set store-dir C:\Users\gondy\.pnpm-store

# Verify
pnpm config get store-dir
# C:\Users\gondy\.pnpm-store
```

This is set once per user; future installs use the off-OneDrive store automatically.

---

## 3. Configure Git for Windows line endings

The repo enforces LF line endings (per `.gitattributes`). Configure Git to honor that:

```powershell
git config --global core.autocrlf input
git config --global core.eol lf
```

---

## Troubleshooting

### `EBUSY: resource busy or locked, rename ...node_modules\.pnpm\...`

OneDrive is locking files mid-install. Pause OneDrive sync (system tray → Pause syncing → 8 hours), re-run `pnpm install`, then re-enable sync **after** install completes.

If it persists after pausing:

```powershell
# Kill OneDrive temporarily
Stop-Process -Name "OneDrive" -Force -ErrorAction SilentlyContinue
pnpm install
Start-Process "$env:LOCALAPPDATA\Microsoft\OneDrive\OneDrive.exe"
```

### `EPERM: operation not permitted, unlink ...`

Same root cause. Same fix.

### Prisma generate fails with "file in use"

Add `node_modules\.prisma` to the exclude patterns in step 1. Then:

```powershell
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
pnpm db:generate
```

### Next.js dev server fails with "Cannot find module" after a sync

The `.next/` cache got partially synced. Delete it:

```powershell
Remove-Item -Recurse -Force "apps\web\.next"
pnpm --filter @tcharts/web dev
```

### Frequent "the cloud operation was not completed within the time period" warnings

The sync is choking on too many tiny files. Verify your exclusions cover every `node_modules` folder at every depth in the monorepo (apps/*/node_modules, packages/*/node_modules, root `node_modules`).

---

## Long-term recommendation

OneDrive is genuinely a poor fit for a monorepo this size. If symptoms persist after the above, **move the repo to `C:\dev\tcharts`**. This is documented as Option C above. Doing so is a 30-second operation and eliminates the entire class of problems.

The decision to remain in OneDrive was made for the product owner's preference; revisit it if friction becomes a productivity tax.
