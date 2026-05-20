export default function StudentDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Student Dashboard</h1>
      <p className="text-slate-600 mt-2">
        Placeholder UI for profile, eligibility, applications and recommendations.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {["Eligibility", "Recommendations", "Applications"].map((x) => (
          <div key={x} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-sm font-medium text-slate-600">{x}</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">Coming soon</div>
          </div>
        ))}
      </div>
    </div>
  );
}

