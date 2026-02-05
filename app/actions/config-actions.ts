'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabaseClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { }
                }
            }
        }
    );
}

export async function createCategoryAction(name: string, type: 'income' | 'expense') {
    const supabase = await getSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'No user' };

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();

    // CORRECCIÓN TYPESCRIPT: Validamos que profile exista antes de leer organization_id
    if (!profile) return { success: false, message: 'Perfil no encontrado' };

    const { data, error } = await supabase
        .from('categories')
        .insert({
            organization_id: profile.organization_id,
            name,
            type
        })
        .select('id, name')
        .single();

    if (error) return { success: false, message: error.message };

    revalidatePath('/dashboard');
    return { success: true, data };
}

export async function createPayeeAction(name: string) {
    const supabase = await getSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'No user' };

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();

    // CORRECCIÓN TYPESCRIPT: Validamos profile aquí también
    if (!profile) return { success: false, message: 'Perfil no encontrado' };

    const { data, error } = await supabase
        .from('payees')
        .insert({
            organization_id: profile.organization_id,
            name
        })
        .select('id, name')
        .single();

    if (error) return { success: false, message: error.message };

    revalidatePath('/dashboard');
    return { success: true, data };
}