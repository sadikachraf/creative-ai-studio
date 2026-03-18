'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextPath = searchParams.get('next') || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            router.push(nextPath);
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center px-4">
            <div className="w-full max-w-sm">

                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm mb-4">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Creative AI Studio</h1>
                    <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7">

                    {error && (
                        <div className="flex items-start gap-2.5 p-3.5 mb-5 text-sm text-red-700 bg-red-50 rounded-xl border border-red-100">
                            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                placeholder="you@example.com"
                                disabled={isLoading}
                                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                placeholder="••••••••"
                                disabled={isLoading}
                                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all disabled:opacity-50"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !email || !password}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </>
                            ) : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    Access restricted to authorized users only.
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
