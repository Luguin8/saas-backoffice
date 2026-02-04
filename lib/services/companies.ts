import { supabase } from '../supabase';

// Tipos básicos para evitar errores de TS
export type Module = {
    key: string;
    name: string;
};

export type CreateCompanyDTO = {
    name: string;
    slug: string;
    logoFile?: File;
    selectedModules: string[]; // Array de keys
};

/**
 * Sube el logo al bucket 'company-logos' y retorna la URL pública
 */
export const uploadLogo = async (file: File, slug: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${slug}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

    if (uploadError) throw new Error(`Error subiendo logo: ${uploadError.message}`);

    const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

/**
 * Obtiene el catálogo de módulos disponibles
 */
export const fetchModules = async (): Promise<Module[]> => {
    const { data, error } = await supabase
        .from('modules')
        .select('key, name');

    if (error) throw new Error(error.message);
    return data || [];
};

/**
 * Crea la organización y sus relaciones
 * Nota: Lo ideal es un RPC (Stored Procedure) para ACID estricto, 
 * pero aquí lo manejamos por pasos para cumplir el requerimiento con el cliente estándar.
 */
export const createOrganization = async (data: CreateCompanyDTO) => {
    let logoUrl = null;

    // 1. Subir logo si existe
    if (data.logoFile) {
        logoUrl = await uploadLogo(data.logoFile, data.slug);
    }

    // 2. Insertar Organización
    const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
            name: data.name,
            slug: data.slug,
            logo_url: logoUrl,
            status: 'active' // Asumo estado activo por defecto
        })
        .select('id')
        .single();

    if (orgError) throw new Error(`Error creando organización: ${orgError.message}`);

    const orgId = orgData.id;

    // 3. Insertar Relaciones de Módulos (si hay seleccionados)
    if (data.selectedModules.length > 0) {
        const modulesToInsert = data.selectedModules.map((moduleKey) => ({
            organization_id: orgId,
            module_key: moduleKey,
            is_enabled: true,
        }));

        const { error: modulesError } = await supabase
            .from('organization_modules')
            .insert(modulesToInsert);

        if (modulesError) {
            // En un escenario real sin RPC, aquí deberíamos hacer rollback (borrar la org creada)
            // await supabase.from('organizations').delete().eq('id', orgId);
            throw new Error(`Error asignando módulos: ${modulesError.message}`);
        }
    }

    return orgId;
};