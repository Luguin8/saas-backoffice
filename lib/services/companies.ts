import { supabase } from '../supabase';

export type Module = {
    key: string;
    name: string;
    // Agregamos description y precio por si quieres mostrarlos en el futuro
    description?: string;
    monthly_price_adder?: number;
};

export type CreateCompanyDTO = {
    name: string;
    slug: string;
    logoFile?: File;
    maintenanceFee: number; // <--- NUEVO CAMPO
    selectedModules: string[];
};

export const uploadLogo = async (file: File, slug: string): Promise<string | null> => {
    // ... (El código de upload se mantiene igual)
    const fileExt = file.name.split('.').pop();
    const fileName = `${slug}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file);

    if (uploadError) throw new Error(`Error subiendo logo: ${uploadError.message}`);

    const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);
    return data.publicUrl;
};

export const fetchModules = async (): Promise<Module[]> => {
    // Ahora traemos más datos útiles del módulo
    const { data, error } = await supabase
        .from('modules')
        .select('key, name, description, monthly_price_adder')
        .eq('is_active', true); // Solo módulos activos

    if (error) throw new Error(error.message);
    return data || [];
};

export const createOrganization = async (data: CreateCompanyDTO) => {
    let logoUrl = null;

    if (data.logoFile) {
        logoUrl = await uploadLogo(data.logoFile, data.slug);
    }

    // Insertamos ajustándonos a tu nuevo esquema
    const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
            name: data.name,
            slug: data.slug,
            logo_url: logoUrl,
            base_maintenance_fee: data.maintenanceFee, // <--- Guardamos el fee
            status: 'active' // Coincide con tu enum 'active'::org_status
        })
        .select('id')
        .single();

    if (orgError) throw new Error(`Error creando organización: ${orgError.message}`);

    const orgId = orgData.id;

    if (data.selectedModules.length > 0) {
        const modulesToInsert = data.selectedModules.map((moduleKey) => ({
            organization_id: orgId,
            module_key: moduleKey,
            is_enabled: true,
            // activated_at se llena solo con el default del esquema
        }));

        const { error: modulesError } = await supabase
            .from('organization_modules')
            .insert(modulesToInsert);

        if (modulesError) {
            throw new Error(`Error asignando módulos: ${modulesError.message}`);
        }
    }

    return orgId;
};

// ... (imports anteriores)

export type CompanySummary = {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    status: string;
    base_maintenance_fee: number;
    modules_count: number;
    modules_names: string[];
    total_monthly_cost: number;
    owner_email?: string; // Lo agregaremos cuando integremos auth real de la empresa
};

export const fetchCompaniesSummary = async (): Promise<CompanySummary[]> => {
    // 1. Traemos empresas con sus módulos
    const { data: organizations, error } = await supabase
        .from('organizations')
        .select(`
      *,
      organization_modules (
        module_key,
        modules (
           name,
           monthly_price_adder
        )
      )
    `);

    if (error) throw new Error(error.message);

    // 2. Procesamos los datos para "aplanarlos" estilo Excel
    return organizations.map((org: any) => {
        let modulesCost = 0;
        const moduleNames: string[] = [];

        if (org.organization_modules) {
            org.organization_modules.forEach((om: any) => {
                // Accedemos al modulo anidado
                if (om.modules) {
                    modulesCost += Number(om.modules.monthly_price_adder || 0);
                    moduleNames.push(om.modules.name);
                }
            });
        }

        return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            logo_url: org.logo_url,
            status: org.status,
            base_maintenance_fee: Number(org.base_maintenance_fee || 0),
            modules_count: moduleNames.length,
            modules_names: moduleNames,
            total_monthly_cost: Number(org.base_maintenance_fee || 0) + modulesCost,
            owner_email: 'pendiente@asignar.com' // Placeholder hasta que creemos el usuario real
        };
    });
};

export type DashboardStats = {
    activeCompanies: number;
    totalUsers: number;
    mrr: number;
};

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
    // 1. Obtener conteo de usuarios totales
    const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true }); // head: true significa "solo dame el número, no los datos"

    if (usersError) throw new Error(`Error contando usuarios: ${usersError.message}`);

    // 2. Obtener datos financieros de empresas ACTIVAS
    // Traemos solo lo necesario para sumar (fees y módulos)
    const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select(`
            base_maintenance_fee,
            organization_modules (
                modules (
                    monthly_price_adder
                )
            )
        `)
        .eq('status', 'active'); // Solo sumamos empresas activas al MRR

    if (orgsError) throw new Error(`Error calculando finanzas: ${orgsError.message}`);

    // 3. Calcular MRR (Matemática pura en el cliente)
    let mrr = 0;
    const activeCompanies = orgs?.length || 0;

    orgs?.forEach((org) => {
        // A. Sumar mantenimiento base
        mrr += Number(org.base_maintenance_fee || 0);

        // B. Sumar precio de módulos adicionales
        if (org.organization_modules) {
            org.organization_modules.forEach((om: any) => {
                if (om.modules) {
                    mrr += Number(om.modules.monthly_price_adder || 0);
                }
            });
        }
    });

    return {
        activeCompanies,
        totalUsers: totalUsers || 0,
        mrr
    };
};