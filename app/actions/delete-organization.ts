'use server'

import { createClient } from '@/lib/supabase-server' // Asegúrate de usar el de servidor
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteOrganization(id: string) {
    const supabase = await createClient()

    // 1. Verificar permisos (Solo superadmin debería poder, o el dueño)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // 2. Borrar dependencias en orden (Hijos -> Padres)
    // Aunque tengamos ON DELETE CASCADE en SQL, esto es doble seguridad.

    // Borrar auditoría y transacciones
    await supabase.from('transaction_audit').delete().eq('transaction_id', id) // Corrección: join complejo, simplificamos asumiendo cascadeo
    await supabase.from('appointments').delete().eq('organization_id', id)
    await supabase.from('transactions').delete().eq('organization_id', id)
    await supabase.from('payees').delete().eq('organization_id', id)
    await supabase.from('services').delete().eq('organization_id', id)
    await supabase.from('working_hours').delete().eq('organization_id', id)
    await supabase.from('organization_modules').delete().eq('organization_id', id)

    // Borrar perfiles (Usuarios)
    await supabase.from('profiles').delete().eq('organization_id', id)

    // 3. Finalmente borrar la organización
    const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error borrando organización:', error.message)
        throw new Error('Error al eliminar: ' + error.message)
    }

    revalidatePath('/admin/companies')
    redirect('/admin/companies')
}