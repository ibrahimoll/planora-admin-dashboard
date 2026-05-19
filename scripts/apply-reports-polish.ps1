$path = "app/dashboard/reports/page.tsx"

if (-not (Test-Path $path)) {
  throw "Could not find $path. Run this script from the admin-dashboard root."
}

$resolvedPath = Resolve-Path $path
$text = [System.IO.File]::ReadAllText($resolvedPath)
$text = $text.TrimStart([char]0xFEFF)

$sharedImports = @'
import { AdminEmptyState } from "@/components/ui/AdminEmptyState";
import { AdminLoadingState } from "@/components/ui/AdminLoadingState";
import { GlassCard } from "@/components/ui/GlassCard";
'@.TrimEnd()

if ($text -notmatch 'AdminLoadingState') {
  $text = $text.Replace('import { GlassCard } from "@/components/ui/GlassCard";', $sharedImports)
}

$text = $text -replace '(?m)^\s*Loader2,\r?\n', ''

$refreshButton = @'
<button
            type="button"
            onClick={refreshReports}
            disabled={loadingSummaries || loadingProjects || loadingProjectReport}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-teal-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                loadingSummaries || loadingProjects || loadingProjectReport
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
'@.TrimEnd()

$text = [regex]::Replace(
  $text,
  '<button\s+type="button"\s+onClick=\{refreshReports\}\s+className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2\.5 text-sm font-medium text-slate-200 transition hover:border-teal-500/40 hover:text-white"\s*>\s*<RefreshCw size=\{16\} />\s*Refresh\s*</button>',
  $refreshButton,
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$loadingProjects = @'
<AdminLoadingState
                title="Loading projects"
                message="Fetching projects for report generation."
                rows={3}
              />
'@.TrimEnd()

$text = [regex]::Replace(
  $text,
  '<div className="mt-5 flex items-center gap-2 text-sm text-slate-400">\s*<Loader2 size=\{16\} className="animate-spin" />\s*Loading projects\.\.\.\s*</div>',
  $loadingProjects,
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$emptyProjects = @'
<AdminEmptyState
                icon={FolderKanban}
                title="No projects found"
                message="Projects will appear here when reportable projects exist."
              />
'@.TrimEnd()

$text = [regex]::Replace(
  $text,
  '<p className="mt-5 text-sm text-slate-400">\s*No projects found yet\.\s*</p>',
  $emptyProjects,
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$loadingReport = @'
<AdminLoadingState
            title="Generating project report"
            message="Preparing the selected project report from backend data."
            rows={4}
          />
'@.TrimEnd()

$text = [regex]::Replace(
  $text,
  '<GlassCard>\s*<div className="flex items-center gap-3 text-slate-300">\s*<Loader2 size=\{18\} className="animate-spin text-teal-300" />\s*Generating project report\.\.\.\s*</div>\s*</GlassCard>',
  $loadingReport,
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$summaryLoadingFunction = @'
function LoadingBlock({ label }: { label: string }) {
  return (
    <AdminLoadingState
      title={label}
      message="Preparing report metrics from backend data."
      rows={4}
    />
  );
}
'@.TrimEnd()

$text = [regex]::Replace(
  $text,
  'function LoadingBlock\(\{ label \}: \{ label: string \}\) \{\s*return \(\s*<div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 px-5 py-8 text-slate-300">\s*<Loader2 size=\{20\} className="animate-spin text-teal-300" />\s*\{label\}\s*</div>\s*\);\s*\}',
  $summaryLoadingFunction,
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($resolvedPath, $text, $utf8NoBom)

Write-Host "Updated $path with shared loading and empty states."
