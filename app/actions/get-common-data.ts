'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getCommonData() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll() } } }
    );

    const [categories, payees] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('payees').select('*').order('name')
    ]);

    return {
        categories: categories.data || [],
        payees: payees.data || []
    };
}