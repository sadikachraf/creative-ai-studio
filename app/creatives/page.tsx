'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Script = {
    id: string;
    script: string;
    created_at: string;
};

type Block = {
    id: string;
    block_number: number;
    block_type: string;
    block_text: string;
};

type Creative = {
    name: string;
    framework: string;
    hook_title: string;
    structure: number[];
    strategy_explanation: string;
    suggested_duration: string;
    scroll_stop_score: number;
    conversion_potential: string;
    emotional_trigger: string;
};

export default function CreativesPage() {
    const [scripts, setScripts] = useState<Script[]>([]);
    const [selectedScriptId, setSelectedScriptId] = useState<string>('');
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [creatives, setCreatives] = useState<Creative[] | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch scripts on load
        async function fetchScripts() {
            const { data, error } = await supabase
                .from('scripts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching scripts:', error);
            } else {
                setScripts(data || []);
            }
        }
        fetchScripts();
    }, []);

    useEffect(() => {
        // Fetch blocks whenever script selection changes
        async function fetchBlocks() {
            if (!selectedScriptId) {
                setBlocks([]);
                setCreatives(null);
                return;
            }

            const { data, error } = await supabase
                .from('blocks')
                .select('*')
                .eq('script_id', selectedScriptId)
                .eq('approved', true)
                .order('block_number', { ascending: true });

            if (error) {
                console.error('Error fetching blocks:', error);
            } else {
                setBlocks(data || []);
                setCreatives(null); // Reset creatives when changing script
                setError(null);
            }
        }
        fetchBlocks();
    }, [selectedScriptId]);

    const handleGenerateCreatives = async () => {
        if (!selectedScriptId) return;

        setIsGenerating(true);
        setError(null);
        setCreatives(null);

        try {
            const response = await fetch('/api/generate-creatives', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ script_id: selectedScriptId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate creatives');
            }

            const data = await response.json();
            setCreatives(data.creatives);
        } catch (err: any) {
            setError(err.message || 'Something went wrong while generating creatives');
        } finally {
            setIsGenerating(false);
        }
    };

    const getBlockDetails = (num: number) => blocks.find(b => b.block_number === num);

    return (
        <main className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Creative Dashboard</h1>
                    <p className="text-gray-600">Select a script to generate variations and analyze their creative performance.</p>
                </div>

                {/* Top Section: Script Selection and Generation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-full md:w-1/2 space-y-4">
                        <label htmlFor="script-select" className="block text-sm font-semibold text-gray-700">
                            Select a Saved Script:
                        </label>
                        <select
                            id="script-select"
                            value={selectedScriptId}
                            onChange={(e) => setSelectedScriptId(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none disabled:bg-gray-100"
                            disabled={isGenerating}
                        >
                            <option value="">-- Choose a script --</option>
                            {scripts.map(script => (
                                <option key={script.id} value={script.id}>
                                    {script.script.substring(0, 60)}...
                                </option>
                            ))}
                        </select>
                    </div>
                
                    <div className="w-full md:w-1/2 flex items-end h-full">
                        <button
                            onClick={handleGenerateCreatives}
                            disabled={!selectedScriptId || isGenerating || blocks.length === 0}
                            className="w-full mt-auto md:mt-0 bg-purple-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Strategizing Creatives...
                                </>
                            ) : (
                                'Generate Creatives'
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                {/* Creatives Display Grid */}
                {creatives && creatives.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">AI Ad Variations</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                            {creatives.map((creative, index) => (
                                <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
                                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                                        <h3 className="text-lg font-bold text-gray-900">{creative.name}</h3>
                                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                                            {creative.framework}
                                        </span>
                                    </div>
                                    
                                    <div className="p-6 flex-grow space-y-6">
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Scroll-stopping Hook</div>
                                            <p className="text-lg font-medium text-gray-900 italic">&quot;{creative.hook_title}&quot;</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Score</div>
                                                <div className="text-xl font-black text-indigo-600">{creative.scroll_stop_score} <span className="text-sm font-medium text-gray-500">/ 10</span></div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Potential</div>
                                                <div className="text-lg font-bold text-emerald-600">{creative.conversion_potential}</div>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Emotional Trigger</div>
                                                <div className="text-sm text-gray-800 font-medium">{creative.emotional_trigger}</div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Block Structure ({creative.suggested_duration})</div>
                                            <div className="flex flex-wrap gap-2">
                                                {creative.structure.map((blockNum, i) => {
                                                    const blockData = getBlockDetails(blockNum);
                                                    return (
                                                        <div key={i} className="group relative">
                                                            <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100 border border-gray-300 text-gray-700 font-semibold text-sm cursor-help hover:bg-purple-100 hover:text-purple-700 hover:border-purple-300 transition-colors">
                                                                {blockNum}
                                                            </div>
                                                            {/* Tooltip */}
                                                            {blockData && (
                                                                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded-lg py-2 px-3 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 text-left pointer-events-none z-10 shadow-xl">
                                                                    <strong className="block text-purple-300 uppercase tracking-widest mb-1">{blockData.block_type}</strong>
                                                                    <p className="line-clamp-4 leading-relaxed">&quot;{blockData.block_text}&quot;</p>
                                                                    <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Strategy Explanation</div>
                                            <p className="text-sm text-gray-700 leading-relaxed bg-blue-50/50 p-4 rounded-lg border border-blue-100">{creative.strategy_explanation}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
