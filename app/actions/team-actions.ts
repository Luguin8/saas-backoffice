'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Cliente Admin para crear usuarios (Service Role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function createTeamMemberAction(formData: FormData) {
    const cookieStore = await cookies();

    // 1. Obtener sesión del usuario actual (quien invita)
    // Usamos el token de la cookie para verificar identidad
    const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll() } } }
    );

    const { data: { user: currentUser } } = await supabaseAuth.auth.getUser();
    if (!currentUser) return { success: false, message: 'No autenticado' };

    // 2. Verificar permisos del usuario actual y obtener su Organization ID
    const { data: requesterProfile } = await supabaseAdmin
        .from('profiles')
        .select('organization_id, role')
        .eq('id', currentUser.id)
        .single();

    if (!requesterProfile || !requesterProfile.organization_id) {
        return { success: false, message: 'No tienes una organización asignada.' };
    }

    // Solo Dueños y Admins pueden invitar
    if (!['owner', 'admin'].includes(requesterProfile.role)) {
        return { success: false, message: 'No tienes permisos para agregar miembros.' };
    }

    // 3. Datos del nuevo miembro
    const email = formData.get('email') as string;
    const fullName = formData.get('fullName') as string;
    const role = formData.get('role') as string;

    // 4. Generar contraseña temporal
    const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";

    try {
        // 5. Crear usuario en Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) throw new Error(authError.message);

        // 6. Crear perfil vinculado a la MISMA organización
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authData.user.id,
                organization_id: requesterProfile.organization_id, // <--- Clave: misma org
                full_name: fullName,
                role: role as any,
                // Guardamos la contraseña temporal en el perfil O retornamos al cliente.
                // Por seguridad, NO la guardaremos en base de datos permanentemente.
                // La retornaremos una sola vez al UI para que el dueño la copie.
            });

        if (profileError) {
            // Rollback: borrar usuario auth si falla perfil
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw new Error(profileError.message);
        }

        revalidatePath('/dashboard/team');
        return {
            success: true,
            message: 'Usuario creado',
            newPassword: tempPassword // Retornamos la pass para mostrarla
        };

    } catch (error: any) {
        return { success: false, message: error.message };
    }
}