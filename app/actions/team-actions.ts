'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Cliente Admin para crear usuarios
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function createTeamMemberAction(formData: FormData) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll() } } }
    );

    // 1. Verificar quien invita (debe ser owner o admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'No autorizado' };

    const { data: requester } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

    if (requester.role === 'employee') return { success: false, message: 'Permisos insuficientes' };

    const email = formData.get('email') as string;
    const fullName = formData.get('fullName') as string;
    const role = formData.get('role') as string; // <--- Nuevo campo

    // Validar rol
    if (!['admin', 'employee'].includes(role)) {
        return { success: false, message: 'Rol inválido' };
    }

    // 2. Crear usuario en Auth (Admin)
    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName }
    });

    if (authError) return { success: false, message: authError.message };

    // 3. Crear Perfil en BD
    if (newUser.user) {
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: newUser.user.id,
                organization_id: requester.organization_id,
                full_name: fullName,
                email: email, // Opcional si agregaste la columna, sino quitalo
                role: role // <--- Guardamos el rol seleccionado
            });

        if (profileError) {
            // Rollback (borrar usuario auth si falla perfil)
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            return { success: false, message: 'Error creando perfil: ' + profileError.message };
        }
    }

    revalidatePath('/dashboard/teams');
    return { success: true, message: `Usuario creado. Pass temporal: ${tempPassword}` };
}