import { PageTransition } from "@/components/ui/PageTransition";
import { Suspense } from "react";
import { SendReportClient } from "./SendReportClient";

export default function SendReportPage() {
  return (
    <PageTransition className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">
            Report Delivery
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Send Project Report
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Open this page from the report request email. Planora fills the project ID and destination automatically, so you only add an admin note.
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <SendReportClient />
      </Suspense>
    </PageTransition>
  );
}
