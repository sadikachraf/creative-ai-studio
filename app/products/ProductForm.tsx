'use client';

import { useActionState, useEffect, useRef } from 'react';
import { addProduct } from './actions';

type ProductFormProps = {
    onSuccess?: () => void;
};

export default function ProductForm({ onSuccess }: ProductFormProps) {
    const [state, formAction, isPending] = useActionState(addProduct, null);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset();
            onSuccess?.();
        }
    }, [state]);

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">

            {state?.error && (
                <div className="mb-4 flex items-center gap-3 p-3.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg border border-red-100">
                    {state.error}
                </div>
            )}

            {state?.success && (
                <div className="mb-4 flex items-center gap-3 p-3.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-100">
                    Product added successfully!
                </div>
            )}

            <form ref={formRef} action={formAction} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                        Product Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-400 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                        placeholder="e.g. AI Image Generator"
                        disabled={isPending}
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        required
                        rows={3}
                        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-400 outline-none disabled:bg-slate-50 disabled:text-slate-400 resize-none"
                        placeholder="Describe what the product does..."
                        disabled={isPending}
                    />
                </div>

                <div>
                    <label htmlFor="benefits" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                        Benefits
                    </label>
                    <textarea
                        id="benefits"
                        name="benefits"
                        required
                        rows={3}
                        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-400 outline-none disabled:bg-slate-50 disabled:text-slate-400 resize-none"
                        placeholder="List the key benefits..."
                        disabled={isPending}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm font-semibold py-2.5 px-5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Adding...
                        </>
                    ) : 'Add Product'}
                </button>
            </form>
        </div>
    );
}
