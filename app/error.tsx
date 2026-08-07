"use client";

type ErrorProps = {
  error: Error;
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-6">
        <h1 className="text-xl font-bold text-red-700">
          Something went wrong
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          {error.message}
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-white"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}