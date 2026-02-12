'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server'; // <-- Usamos la central

export async function createTransactionAction(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'No autenticado' };

    // Validamos que el usuario tenga organización
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return { success: false, message: 'Sin organización' };

    // Extraer y validar datos básicos
    // Nota: Idealmente aquí también usaríamos Zod en el futuro, pero por ahora limpiamos la conexión.
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
        revalidatePath('/dashboard/movements');
        return { success: true, message: 'Movimiento guardado' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteTransactionAction(id: string) {
    const supabase = await createClient(); // <-- Centralizado

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

export async function updateTransactionAction(formData: FormData) {
    const supabase = await createClient(); // <-- Centralizado

    const id = formData.get('id') as string;
    if (!id) return { success: false, message: 'ID requerido' };

    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const currency = formData.get('currency') as string;
    const type = formData.get('type') as string;
    const is_fiscal = formData.get('is_fiscal') === 'on';
    const category_id = formData.get('category_id') as string;
    const payee_id = formData.get('payee_id') as string;
    const date = formData.get('date') as string;

    try {
        const { error } = await supabase
            .from('transactions')
            .update({
                amount,
                description,
                currency,
                type,
                is_fiscal,
                category_id: category_id || null,
                payee_id: payee_id || null,
                transaction_date: date
            })
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/movements');
        return { success: true, message: 'Movimiento actualizado' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}