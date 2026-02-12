'use server';

import { createClient } from '@/lib/supabase-server'; // Usamos el cliente de servidor correcto
import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

// --- ACCIONES DE SUPERADMIN ---

export async function createTeamMemberAction(formData: FormData) {
    // ... (Tu código actual de createTeamMemberAction si lo usas) ...
    // Nota: Como ahora creamos usuarios desde el panel de admin con 'admin-user-actions.ts',
    // esta función quizás ya no la uses, pero la dejamos para no romper nada si la llamas.
    return { success: false, message: "Usar panel de admin" };
}

// --- ACCIÓN FALTANTE PARA VER EQUIPO ---

export async function getOrganizationTeam(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .order('full_name');

    if (error) {
        console.error('Error fetching team:', error);
        return [];
    }

    return data;
}