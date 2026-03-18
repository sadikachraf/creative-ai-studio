import Link from 'next/link';

export default function Home() {
  const features = [
    {
      href: '/products',
      icon: (
        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
        </svg>
      ),
      title: 'Products',
      description: 'Manage your product catalog with descriptions and key benefits.',
      label: 'Manage →',
    },
    {
      href: '/scripts',
      icon: (
        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'Workspace',
      description: 'Parse scripts into structured blocks, approve them, then generate ad creatives.',
      label: 'Open →',
    },
  ];

  return (
    <main className="min-h-[calc(100vh-56px)] flex flex-col justify-center items-center p-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            AI-Powered UGC Platform
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">
            Creative AI Studio
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed">
            From raw script to structured ad creatives — in minutes.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href} className="group">
              <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-200 hover:shadow-md transition-all duration-200">
                <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                  {feature.icon}
                </div>
                <h2 className="text-base font-semibold text-slate-900 mb-1.5">{feature.title}</h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{feature.description}</p>
                <span className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                  {feature.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
