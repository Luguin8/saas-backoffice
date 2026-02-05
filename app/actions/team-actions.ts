'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
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
    const supabaseAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch { }
                },
            },
        }
    );

    const { data: { user: currentUser } } = await supabaseAuth.auth.getUser();
    if (!currentUser) return { success: false, message: 'No autenticado' };

    // 2. Verificar permisos y obtener Organization ID
    // Usamos supabase (el cliente normal) o authAdmin para leer el perfil
    const { data: requester } = await supabaseAuth // Usamos el cliente autenticado para leer el propio perfil
        .from('profiles')
        .select('organization_id, role')
        .eq('id', currentUser.id)
        .single();

    // --- CORRECCIÓN TYPESCRIPT ---
    // Validamos explícitamente que 'requester' exista antes de leer sus propiedades
    if (!requester) {
        return { success: false, message: 'No se encontró el perfil del usuario.' };
    }

    if (!requester.organization_id) {
        return { success: false, message: 'No tienes una organización asignada.' };
    }

    // Solo Dueños y Admins pueden invitar
    if (requester.role === 'employee') {
        return { success: false, message: 'No tienes permisos para agregar miembros.' };
    }
    // -----------------------------

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
        if (!authData.user) throw new Error('No se pudo crear el usuario.');

        // 6. Crear perfil vinculado a la MISMA organización
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authData.user.id,
                organization_id: requester.organization_id, // TypeScript ahora sabe que esto existe
                full_name: fullName,
                role: role as any,
            });

        if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw new Error(profileError.message);
        }

        revalidatePath('/dashboard/teams');
        return {
            success: true,
            message: 'Usuario creado',
            newPassword: tempPassword
        };

    } catch (error: any) {
        return { success: false, message: error.message };
    }
}