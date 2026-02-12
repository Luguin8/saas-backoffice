'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// --- SERVICIOS ---

export async function getServices(organizationId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name')

    if (error) throw new Error(error.message)
    return data
}

export async function createService(organizationId: string, name: string, price: number, duration: number) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('services')
        .insert({
            organization_id: organizationId,
            name,
            price,
            duration_minutes: duration
        })

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/appointments')
}

export async function deleteService(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/appointments')
}

// --- HORARIOS ---

export async function getWorkingHours(organizationId: string) {
    const supabase = await createClient()
    // Asumimos que la config es general para la org por ahora (profile_id null o del primer admin)
    // Para simplificar MVP, traemos todos los de la org
    const { data, error } = await supabase
        .from('working_hours')
        .select('*')
        .eq('organization_id', organizationId)

    if (error) throw new Error(error.message)
    return data
}

export async function saveWorkingHours(organizationId: string, profileId: string, schedule: any[]) {
    const supabase = await createClient()

    // Primero borramos lo anterior para este perfil (estrategia simple de reemplazo)
    await supabase
        .from('working_hours')
        .delete()
        .eq('organization_id', organizationId)
        .eq('profile_id', profileId)

    // Insertamos los nuevos
    const { error } = await supabase
        .from('working_hours')
        .insert(schedule.map(s => ({
            organization_id: organizationId,
            profile_id: profileId,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            is_enabled: s.is_enabled
        })))

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/appointments')
}

// --- TURNOS (DASHBOARD) ---

export async function getAppointments(organizationId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('appointments')
        .select(`
      *,
      services (name, price)
    `)
        .eq('organization_id', organizationId)
        .order('start_time', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

// --- TURNOS (PÚBLICO) ---

export async function getPublicOrganization(slug: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('organizations')
        .select('id, name, logo_url, primary_color, secondary_color')
        .eq('slug', slug)
        .single()

    if (error) return null
    return data
}

export async function getPublicServices(organizationId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('services')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
    return data || []
}

export async function getBusySlots(organizationId: string, start: string, end: string) {
    const supabase = await createClient()
    // Usamos la RPC que creamos en SQL
    const { data, error } = await supabase
        .rpc('get_busy_slots', {
            p_organization_id: organizationId,
            p_profile_id: null, // Null para ver ocupación de todos si es compartido
            p_date_start: start,
            p_date_end: end
        })

    if (error) console.error(error)
    return data || []
}

export async function createPublicAppointment(data: any) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('appointments')
        .insert({
            organization_id: data.organization_id,
            service_id: data.service_id,
            patient_name: data.patient_name,
            patient_email: data.patient_email,
            patient_phone: data.patient_phone,
            start_time: data.start_time,
            end_time: data.end_time,
            status: 'confirmed' // Opción A: Confirmación automática
        })

    if (error) throw new Error(error.message)
    return { success: true }
}

// Agregar al final del archivo o junto a los otros getters públicos
export async function getPublicProfessionals(organizationId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('organization_id', organizationId)
        .eq('is_professional', true) // Solo trae a los que marcaste como "Profesional"
        .order('full_name')

    if (error) throw new Error(error.message)
    return data
}