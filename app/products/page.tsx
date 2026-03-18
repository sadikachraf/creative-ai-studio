'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ProductForm from './ProductForm';

type Product = {
    id: string;
    name: string;
    description: string;
    benefits: string;
    created_at: string;
    scripts?: { id: string; creatives: { id: string }[] }[];
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Delete modal state
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editBenefits, setEditBenefits] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select(`*, scripts ( id, creatives ( id ) )`)
            .order('created_at', { ascending: false });
        if (error) setError(error.message);
        else setProducts(data || []);
        setIsLoading(false);
    }

    // ── EDIT ────────────────────────────────────────────────────────────────────
    const startEdit = (product: Product) => {
        setEditingId(product.id);
        setEditName(product.name);
        setEditDescription(product.description);
        setEditBenefits(product.benefits);
    };

    const cancelEdit = () => setEditingId(null);

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setIsSaving(true);
        setError(null);
        const { error } = await supabase
            .from('products')
            .update({ name: editName, description: editDescription, benefits: editBenefits })
            .eq('id', editingId);
        if (error) {
            setError('Failed to save: ' + error.message);
        } else {
            setProducts(prev => prev.map(p =>
                p.id === editingId ? { ...p, name: editName, description: editDescription, benefits: editBenefits } : p
            ));
            setEditingId(null);
        }
        setIsSaving(false);
    };

    // ── DELETE ───────────────────────────────────────────────────────────────────
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        setError(null);

        try {
            const productId = deleteTarget.id;
            console.log('Deleting product:', productId);

            // 1. Get all script IDs for this product
            const { data: scripts, error: scriptsErr } = await supabase
                .from('scripts')
                .select('id')
                .eq('product_id', productId);
            if (scriptsErr) throw new Error('Failed to fetch scripts: ' + scriptsErr.message);

            const scriptIds = (scripts || []).map((s: any) => s.id);
            console.log('Script IDs to delete:', scriptIds);

            if (scriptIds.length > 0) {
                // 2. Delete all creatives linked to those scripts
                const { error: creativesErr } = await supabase
                    .from('creatives')
                    .delete()
                    .in('script_id', scriptIds);
                if (creativesErr) throw new Error('Failed to delete creatives: ' + creativesErr.message);
                console.log('Creatives deleted.');

                // 3. Delete all blocks linked to those scripts
                const { error: blocksErr } = await supabase
                    .from('blocks')
                    .delete()
                    .in('script_id', scriptIds);
                if (blocksErr) throw new Error('Failed to delete blocks: ' + blocksErr.message);
                console.log('Blocks deleted.');

                // 4. Delete all scripts
                const { error: scriptsDelErr } = await supabase
                    .from('scripts')
                    .delete()
                    .eq('product_id', productId);
                if (scriptsDelErr) throw new Error('Failed to delete scripts: ' + scriptsDelErr.message);
                console.log('Scripts deleted.');
            }

            // 5. Delete the product itself
            const { error: productErr } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);
            if (productErr) throw new Error('Failed to delete product: ' + productErr.message);
            console.log('Product deleted.');

            // Update UI
            setProducts(prev => prev.filter(p => p.id !== productId));
            setDeleteTarget(null);
        } catch (err: any) {
            console.error('Delete error:', err);
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <main className="min-h-[calc(100vh-56px)] p-6 md:p-10">
            <div className="max-w-4xl mx-auto space-y-10">

                {/* Header */}
                <div className="border-b border-slate-200 pb-6">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Library</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage products that power your AI creative generation.</p>
                </div>

                {error && (
                    <div className="flex items-center gap-3 p-3.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg border border-red-100">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                        {error}
                    </div>
                )}

                {/* Add Product Form */}
                <section>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Add Product</p>
                    <ProductForm onSuccess={loadProducts} />
                </section>

                {/* Product List */}
                <section>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                        Existing Products {!isLoading && `(${products.length})`}
                    </p>

                    {isLoading ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                            <svg className="animate-spin h-5 w-5 text-slate-400 mx-auto" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" /></svg>
                            </div>
                            <p className="text-sm text-slate-500">No products yet. Add your first one above.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {products.map((product) => {
                                const scriptCount = product.scripts?.length || 0;
                                const creativeCount = product.scripts?.reduce((acc, s) => acc + (s.creatives?.length || 0), 0) || 0;
                                const isEditing = editingId === product.id;

                                return (
                                    <div key={product.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${isEditing ? 'border-indigo-300 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}>
                                        
                                        {/* Card header */}
                                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                                            <div className="flex gap-2 flex-shrink-0">
                                                <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                                                    {scriptCount} scripts
                                                </span>
                                                <span className="text-xs font-medium bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md border border-violet-100">
                                                    {creativeCount} creatives
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {!isEditing && (
                                                    <>
                                                        <button
                                                            onClick={() => startEdit(product)}
                                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                            title="Edit product"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteTarget(product)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                            title="Delete product"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card body */}
                                        <div className="p-5 space-y-4">
                                            {isEditing ? (
                                                /* ── EDIT FORM ── */
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                                                        <input
                                                            value={editName}
                                                            onChange={e => setEditName(e.target.value)}
                                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                                                        <textarea
                                                            value={editDescription}
                                                            onChange={e => setEditDescription(e.target.value)}
                                                            rows={3}
                                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Benefits</label>
                                                        <textarea
                                                            value={editBenefits}
                                                            onChange={e => setEditBenefits(e.target.value)}
                                                            rows={3}
                                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 pt-1">
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            disabled={isSaving || !editName.trim()}
                                                            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* ── READ VIEW ── */
                                                <>
                                                    <div>
                                                        <h3 className="text-base font-semibold text-slate-900 mb-1" title={product.name}>
                                                            {product.name}
                                                        </h3>
                                                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{product.description}</p>
                                                    </div>
                                                    <div className="pt-3 border-t border-slate-100">
                                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Benefits</p>
                                                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{product.benefits}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            {/* ── DELETE CONFIRMATION MODAL ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                        <div className="p-6">
                            <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-1">Delete Product</h3>
                            <p className="text-sm text-slate-500 mb-2">
                                <span className="font-semibold text-slate-700">{deleteTarget.name}</span>
                            </p>
                            <p className="text-sm text-slate-500 mb-5">
                                This will permanently delete all scripts, blocks, and creatives linked to this product. This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Deleting...
                                        </>
                                    ) : 'Delete Everything'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
