'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Creamos un cliente ADMIN con permisos totales (Service Role)
// IMPORTANTE: Esto solo corre en el servidor, nunca expongas esta key al cliente.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function createOrganizationAction(formData: any) {
    try {
        const {
            name, slug, maintenanceFee,
            primaryColor, secondaryColor,
            logoUrl, selectedModules,
            ownerEmail
        } = formData;

        // 1. Generar contraseña segura aleatoria
        const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + "!";

        // 2. Crear el Usuario en Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: ownerEmail,
            password: generatedPassword,
            email_confirm: true, // Auto-confirmamos el email
            user_metadata: {
                full_name: `Admin ${name}`,
                role: 'owner' // Metadata inicial
            }
        });

        if (authError) throw new Error(`Error creando usuario Auth: ${authError.message}`);
        const userId = authData.user.id;

        // 3. Crear la Organización en la BD
        const { data: orgData, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert({
                name,
                slug,
                logo_url: logoUrl,
                base_maintenance_fee: maintenanceFee,
                primary_color: primaryColor,
                secondary_color: secondaryColor,
                status: 'active',
                initial_password: generatedPassword, // Guardamos para verla en el dashboard
                owner_email: ownerEmail
            })
            .select('id')
            .single();

        if (orgError) {
            // Si falla la org, deberíamos borrar el usuario creado para no dejar basura (Rollback manual)
            await supabaseAdmin.auth.admin.deleteUser(userId);
            throw new Error(`Error creando organización DB: ${orgError.message}`);
        }

        const orgId = orgData.id;

        // 4. Crear/Actualizar el Perfil del Dueño y vincularlo
        // Usamos upsert por si el trigger automático ya creó el perfil vacio
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                organization_id: orgId,
                role: 'owner',
                full_name: `Dueño - ${name}`
            });

        if (profileError) throw new Error(`Error vinculando perfil: ${profileError.message}`);

        // 5. Insertar Módulos
        if (selectedModules.length > 0) {
            const modulesToInsert = selectedModules.map((moduleKey: string) => ({
                organization_id: orgId,
                module_key: moduleKey,
                is_enabled: true,
            }));

            const { error: modulesError } = await supabaseAdmin
                .from('organization_modules')
                .insert(modulesToInsert);

            if (modulesError) throw new Error(`Error asignando módulos: ${modulesError.message}`);
        }

        // 6. Revalidar caché para que la lista se actualice
        revalidatePath('/admin/companies');

        return { success: true, message: 'Empresa y Usuario creados correctamente' };

    } catch (error: any) {
        console.error('Server Action Error:', error);
        return { success: false, message: error.message };
    }
}