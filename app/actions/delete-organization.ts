'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function deleteOrganization(id: string) {
    const supabase = await createClient()

    try {
        // 1. Verificar permisos (Solo superadmin debería poder, o el dueño)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, message: 'No autorizado' }

        // 2. Borrar dependencias en orden
        // Aunque tengamos ON DELETE CASCADE en SQL, esto es doble seguridad.
        await supabase.from('transaction_audit').delete().eq('transaction_id', id) // Si falla por join, ignorar o ajustar si tienes cascade
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
            return { success: false, message: 'Error al eliminar: ' + error.message }
        }

        // Revalidamos la caché para que si el usuario recarga, vea los datos frescos
        revalidatePath('/admin/companies')

        // Retornamos éxito para que el front actualice el estado local sin recargar
        return { success: true, message: 'Organización eliminada correctamente' }

    } catch (error: any) {
        console.error('Server Error:', error)
        return { success: false, message: error.message || 'Error desconocido' }
    }
}