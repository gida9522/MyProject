export default function SuperAdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Super Admin Dashboard</h1>
      <p className="text-slate-600 mt-2">
        Placeholder UI for national oversight & analytics.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          "Universities",
          "Students",
          "Graduation Pipeline",
        ].map((x) => (
          <div key={x} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-sm font-medium text-slate-600">{x}</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">—</div>
          </div>
        ))}
      </div>
    </div>
  );
}

