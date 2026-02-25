// Constantes de estados de turnos (separadas del 'use server' file)

export type AppointmentStatus = 'confirmed' | 'attended' | 'cancelled' | 'absent' | 'pending_payment' | 'paid'

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
    confirmed: 'Confirmado',
    attended: 'Asistido',
    cancelled: 'Cancelado',
    absent: 'Ausente',
    pending_payment: 'Pend. Pago',
    paid: 'Pagado',
}

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
    confirmed: 'bg-blue-100 text-blue-700',
    attended: 'bg-green-100 text-green-700',
    cancelled: 'bg-slate-100 text-slate-500',
    absent: 'bg-red-100 text-red-700',
    pending_payment: 'bg-amber-100 text-amber-700',
    paid: 'bg-emerald-100 text-emerald-700',
}
