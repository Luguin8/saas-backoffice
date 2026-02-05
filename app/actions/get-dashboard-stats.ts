'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export type FinancialStats = {
    ars: {
        fiscalBalance: number;
        realBalance: number;
        income: number;
        expense: number;
    };
    usd: {
        fiscalBalance: number;
        realBalance: number;
        income: number;
        expense: number;
    };
};

export async function getDashboardStats(): Promise<FinancialStats> {
    const cookieStore = await cookies();

    // CORRECCIÓN: Usamos createServerClient de @supabase/ssr
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    // En Server Actions de lectura, normalmente no seteamos cookies, pero la firma lo requiere
                }
            },
        }
    );

    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, type, is_fiscal, currency');

    if (error) {
        console.error('Error fetching stats:', error);
        return emptyStats();
    }

    const stats = emptyStats();

    transactions?.forEach((t) => {
        const amount = Number(t.amount);
        const isIncome = t.type === 'income';

        const currencyStats = t.currency === 'USD' ? stats.usd : stats.ars;

        // A. Cálculo Fiscal
        if (t.is_fiscal) {
            if (isIncome) {
                currencyStats.fiscalBalance += amount;
                currencyStats.income += amount;
            } else {
                currencyStats.fiscalBalance -= amount;
                currencyStats.expense += amount;
            }
        }

        // B. Cálculo Real
        if (isIncome) {
            currencyStats.realBalance += amount;
        } else {
            currencyStats.realBalance -= amount;
        }
    });

    return stats;
}

function emptyStats(): FinancialStats {
    return {
        ars: { fiscalBalance: 0, realBalance: 0, income: 0, expense: 0 },
        usd: { fiscalBalance: 0, realBalance: 0, income: 0, expense: 0 }
    };
}