export default function UniversityDashboard() {
  const modules = [
    {
      title: "Students",
      description: "Manage student records, enrollment, and status",
      status: "Coming soon",
    },
    {
      title: "Department Policies",
      description: "View and manage academic rules and guidelines",
      status: "Coming soon",
    },
  ];

  const stats = [
    { label: "Total Students", value: "—" },
    { label: "Departments", value: "—" },
    { label: "Active Internships", value: "—" },
    { label: "Pending Requests", value: "—" },
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          University Dashboard
        </h1>
        <p className="text-slate-600 mt-1">
          Manage academic operations, students, and internship tracking
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
          >
            <div className="text-sm text-slate-500">{stat.label}</div>
            <div className="text-2xl font-semibold text-slate-900 mt-2">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((mod) => (
          <div
            key={mod.title}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {mod.title}
            </h2>
            <p className="text-sm text-slate-600 mt-1">{mod.description}</p>

            <div className="mt-4 inline-block text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
              {mod.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}