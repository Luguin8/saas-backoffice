'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function createCompanyUser(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const role = formData.get('role') as string
    const isProfessional = formData.get('isProfessional') === 'on'
    const organizationId = formData.get('organizationId') as string

    // 1. Crear en Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role, organization_id: organizationId }
    })

    if (authError) throw new Error('Error Auth: ' + authError.message)

    // 2. Forzar actualización del perfil
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
            full_name: fullName,
            role: role,
            is_professional: isProfessional,
            organization_id: organizationId
        })
        .eq('id', authData.user.id)

    if (profileError) throw new Error('Error Perfil: ' + profileError.message)

    revalidatePath(`/admin/companies/${organizationId}/edit`)
    return { success: true }
}

export async function getCompanyUsers(organizationId: string) {
    const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
    return data
}

export async function deleteCompanyUser(userId: string, organizationId: string) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    revalidatePath(`/admin/companies/${organizationId}/edit`)
}