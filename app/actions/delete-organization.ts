'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Cliente Admin (Service Role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function deleteOrganizationAction(orgId: string) {
    try {
        // 1. Buscar usuarios asociados para borrarlos de Auth
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('organization_id', orgId);

        if (profiles && profiles.length > 0) {
            const userIds = profiles.map(p => p.id);
            // Borrar usuarios de Auth (Esto es irreversible)
            for (const userId of userIds) {
                await supabaseAdmin.auth.admin.deleteUser(userId);
            }
        }

        // 2. Borrar la Organización (La BD borrará en cascada módulos y perfiles si está configurada,
        // pero el comando explícito asegura limpieza).
        const { error } = await supabaseAdmin
            .from('organizations')
            .delete()
            .eq('id', orgId);

        if (error) throw new Error(error.message);

        revalidatePath('/admin/companies');
        return { success: true, message: 'Empresa eliminada correctamente' };
    } catch (error: any) {
        console.error('Delete Error:', error);
        return { success: false, message: error.message };
    }
}