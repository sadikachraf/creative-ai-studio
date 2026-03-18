'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BlockTooltip from '@/components/BlockTooltip';

type Block = {
    id?: string;
    block_number: number;
    block_type: string;
    block_text: string;
};

type Creative = {
    id?: string;
    script_id?: string;
    name: string;
    framework: string;
    hook_title: string;
    structure: number[];
    strategy_explanation: string;
    suggested_duration: string;
    scroll_stop_score: number;
    conversion_potential: string;
    emotional_trigger: string;
    // Management fields
    approved?: boolean;
    status?: 'pending' | 'in_progress' | 'done';
    notes?: string;
    updated_at?: string;
};

export default function WorkspacePage() {
    // Top Level Data
    const [products, setProducts] = useState<any[]>([]);
    const [savedScripts, setSavedScripts] = useState<any[]>([]);

    // Step 1: Input State
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [scriptName, setScriptName] = useState('');
    const [script, setScript] = useState('');
    
    // Step 2 & 3: Blocks State
    const [blocks, setBlocks] = useState<Block[] | null>(null);
    const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);
    const [isApproved, setIsApproved] = useState(false);

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editType, setEditType] = useState('');
    const [editValue, setEditValue] = useState('');
    
    // UI Delete State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [scriptToDelete, setScriptToDelete] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    // Step 4: Creatives State
    const [creatives, setCreatives] = useState<Creative[] | null>(null);
    
    // Creative management state
    const [editingHookId, setEditingHookId] = useState<string | null>(null);
    const [editingHookValue, setEditingHookValue] = useState('');
    const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
    const [editingNotesValue, setEditingNotesValue] = useState('');

    // Globals
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingCreatives, setIsGeneratingCreatives] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [viewMode, setViewMode] = useState<'manager' | 'execution'>('manager');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const { data: productsData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (productsData) setProducts(productsData);

        const { data: scriptsData } = await supabase.from('scripts').select('*, products(name), creatives(id)').order('created_at', { ascending: false });
        if (scriptsData) setSavedScripts(scriptsData);
    }

    const startNewFlow = () => {
        setSelectedProductId('');
        setScriptName('');
        setScript('');
        setBlocks(null);
        setCurrentScriptId(null);
        setIsApproved(false);
        setCreatives(null);
        setError(null);
        setSuccessMessage(null);
    };

    // ------------------------------------------------------------------------
    // WORKFLOW 1: GENERATE BLOCKS
    // ------------------------------------------------------------------------
    const handleGenerateBlocks = async () => {
        if (!selectedProductId) { setError('Please select a product first.'); return; }
        if (!scriptName.trim()) { setError('Please provide a name for this script.'); return; }
        if (!script.trim()) { setError('Please enter a script first.'); return; }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        setBlocks(null);
        setIsApproved(false);
        setCreatives(null);
        setEditingIndex(null);
        setCurrentScriptId(null);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ script }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate blocks');
            }

            const data = await response.json();
            setBlocks(data.blocks);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    // ------------------------------------------------------------------------
    // WORKFLOW 2: EDIT & APPROVE BLOCKS
    // ------------------------------------------------------------------------
    const startEdit = (index: number) => {
        if (!blocks) return;
        setEditingIndex(index);
        setEditType(blocks[index].block_type);
        setEditText(blocks[index].block_text);
    };

    const cancelEdit = () => { setEditingIndex(null); };

    const saveEdit = () => {
        if (!blocks || editingIndex === null) return;
        const newBlocks = [...blocks];
        newBlocks[editingIndex] = { ...newBlocks[editingIndex], block_type: editType, block_text: editText };
        setBlocks(newBlocks);
        setEditingIndex(null);
    };

    const handleApproveBlocks = async () => {
        if (!blocks || blocks.length === 0 || !script.trim() || !selectedProductId) return;

        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // 1. Create a script record 
            const { data: scriptData, error: scriptError } = await supabase
                .from('scripts')
                .insert([{ script, script_name: scriptName, product_id: selectedProductId }])
                .select('*, products(name)')
                .single();

            if (scriptError) throw new Error('Failed to save the script record: ' + scriptError.message);

            const fetchedScriptId = scriptData.id;
            setCurrentScriptId(fetchedScriptId);

            // 2. Prepare & Insert blocks
            const blocksToInsert = [...blocks]
                .sort((a, b) => a.block_number - b.block_number)
                .map(block => ({
                    script_id: fetchedScriptId,
                    block_number: block.block_number,
                    block_type: block.block_type,
                    block_text: block.block_text,
                    approved: true
                }));

            const { error: blocksError } = await supabase.from('blocks').insert(blocksToInsert);
            if (blocksError) throw new Error('Failed to approve blocks: ' + blocksError.message);

            setSuccessMessage('Blocks approved successfully! You can now generate creatives.');
            setIsApproved(true);
            setEditingIndex(null);
            
            // Add to the UI list instantly
            setSavedScripts(prev => [scriptData, ...prev]);

        } catch (err: any) {
            setError(err.message || 'Error occurred while saving blocks.');
        } finally {
            setIsSaving(false);
        }
    };

    // ------------------------------------------------------------------------
    // WORKFLOW 3: GENERATE CREATIVES
    // ------------------------------------------------------------------------
    const handleGenerateCreatives = async () => {
        if (!currentScriptId) return;

        setIsGeneratingCreatives(true);
        setError(null);
        setCreatives(null);

        try {
            const response = await fetch('/api/generate-creatives', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ script_id: currentScriptId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate creatives');
            }

            const data = await response.json();
            setCreatives(data.creatives);
            
            // Instantly update the sidebar numeric count
            setSavedScripts(prev => prev.map(s => {
                if (s.id === currentScriptId) {
                    return { ...s, creatives: data.creatives };
                }
                return s;
            }));

            setSuccessMessage('Ad logic strategized entirely! Proceed to script out or review variations below.');
        } catch (err: any) {
            setError(err.message || 'Something went wrong while generating creatives');
        } finally {
            setIsGeneratingCreatives(false);
        }
    };

    // ------------------------------------------------------------------------
    // CREATIVE MANAGEMENT
    // ------------------------------------------------------------------------
    const updateCreativeField = async (id: string, patch: Partial<Creative>) => {
        const { error } = await supabase.from('creatives').update(patch).eq('id', id);
        if (error) {
            setError('Update failed: ' + error.message);
            return false;
        }
        setCreatives(prev => prev ? prev.map(c => c.id === id ? { ...c, ...patch } : c) : prev);
        return true;
    };

    const handleApproveCreative = async (creative: Creative) => {
        if (!creative.id) return;
        // Only allow: pending → in_progress. Never go backward.
        if (creative.status !== 'pending') return;
        await updateCreativeField(creative.id, { approved: true, status: 'in_progress' });
    };

    const handleMarkDone = async (creative: Creative) => {
        if (!creative.id) return;
        await updateCreativeField(creative.id, { status: 'done' });
    };

    const handleSaveHook = async (creative: Creative) => {
        if (!creative.id) return;
        const ok = await updateCreativeField(creative.id, { hook_title: editingHookValue });
        if (ok) setEditingHookId(null);
    };

    const handleSaveNotes = async (creative: Creative) => {
        if (!creative.id) return;
        const ok = await updateCreativeField(creative.id, { notes: editingNotesValue });
        if (ok) setEditingNotesId(null);
    };
    // ------------------------------------------------------------------------
    const handleReopenScript = async (id: string) => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const { data: scriptData, error: scriptError } = await supabase.from('scripts').select('*').eq('id', id).single();
            if (scriptError) throw new Error(scriptError.message);

            // Load ALL blocks so the user can still see/edit unapproved ones
            const { data: blocksData, error: blocksError } = await supabase
                .from('blocks')
                .select('*')
                .eq('script_id', id)
                .order('block_number', { ascending: true });
            if (blocksError) throw new Error(blocksError.message);

            // Load saved creatives ordered by creation time
            const { data: creativesData, error: creativesError } = await supabase
                .from('creatives')
                .select('*')
                .eq('script_id', id)
                .order('created_at', { ascending: true });
            if (creativesError) throw new Error(creativesError.message);

            setSelectedProductId(scriptData.product_id || '');
            setScriptName(scriptData.script_name || '');
            setScript(scriptData.script || '');
            setCurrentScriptId(id);
            setBlocks(blocksData || []);
            // isApproved = at least one block has been marked approved
            setIsApproved(!!blocksData && blocksData.some((b: any) => b.approved));
            
            if (creativesData && creativesData.length > 0) {
                const parsedCreatives = creativesData.map(c => ({
                    ...c,
                    structure: typeof c.structure === 'string' ? JSON.parse(c.structure) : c.structure
                }));
                setCreatives(parsedCreatives);
            } else {
                setCreatives(null);
            }
            
            setEditingIndex(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setSuccessMessage('Workspace restored successfully.');
        } catch (err: any) {
            setError('Failed to reopen workspace: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteScript = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // prevent triggering row click
        
        console.log("Delete button clicked, script_id:", id);
        
        if (!id) {
            console.error("Deletion Error: script_id is undefined or empty");
            setError("Cannot delete script: Invalid ID");
            return;
        }

        // Open the custom modal instead of window.confirm
        setScriptToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteScript = async () => {
        if (!scriptToDelete) return;
        const id = scriptToDelete;
        
        setIsDeleteDialogOpen(false);
        setIsSaving(true);
        try {
            console.log("Deleting creatives for script:", id);
            // Delete dependent creatives first
            const creativesResult = await supabase.from('creatives').delete().eq('script_id', id).select();
            console.log("Creatives delete result:", creativesResult);
            if (creativesResult.error) throw new Error(creativesResult.error.message);

            console.log("Deleting blocks for script:", id);
            // Delete dependent blocks next
            const blocksResult = await supabase.from('blocks').delete().eq('script_id', id).select();
            console.log("Blocks delete result:", blocksResult);
            if (blocksResult.error) throw new Error(blocksResult.error.message);

            console.log("Deleting script:", id);
            // Finally delete the base script
            const scriptResult = await supabase.from('scripts').delete().eq('id', id).select();
            console.log("Script delete result:", scriptResult);
            if (scriptResult.error) throw new Error(scriptResult.error.message);
            
            setSavedScripts(prev => prev.filter(s => s.id !== id));
            // If deleting the actively open script, reset state.
            if (currentScriptId === id) startNewFlow();
            setSuccessMessage('Script deleted permanently.');
        } catch (err: any) {
            console.error('Deletion Error:', err);
            setError('Failed to delete script: ' + err.message);
        } finally {
            setIsSaving(false);
            setScriptToDelete(null);
        }
    };

    const getBlockDetails = (num: number) => blocks?.find(b => b.block_number === num);

    return (
        <div className="min-h-[calc(100vh-56px)] bg-[#f7f8fa] flex flex-col md:flex-row">
            {/* SIDEBAR: SCRIPT HISTORY */}
            <div className={`flex-shrink-0 bg-white border-r border-slate-100 transition-all duration-300 md:h-[calc(100vh-56px)] overflow-y-auto ${isSidebarOpen ? 'w-full md:w-72 lg:w-80' : 'hidden md:flex md:w-0 overflow-hidden'}`}>
                <div className="p-5 w-full md:w-72 lg:w-80">
                    <div className="flex items-center justify-between mb-5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">History</span>
                        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 p-1 rounded-md">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    {savedScripts.length === 0 ? (
                         <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-xs text-slate-400">
                             No scripts yet.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(
                                savedScripts.reduce((acc: any, s: any) => {
                                    const pName = s.products?.name || 'Uncategorized';
                                    if (!acc[pName]) acc[pName] = [];
                                    acc[pName].push(s);
                                    return acc;
                                }, {})
                            ).map(([productName, scripts]: any) => (
                                <div key={productName} className="overflow-hidden">
                                    <div className="px-3 py-2 flex items-center gap-2 border-b border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{productName}</span>
                                        <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{scripts.length}</span>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {scripts.map((s: any) => (
                                            <div 
                                                key={s.id} 
                                                onClick={() => {
                                                    if(!isSaving && !isLoading) {
                                                        handleReopenScript(s.id);
                                                        if(window.innerWidth < 768) setIsSidebarOpen(false);
                                                    }
                                                }}
                                                className={`p-3 relative hover:bg-indigo-50/30 transition-colors flex flex-col justify-between gap-2 group ${isSaving || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                            >
                                                <div className="flex items-start justify-between gap-3 pr-8">
                                                    <span className="font-medium text-slate-800 truncate text-sm group-hover:text-indigo-600 transition-colors leading-tight">
                                                        {s.script_name || 'Untitled'}
                                                    </span>
                                                    <div className="absolute right-3 top-3 z-10">
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => handleDeleteScript(s.id, e)} 
                                                            disabled={isSaving || isLoading} 
                                                            className="text-gray-300 hover:text-red-500 transition-colors focus:outline-none opacity-0 group-hover:opacity-100 bg-white md:bg-transparent rounded px-1 group-hover:block" 
                                                            title="Delete Script"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between mt-1.5">
                                                    <div className="text-[10px] text-slate-300 tabular-nums">
                                                        {new Date(s.created_at).toLocaleDateString()}
                                                    </div>
                                                    {s.creatives && s.creatives.length > 0 && (
                                                        <span className="bg-indigo-50 text-indigo-500 text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                                                            {s.creatives.length} creative{s.creatives.length !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN WORKSPACE VIEWPORT */}
            <main className="flex-grow p-5 md:p-8 md:h-[calc(100vh-56px)] overflow-y-auto w-full relative">
                {!isSidebarOpen && (
                    <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 hidden md:block">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="bg-white border border-slate-200 text-slate-600 p-2 rounded-lg shadow-sm hover:bg-slate-50 flex items-center gap-1.5 text-xs font-semibold transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                            History
                        </button>
                    </div>
                )}
                <div className="md:hidden mb-4 rounded-xl border border-gray-200 bg-white p-2 shadow-sm flex items-center justify-between">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-gray-600 p-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-bold"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        <span>History Menu</span>
                    </button>
                </div>

                <div className={`mx-auto ${!isSidebarOpen ? 'max-w-5xl md:px-12' : 'max-w-4xl'} space-y-8 transition-all duration-300`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workspace</h1>
                            <p className="text-sm text-slate-500 mt-0.5">Parse scripts, approve blocks, generate ad creatives.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Mode Toggle */}
                            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
                                <button
                                    onClick={() => setViewMode('manager')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'manager' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Manager
                                </button>
                                <button
                                    onClick={() => setViewMode('execution')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'execution' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    ⚡ Execution
                                </button>
                            </div>
                            {viewMode === 'manager' && (
                                <button
                                    onClick={startNewFlow}
                                    className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    New Script
                                </button>
                            )}
                        </div>
                    </div>

                {error && (
                    <div className="flex items-center gap-3 p-3.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg border border-red-100">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                        {error}
                    </div>
                )}
                
                {successMessage && (
                    <div className="flex items-center gap-3 p-3.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-100">
                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                        {successMessage}
                    </div>
                )}

                {/* STEP 1: SCRIPT INPUT — Manager Only */}
                {viewMode === 'manager' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">1</span>
                        <h2 className="text-base font-semibold text-slate-900">Script Input</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        <div>
                            <label htmlFor="product" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Product</label>
                            <select
                                id="product"
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
                                disabled={isLoading || isSaving || isApproved}
                            >
                                <option value="">Select a product...</option>
                                {products.map(product => (
                                    <option key={product.id} value={product.id}>{product.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="scriptName" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Script Name</label>
                            <input
                                id="scriptName"
                                type="text"
                                value={scriptName}
                                onChange={(e) => setScriptName(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
                                placeholder="e.g., Summer Sale Hook Test"
                                disabled={isLoading || isSaving || isApproved}
                            />
                        </div>
                    </div>

                    <label htmlFor="script" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Script Content</label>
                    <textarea
                        id="script"
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-indigo-400 transition-colors resize-y mb-5 disabled:bg-slate-50 disabled:text-slate-400 leading-relaxed"
                        placeholder="Paste your raw UGC script here..."
                        disabled={isLoading || isSaving || isApproved}
                    />

                    {!isApproved && (
                        <button
                            onClick={handleGenerateBlocks}
                            disabled={isLoading || isSaving || !script.trim() || !selectedProductId || !scriptName.trim()}
                            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Analyzing...
                                </>
                            ) : (
                                'Generate Blocks →'
                            )}
                        </button>
                    )}
                </div>
                )}

                {/* STEP 2: BLOCKS REVIEW & APPROVAL — Manager Only */}
                {viewMode === 'manager' && blocks && blocks.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 pb-4 border-b border-slate-100 gap-3">
                            <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white ${isApproved ? 'bg-emerald-500' : 'bg-indigo-600'}`}>2</span>
                                <h2 className="text-base font-semibold text-slate-900">Narrative Blocks</h2>
                            </div>
                            
                            {isApproved ? (
                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                    Approved & Locked
                                </span>
                            ) : (
                                <button
                                    onClick={handleApproveBlocks}
                                    disabled={isSaving || editingIndex !== null}
                                    className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Saving...' : 'Approve Blocks →'}
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            {blocks.map((block, index) => (
                                <div key={index} className={`flex flex-col md:flex-row md:gap-4 items-start rounded-xl p-3 transition-colors relative group ${editingIndex === index ? 'bg-indigo-50 border border-indigo-200 shadow-sm' : 'hover:bg-gray-50 border border-transparent'}`}>
                                    <div className="w-full md:w-32 flex-shrink-0 mb-2 md:mb-0 pt-2">
                                        <div className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Block {block.block_number}</div>
                                        {editingIndex === index ? (
                                            <input type="text" value={editType} onChange={(e) => setEditType(e.target.value)} className="w-full border border-indigo-300 rounded px-2 py-1 text-sm font-bold text-gray-900 focus:outline-none" />
                                        ) : (
                                            <div className="text-gray-900 font-bold">{block.block_type}</div>
                                        )}
                                    </div>

                                    <div className="w-full flex-grow relative">
                                        {editingIndex === index ? (
                                            <div className="w-full">
                                                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} className="w-full p-3 border border-indigo-300 rounded-lg text-gray-800 leading-relaxed focus:outline-none" />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-md">Cancel</button>
                                                    <button onClick={saveEdit} className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">Save Segment</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full p-4 bg-white border border-gray-200 rounded-xl text-gray-800 leading-relaxed shadow-sm">
                                                &quot;{block.block_text}&quot;
                                            </div>
                                        )}
                                    </div>
                                    
                                    {!isApproved && editingIndex !== index && (
                                        <div className="absolute top-4 right-4 md:right-0 md:-mr-12 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(index)} className="text-gray-400 hover:text-indigo-600 p-2 bg-white rounded-full shadow-sm border border-gray-200" title="Edit block">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* STEP 3 TRIGGER: GENERATE CREATIVES */}
                        {isApproved && !creatives && (
                            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                                <button
                                    onClick={handleGenerateCreatives}
                                    disabled={isGeneratingCreatives}
                                    className="bg-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 transition-all flex items-center shadow-md animate-pulse hover:animate-none"
                                >
                                    {isGeneratingCreatives ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Strategizing Creatives Engine...
                                        </>
                                    ) : (
                                        'Step 3: Synthesize Ad Creatives'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: CREATIVE SECTION — Manager Only */}
                {viewMode === 'manager' && creatives && creatives.length > 0 && (
                    <div className="bg-transparent animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <h2 className="text-2xl font-black text-gray-900 flex items-center">
                                <span className="bg-purple-100 text-purple-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                                Synthesized Ad Variations
                            </h2>
                            <button
                                onClick={handleGenerateCreatives}
                                disabled={isGeneratingCreatives}
                                className="bg-white text-purple-700 border border-purple-200 font-bold py-2.5 px-6 rounded-lg hover:bg-purple-50 transition-colors flex items-center focus:outline-none shadow-sm text-sm disabled:opacity-50"
                            >
                                {isGeneratingCreatives ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Re-Strategizing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                        Regenerate Layouts
                                    </>
                                )}
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {creatives.map((creative, index) => (
                                <div key={creative.id || index} className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 ${
                                    creative.status === 'done' ? 'border-emerald-200 shadow-sm' :
                                    creative.status === 'in_progress' ? 'border-amber-200 shadow-sm' :
                                    'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                                }`}>
                                    <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100">
                                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">{creative.name}</h3>
                                        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                            {creative.framework}
                                        </span>
                                    </div>
                                    
                                    <div className="p-6 flex-grow space-y-5">
                                        {/* HOOK TITLE with Edit */}
                                        <div className="p-5 rounded-xl bg-indigo-50/60 border border-indigo-100 relative">
                                            <div className="text-[10px] text-indigo-400 uppercase font-bold tracking-[0.18em] mb-3">Hook</div>
                                            {editingHookId === creative.id ? (
                                                <div className="flex flex-col gap-2">
                                                    <textarea
                                                        className="w-full text-base font-bold text-slate-900 bg-white border border-indigo-200 rounded-lg p-3 focus:outline-none resize-none leading-snug"
                                                        rows={3}
                                                        value={editingHookValue}
                                                        onChange={e => setEditingHookValue(e.target.value)}
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => setEditingHookId(null)} className="text-xs text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold">Cancel</button>
                                                        <button onClick={() => handleSaveHook(creative)} className="text-xs text-white px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-semibold">Save</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="text-xl font-black text-slate-900 leading-snug tracking-tight">
                                                        &ldquo;{creative.hook_title}&rdquo;
                                                    </p>
                                                    {creative.id && (
                                                        <button
                                                            onClick={() => { setEditingHookId(creative.id!); setEditingHookValue(creative.hook_title); }}
                                                            title="Edit Hook"
                                                            className="flex-shrink-0 text-indigo-300 hover:text-indigo-500 mt-0.5 transition-colors p-1 rounded-md hover:bg-indigo-100"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                                                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Score</div>
                                                <div className="text-xl font-black text-indigo-600">{creative.scroll_stop_score}<span className="text-xs font-semibold text-slate-300 ml-0.5">/10</span></div>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 col-span-2">
                                                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Conversion</div>
                                                <div className="text-sm font-bold text-emerald-600 leading-tight">{creative.conversion_potential}</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 col-span-3">
                                                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Trigger</div>
                                                <div className="text-sm text-slate-700 font-medium">{creative.emotional_trigger}</div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2.5">Structure · {creative.suggested_duration}</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {creative.structure.map((blockNum, i) => {
                                                    const blockData = getBlockDetails(blockNum);
                                                    if (!blockData) return null;
                                                    return (
                                                        <BlockTooltip 
                                                            key={i}
                                                            blockNum={blockNum} 
                                                            blockType={blockData.block_type} 
                                                            blockText={blockData.block_text} 
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Strategy</div>
                                            <p className="text-sm text-slate-500 leading-relaxed">{creative.strategy_explanation}</p>
                                        </div>

                                        {/* NOTES */}
                                        <div className="pt-4 border-t border-slate-100">
                                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Notes</div>
                                            {editingNotesId === creative.id ? (
                                                <div className="flex flex-col gap-2">
                                                    <textarea
                                                        className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none leading-relaxed"
                                                        rows={3}
                                                        placeholder="Add notes for the editor..."
                                                        value={editingNotesValue}
                                                        onChange={e => setEditingNotesValue(e.target.value)}
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => setEditingNotesId(null)} className="text-xs text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold">Cancel</button>
                                                        <button onClick={() => handleSaveNotes(creative)} className="text-xs text-white px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 font-semibold">Save Note</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => { if (creative.id) { setEditingNotesId(creative.id); setEditingNotesValue(creative.notes || ''); } }}
                                                    className="text-sm text-slate-400 italic cursor-pointer hover:bg-slate-50 rounded-xl px-3 py-2 transition-colors min-h-[36px] flex items-center border border-transparent hover:border-slate-200"
                                                >
                                                    {creative.notes || 'Click to add a note...'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* MANAGEMENT FOOTER */}
                                    {creative.id && (
                                        <div className="border-t border-slate-100 px-6 py-3.5 flex items-center justify-between gap-3 bg-slate-50/40">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                                                creative.status === 'done'        ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                creative.status === 'in_progress' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                'bg-slate-100 text-slate-400 border-slate-200'
                                            }`}>
                                                {creative.status === 'done' ? '✓ Done' : creative.status === 'in_progress' ? 'In Progress' : 'Pending'}
                                            </span>
                                            <div className="flex gap-2">
                                                {creative.status !== 'done' && (
                                                    <button
                                                        onClick={() => handleMarkDone(creative)}
                                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                                    >
                                                        Mark Done
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleApproveCreative(creative)}
                                                    disabled={creative.status !== 'pending'}
                                                    title={creative.status !== 'pending' ? 'Already approved' : 'Approve this creative'}
                                                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                                                        creative.status === 'pending'
                                                            ? 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                                                            : 'bg-indigo-600 text-white border-indigo-600 cursor-not-allowed opacity-70'
                                                    }`}
                                                >
                                                    {creative.status === 'pending' ? 'Approve' : '✓ Approved'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ======================================================= */}
                {/* EXECUTION MODE VIEW                                       */}
                {/* ======================================================= */}
                {viewMode === 'execution' && (
                    <div className="space-y-6">
                        {/* No creatives loaded yet */}
                        {!creatives || creatives.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                                </div>
                                <p className="text-sm font-semibold text-slate-700 mb-1">No creatives to execute</p>
                                <p className="text-xs text-slate-400">Open a script from the history panel, or switch to Manager Mode to generate creatives.</p>
                            </div>
                        ) : (
                            <>
                                {/* Script name header */}
                                {scriptName && (
                                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <span className="text-sm font-semibold text-slate-700">{scriptName}</span>
                                        <span className="text-xs text-slate-400">{creatives.length} creative{creatives.length !== 1 ? 's' : ''}</span>
                                    </div>
                                )}

                                {/* SCRIPT BLOCKS — context panel */}
                                {blocks && blocks.length > 0 && (
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Script Blocks</span>
                                            </div>
                                            <span className="text-[10px] text-slate-300 font-medium">{blocks.length} blocks</span>
                                        </div>
                                        <div className="divide-y divide-slate-50">
                                            {[...blocks].sort((a, b) => a.block_number - b.block_number).map((block) => (
                                                <div key={block.id || block.block_number} className="flex gap-4 px-5 py-4 items-start">
                                                    {/* Block number + type */}
                                                    <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
                                                        <span className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-500">
                                                            {block.block_number}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                                            {block.block_type}
                                                        </span>
                                                        <p className="text-sm text-slate-800 leading-relaxed font-medium" dir="auto">
                                                            {block.block_text}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Execution creative cards */}
                                <div className="grid grid-cols-1 gap-4">
                                    {creatives.map((creative, index) => (
                                        <div
                                            key={creative.id || index}
                                            className={`bg-white rounded-xl border overflow-hidden transition-all ${
                                                creative.status === 'done' ? 'border-emerald-200 opacity-70' :
                                                creative.status === 'in_progress' ? 'border-amber-200' :
                                                'border-slate-200'
                                            }`}
                                        >
                                            {/* Card header: name + status */}
                                            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                                                <span className="text-xs font-semibold text-slate-500">{creative.name}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                    creative.status === 'done'        ? 'bg-emerald-100 text-emerald-700' :
                                                    creative.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {creative.status === 'done' ? '✓ Done' : creative.status === 'in_progress' ? 'In Progress' : 'Pending'}
                                                </span>
                                            </div>

                                            <div className="p-5 space-y-5">
                                                {/* HOOK — dominant */}
                                                <div>
                                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-2">Hook</p>
                                                    <p className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                                                        &ldquo;{creative.hook_title}&rdquo;
                                                    </p>
                                                </div>

                                                {/* STRUCTURE */}
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Structure · {creative.suggested_duration}</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {creative.structure.map((blockNum, i) => {
                                                            const blockData = getBlockDetails(blockNum);
                                                            return (
                                                                <span key={i} className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                                                                    <span className="text-indigo-400 font-black">{blockNum}</span>
                                                                    {blockData?.block_type || ''}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* MANAGER NOTES */}
                                                {creative.notes && (
                                                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Manager Note</p>
                                                        <p className="text-sm text-amber-900 leading-relaxed">{creative.notes}</p>
                                                    </div>
                                                )}

                                                {/* EDITOR NOTE INPUT */}
                                                <div>
                                                    {editingNotesId === creative.id ? (
                                                        <div className="flex flex-col gap-2">
                                                            <textarea
                                                                className="w-full text-sm text-slate-700 bg-white border border-slate-300 rounded-lg p-3 focus:border-indigo-400 resize-none"
                                                                rows={2}
                                                                placeholder="Add your note..."
                                                                value={editingNotesValue}
                                                                onChange={e => setEditingNotesValue(e.target.value)}
                                                            />
                                                            <div className="flex gap-2 justify-end">
                                                                <button onClick={() => setEditingNotesId(null)} className="text-xs text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold">Cancel</button>
                                                                <button onClick={() => handleSaveNotes(creative)} className="text-xs text-white px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 font-semibold">Save</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => { if (creative.id) { setEditingNotesId(creative.id); setEditingNotesValue(creative.notes || ''); } }}
                                                            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                            {creative.notes ? 'Edit note' : 'Add note'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Footer: Mark Done */}
                                            {creative.status !== 'done' && creative.id && (
                                                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                                                    <button
                                                        onClick={() => handleMarkDone(creative)}
                                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                        Mark as Done
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                </div>
            </main>

            {/* DELETE SCRIPT CONFIRMATION MODAL */}
            {isDeleteDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Delete Script</h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                Are you sure you want to delete this script? This action cannot be undone and will permanently erase all associated variables.
                            </p>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-100">
                            <button
                                onClick={confirmDeleteScript}
                                disabled={isSaving}
                                className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setIsDeleteDialogOpen(false);
                                    setScriptToDelete(null);
                                }}
                                disabled={isSaving}
                                className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
