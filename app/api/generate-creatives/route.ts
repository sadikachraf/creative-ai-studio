import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';
import { generateCreativesPrompt } from '@/lib/prompt';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { script_id } = await request.json();

        if (!script_id) {
            return NextResponse.json({ error: 'script_id is required' }, { status: 400 });
        }

        // Fetch approved blocks for the given script_id
        const { data: blocks, error: fetchError } = await supabase
            .from('blocks')
            .select('*')
            .eq('script_id', script_id)
            .eq('approved', true)
            .order('block_number', { ascending: true });

        if (fetchError) {
            return NextResponse.json({ error: 'Failed to fetch blocks from database' }, { status: 500 });
        }

        if (!blocks || blocks.length === 0) {
            return NextResponse.json({ error: 'No approved blocks found for this script' }, { status: 404 });
        }

        // Generate prompt and call OpenAI
        const prompt = generateCreativesPrompt(blocks);
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });

        const result = response.choices[0]?.message?.content;
        if (!result) throw new Error('No response from OpenAI');

        const data = JSON.parse(result);

        if (!data.creatives || !Array.isArray(data.creatives)) {
            return NextResponse.json({ error: 'Invalid creative data from AI' }, { status: 500 });
        }

        // Delete old creatives for this script before re-inserting
        await supabase.from('creatives').delete().eq('script_id', script_id);

        // Build rows to insert — include management defaults
        const creativesToInsert = data.creatives.map((c: any) => ({
            script_id,
            name: c.name,
            framework: c.framework,
            hook_title: c.hook_title,
            structure: JSON.stringify(c.structure),
            strategy_explanation: c.strategy_explanation,
            suggested_duration: c.suggested_duration,
            scroll_stop_score: c.scroll_stop_score,
            conversion_potential: c.conversion_potential,
            emotional_trigger: c.emotional_trigger,
            approved: false,
            status: 'pending',
        }));

        // Insert and immediately read back the full rows (with id, created_at, etc.)
        const { data: insertedCreatives, error: insertError } = await supabase
            .from('creatives')
            .insert(creativesToInsert)
            .select();

        if (insertError) {
            console.error('Error saving creatives:', insertError);
            return NextResponse.json({ error: 'Failed to save creatives: ' + insertError.message }, { status: 500 });
        }

        if (!insertedCreatives || insertedCreatives.length === 0) {
            return NextResponse.json({ error: 'Creatives were not saved correctly' }, { status: 500 });
        }

        // Parse JSON structure field back to array for the client
        const clientCreatives = insertedCreatives.map((c: any) => ({
            ...c,
            structure: typeof c.structure === 'string' ? JSON.parse(c.structure) : c.structure,
        }));

        return NextResponse.json({ creatives: clientCreatives });

    } catch (error: any) {
        console.error('Error generating creatives:', error);
        return NextResponse.json({ error: 'Failed to generate creatives: ' + error.message }, { status: 500 });
    }
}
