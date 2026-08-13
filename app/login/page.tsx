import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Tire Shop Workflow
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Employee Login
          </h1>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}