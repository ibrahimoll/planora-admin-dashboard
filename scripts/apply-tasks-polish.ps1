$path = "app/dashboard/tasks/page.tsx"

if (-not (Test-Path $path)) {
  throw "Could not find $path. Run this script from the admin-dashboard root."
}

$text = Get-Content $path -Raw
$text = $text.TrimStart([char]0xFEFF)

if ($text -notmatch 'AdminEmptyState') {
  $text = $text -replace 'import \{ GlassCard \} from "@/components/ui/GlassCard";', "import { AdminEmptyState } from \"@/components/ui/AdminEmptyState\";`nimport { AdminLoadingState } from \"@/components/ui/AdminLoadingState\";`nimport { GlassCard } from \"@/components/ui/GlassCard\";"
}

$text = $text -replace '(?m)^\s*Loader2,\r?\n', ''
$text = $text -replace ' Â· ', ' - '

$text = [regex]::Replace(
  $text,
  '<button\s+type="button"\s+onClick=\{\(\) => void fetchTasks\(\)\}\s+className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2\.5 text-sm font-medium text-slate-200 transition hover:border-teal-500/40 hover:text-white"\s*>\s*<RefreshCw size=\{16\} />\s*Refresh\s*</button>',
  '<button
          type="button"
          onClick={() => void fetchTasks()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-teal-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>',
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$text = [regex]::Replace(
  $text,
  '<GlassCard className="flex items-center justify-center py-16">\s*<div className="flex items-center gap-3 text-slate-300">\s*<Loader2 size=\{20\} className="animate-spin text-teal-300" />\s*Loading tasks\.\.\.\s*</div>\s*</GlassCard>',
  '<AdminLoadingState
              title="Loading tasks"
              message="Fetching task oversight records."
              rows={5}
            />',
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$text = [regex]::Replace(
  $text,
  '<GlassCard className="py-16 text-center">\s*<ListChecks size=\{36\} className="mx-auto text-slate-500" />\s*<h3 className="mt-4 text-lg font-semibold text-white">\s*No tasks found\s*</h3>\s*<p className="mt-2 text-sm text-slate-400">\s*Try changing filters or search text\.\s*</p>\s*</GlassCard>',
  '<AdminEmptyState
              icon={ListChecks}
              title="No tasks found"
              message="Tasks matching your filters will appear here."
            />',
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$text = [regex]::Replace(
  $text,
  '<div className="flex items-center justify-center py-16">\s*<div className="flex items-center gap-3 text-slate-300">\s*<Loader2 size=\{20\} className="animate-spin text-teal-300" />\s*Loading task detail\.\.\.\s*</div>\s*</div>',
  '<AdminLoadingState
              title="Loading task detail"
              message="Fetching selected task details."
              rows={4}
            />',
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$text = [regex]::Replace(
  $text,
  '<div className="py-16 text-center">\s*<Timer size=\{36\} className="mx-auto text-slate-500" />\s*<h3 className="mt-4 text-lg font-semibold text-white">\s*Select a task\s*</h3>\s*<p className="mt-2 text-sm leading-6 text-slate-400">\s*Choose a task from the queue to view details and admin actions\.\s*</p>\s*</div>',
  '<AdminEmptyState
              icon={Timer}
              title="Select a task"
              message="Choose a task from the queue to view details and admin actions."
            />',
  [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $path), $text, $utf8NoBom)

Write-Host "Updated $path with shared loading and empty states."
