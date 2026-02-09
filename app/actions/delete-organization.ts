'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Cliente Admin con permisos totales (Service Role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function deleteOrganizationAction(orgId: string) {
    try {
        console.log(`🗑️ Iniciando borrado de empresa: ${orgId}`);

        // 1. Obtener IDs de usuarios antes de borrar los perfiles
        // Necesitamos esto para limpiar Supabase Auth después
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('organization_id', orgId);

        const userIds = profiles?.map(p => p.id) || [];

        // 2. BORRADO EN CASCADA MANUAL (Orden Crítico)
        // Borramos desde los datos más dependientes hacia arriba.

        // A. Borrar Auditoría (si existe y tiene FK, aunque suele ser cascada, mejor prevenir)
        // Nota: Si transaction_audit tiene 'ON DELETE CASCADE' no hace falta, pero esto asegura.
        // Asumimos que al borrar transacciones se borra su auditoría por DB constraint, 
        // si falla, descomentar línea de abajo.
        // await supabaseAdmin.from('transaction_audit').delete()....

        // B. Borrar Transacciones (Dependen de Org, Perfil, Categoria y Proveedor)
        const { error: txError } = await supabaseAdmin
            .from('transactions')
            .delete()
            .eq('organization_id', orgId);

        if (txError) throw new Error('Error borrando transacciones: ' + txError.message);

        // C. Borrar Categorías y Proveedores (Dependen de Org)
        await supabaseAdmin.from('categories').delete().eq('organization_id', orgId);
        await supabaseAdmin.from('payees').delete().eq('organization_id', orgId);

        // D. Borrar Perfiles (Aquí es donde te daba el error)
        const { error: profError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('organization_id', orgId);

        if (profError) throw new Error('Error borrando perfiles: ' + profError.message);

        // 3. Ahora sí: Borrar la Organización
        const { error: orgError } = await supabaseAdmin
            .from('organizations')
            .delete()
            .eq('id', orgId);

        if (orgError) throw new Error('Error borrando organización: ' + orgError.message);

        // 4. Limpieza Final: Borrar Usuarios de Auth (Irreversible)
        // Hacemos esto al final. Si falla, al menos la empresa ya no existe en la BD.
        if (userIds.length > 0) {
            console.log(`Eliminando ${userIds.length} usuarios de Auth...`);
            await Promise.allSettled(
                userIds.map(id => supabaseAdmin.auth.admin.deleteUser(id))
            );
        }

        revalidatePath('/admin/companies');
        return { success: true, message: 'Empresa y todos sus datos eliminados correctamente.' };

    } catch (error: any) {
        console.error('Delete Error Crítico:', error);
        return { success: false, message: error.message };
    }
}