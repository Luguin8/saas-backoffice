import { supabase } from '../supabase';

export type Module = {
    key: string;
    name: string;
    description?: string;
    monthly_price_adder?: number;
};

export type CreateCompanyDTO = {
    name: string;
    slug: string;
    logoFile?: File;
    maintenanceFee: number;
    primaryColor: string;   // <--- NUEVO
    secondaryColor: string; // <--- NUEVO
    selectedModules: string[];
};

export type DashboardStats = {
    activeCompanies: number;
    totalUsers: number;
    mrr: number;
};

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
    owner_email?: string;
    initial_password?: string;
};

export const uploadLogo = async (file: File, slug: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${slug}-${Date.now()}.${fileExt}`;

    // Subir archivo
    const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file);

    if (uploadError) throw new Error(`Error subiendo logo: ${uploadError.message}`);

    // Obtener URL pública
    const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

    return data.publicUrl;
};

export const fetchModules = async (): Promise<Module[]> => {
    const { data, error } = await supabase
        .from('modules')
        .select('key, name, description, monthly_price_adder')
        .eq('is_active', true);

    if (error) throw new Error(error.message);
    return data || [];
};

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
    // 1. Contar usuarios usando la función segura (o política permisiva)
    const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    if (usersError) {
        console.error("Error contando usuarios:", usersError);
        // No lanzamos error para no romper todo el dashboard, retornamos 0
    }

    // 2. Datos financieros
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
        .eq('status', 'active');

    if (orgsError) throw new Error(`Error calculando finanzas: ${orgsError.message}`);

    let mrr = 0;
    const activeCompanies = orgs?.length || 0;

    orgs?.forEach((org) => {
        mrr += Number(org.base_maintenance_fee || 0);
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

export const fetchCompaniesSummary = async (): Promise<CompanySummary[]> => {
    const { data: organizations, error } = await supabase
        .from('organizations')
        .select(`
      *,
      initial_password,
      organization_modules (
        module_key,
        modules (
           name,
           monthly_price_adder
        )
      )
    `);

    if (error) throw new Error(error.message);

    return organizations.map((org: any) => {
        let modulesCost = 0;
        const moduleNames: string[] = [];

        if (org.organization_modules) {
            org.organization_modules.forEach((om: any) => {
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
            owner_email: 'pendiente@asignar.com'
        };
    });
};