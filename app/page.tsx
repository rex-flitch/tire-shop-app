export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Tire Shop Workflow
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Today&apos;s Jobs
          </h1>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <JobColumn title="Queue" />
          <JobColumn title="In Progress" />
          <JobColumn title="Completed" />
        </section>
      </div>
    </main>
  );
}

type JobColumnProps = {
  title: string;
};

function JobColumn({ title }: JobColumnProps) {
  return (
    <section className="min-h-96 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          0
        </span>
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        No jobs yet
      </div>
    </section>
  );
}