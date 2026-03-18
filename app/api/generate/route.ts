import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateBlocksPrompt } from '@/lib/prompt';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { script } = await request.json();

        if (!script) {
            return NextResponse.json({ error: 'Script is required' }, { status: 400 });
        }

        const prompt = generateBlocksPrompt(script);

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' }
        });

        const result = response.choices[0]?.message?.content;

        if (!result) {
            throw new Error('No response from OpenAI');
        }

        const data = JSON.parse(result);
        
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error generating blocks:', error);
        return NextResponse.json({ error: 'Failed to generate blocks' }, { status: 500 });
    }
}
