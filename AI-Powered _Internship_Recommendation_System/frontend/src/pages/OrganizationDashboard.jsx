export default function OrganizationDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Organization Dashboard</h1>
      <p className="text-slate-600 mt-2">
        Placeholder UI for internships, applications and progress submissions.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {["Internships", "Applications"].map((x) => (
          <div key={x} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-sm font-medium text-slate-600">{x}</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">Coming soon</div>
          </div>
        ))}
      </div>
    </div>
  );
}

