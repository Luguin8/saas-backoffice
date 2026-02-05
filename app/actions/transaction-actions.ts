'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Helper corregido usando createServerClient
async function getSupabaseClient() {
    const cookieStore = await cookies();
    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) {
                try {
                    // En server actions a veces necesitamos setear cookies (ej. auth refresh)
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                } catch {
                    // Ignorar si estamos en un contexto donde no se puede escribir
                }
            }
        }
    });
}

export async function createTransactionAction(formData: FormData) {
    const supabase = await getSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'No autenticado' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return { success: false, message: 'Sin organización' };

    // Extraer datos
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const currency = formData.get('currency') as string;
    const type = formData.get('type') as string;
    const is_fiscal = formData.get('is_fiscal') === 'on';
    const category_id = formData.get('category_id') as string;
    const payee_id = formData.get('payee_id') as string;
    const date = formData.get('date') as string || new Date().toISOString();

    try {
        const { error } = await supabase
            .from('transactions')
            .insert({
                organization_id: profile.organization_id,
                profile_id: user.id,
                amount,
                description,
                currency,
                type,
                is_fiscal,
                category_id: category_id || null,
                payee_id: payee_id || null,
                transaction_date: date
            });

        if (error) throw error;

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/movements'); // Asegúrate que esta ruta exista
        return { success: true, message: 'Movimiento guardado' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteTransactionAction(id: string) {
    const supabase = await getSupabaseClient();

    try {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}