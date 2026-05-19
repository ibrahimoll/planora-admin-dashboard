$path = "app/dashboard/tasks/page.tsx"

if (-not (Test-Path $path)) {
  throw "Could not find $path. Run this script from the admin-dashboard root."
}

$text = Get-Content $path -Raw

$text = $text.Replace('import { GlassCard } from "@/components/ui/GlassCard";', 'import { AdminEmptyState } from "@/components/ui/AdminEmptyState";' + "`n" + 'import { AdminLoadingState } from "@/components/ui/AdminLoadingState";' + "`n" + 'import { GlassCard } from "@/components/ui/GlassCard";')
$text = $text.Replace("  Loader2,`n", "")

$text = $text.Replace('''          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-teal-500/40 hover:text-white"
        >
          <RefreshCw size={16} />''', '''          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-teal-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />''')

$text = $text.Replace('''            <GlassCard className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-slate-300">
                <Loader2 size={20} className="animate-spin text-teal-300" />
                Loading tasks...
              </div>
            </GlassCard>''', '''            <AdminLoadingState
              title="Loading tasks"
              message="Fetching task oversight records."
              rows={5}
            />''')

$text = $text.Replace('''            <GlassCard className="py-16 text-center">
              <ListChecks size={36} className="mx-auto text-slate-500" />
              <h3 className="mt-4 text-lg font-semibold text-white">
                No tasks found
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Try changing filters or search text.
              </p>
            </GlassCard>''', '''            <AdminEmptyState
              icon={ListChecks}
              title="No tasks found"
              message="Tasks matching your filters will appear here."
            />''')

$text = $text.Replace('''            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-slate-300">
                <Loader2 size={20} className="animate-spin text-teal-300" />
                Loading task detail...
              </div>
            </div>''', '''            <AdminLoadingState
              title="Loading task detail"
              message="Fetching selected task details."
              rows={4}
            />''')

$text = $text.Replace('''            <div className="py-16 text-center">
              <Timer size={36} className="mx-auto text-slate-500" />
              <h3 className="mt-4 text-lg font-semibold text-white">
                Select a task
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Choose a task from the queue to view details and admin actions.
              </p>
            </div>''', '''            <AdminEmptyState
              icon={Timer}
              title="Select a task"
              message="Choose a task from the queue to view details and admin actions."
            />''')

Set-Content -Path $path -Value $text -Encoding UTF8
Write-Host "Updated $path with shared loading and empty states."
