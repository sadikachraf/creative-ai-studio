import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// One-shot migration endpoint — delete or disable after running
export async function GET() {
    try {
        const statements = [
            `ALTER TABLE creatives ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false`,
            `ALTER TABLE creatives ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'`,
            `ALTER TABLE creatives ADD COLUMN IF NOT EXISTS notes text`,
            `ALTER TABLE creatives ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()`,
        ];

        const errors: string[] = [];

        for (const sql of statements) {
            const { error } = await supabase.rpc('exec', { sql }).single();
            if (error) {
                // Try direct approach instead
                errors.push(`${sql.slice(0, 40)}... → ${error.message}`);
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({ message: 'Some statements failed', errors }, { status: 207 });
        }

        return NextResponse.json({ message: 'Migration applied successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
