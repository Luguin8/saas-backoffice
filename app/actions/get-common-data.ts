'use server';

import { createClient } from '@/lib/supabase-server';

export async function getCommonData() {
    const supabase = await createClient();

    const [categories, payees] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('payees').select('*').order('name')
    ]);

    return {
        categories: categories.data || [],
        payees: payees.data || []
    };
}