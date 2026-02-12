'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server'; // Cliente autenticado (Tu usuario)
import { supabaseAdmin } from '@/lib/supabase-admin'; // Cliente admin (Para crear la org)

// 1. Esquema de validación estricto (Zod)
const CreateOrgSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug inválido (solo minúsculas y guiones)"),
    maintenanceFee: z.number().min(0),
    primaryColor: z.string().startsWith('#'),
    secondaryColor: z.string().startsWith('#'),
    logoUrl: z.string().optional(),
    selectedModules: z.array(z.string()),
    ownerEmail: z.string().email("Email inválido"),
});

export async function createOrganizationAction(formData: any) {
    try {
        // 2. VERIFICACIÓN DE SEGURIDAD (Gatekeeper)
        // Verificamos quién está intentando ejecutar esto
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Comparamos con la variable de entorno del Superadmin
        const superAdminEmail = process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;

        if (!user || user.email !== superAdminEmail) {
            console.error(`Intento de acceso no autorizado: ${user?.email}`);
            return { success: false, message: 'No tienes permisos de Superadmin.' };
        }

        // 3. Validación de Datos
        const validatedFields = CreateOrgSchema.safeParse({
            name: formData.name,
            slug: formData.slug,
            maintenanceFee: Number(formData.maintenanceFee),
            primaryColor: formData.primaryColor,
            secondaryColor: formData.secondaryColor,
            logoUrl: formData.logoUrl,
            selectedModules: formData.selectedModules, // Asegúrate de enviar esto como array desde el front
            ownerEmail: formData.ownerEmail
        });

        if (!validatedFields.success) {
            return { success: false, message: 'Datos inválidos: ' + validatedFields.error.issues[0].message };
        }

        const {
            name, slug, maintenanceFee,
            primaryColor, secondaryColor, logoUrl,
            selectedModules, ownerEmail
        } = validatedFields.data;

        // 4. Lógica de Creación (Usando supabaseAdmin)

        // A. Generar contraseña temporal (Solo para mostrar, no guardar en DB)
        const generatedPassword = Math.random().toString(36).slice(-8) + "Aa1!";

        // B. Crear Usuario Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: ownerEmail,
            password: generatedPassword,
            email_confirm: true,
            user_metadata: { full_name: `Admin ${name}` }
        });

        if (authError) throw new Error(`Error Auth: ${authError.message}`);
        const userId = authData.user.id;

        // C. Crear Organización (Sin guardar password)
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
                owner_email: ownerEmail
            })
            .select('id')
            .single();

        if (orgError) {
            await supabaseAdmin.auth.admin.deleteUser(userId); // Rollback usuario
            throw new Error(`Error DB: ${orgError.message}`);
        }

        const orgId = orgData.id;

        // D. Crear Perfil y Vincular
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                organization_id: orgId,
                role: 'owner', // Rol dueño
                full_name: `Dueño - ${name}`
            });

        if (profileError) throw new Error(`Error Perfil: ${profileError.message}`);

        // E. Módulos
        if (selectedModules.length > 0) {
            const modulesToInsert = selectedModules.map((moduleKey) => ({
                organization_id: orgId,
                module_key: moduleKey,
                is_enabled: true,
            }));
            await supabaseAdmin.from('organization_modules').insert(modulesToInsert);
        }

        revalidatePath('/admin/companies');

        // IMPORTANTE: Devolvemos la password al front para mostrarla UNA VEZ
        return {
            success: true,
            message: 'Organización creada',
            tempPassword: generatedPassword
        };

    } catch (error: any) {
        console.error('Create Org Error:', error);
        return { success: false, message: error.message };
    }
}