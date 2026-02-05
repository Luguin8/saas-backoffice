'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getTransactions(limit = 50) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll() } } }
    );

    // CORRECCIÓN: Quitamos 'email' del select de profiles
    const { data, error } = await supabase
        .from('transactions')
        .select(`
      *,
      categories (name),
      payees (name),
      profiles (full_name) 
    `)
        .order('transaction_date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }

    return data;
}