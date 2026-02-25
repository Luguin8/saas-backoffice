'use server';

import { createClient } from '@/lib/supabase-server';

export async function getTransactions(limit = 50) {
    const supabase = await createClient();

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