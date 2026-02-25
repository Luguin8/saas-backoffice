'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDashboard } from '@/app/dashboard/context/DashboardContext'
import { Calendar, Clock, Plus, Trash2, Save, Link as LinkIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import {
    getServices,
    createService,
    deleteService,
    getWorkingHours,
    saveWorkingHours,
    getAppointments,
    updateAppointmentStatus,
} from '@/app/actions/appointment-actions'
import {
    APPOINTMENT_STATUS_LABELS,
    APPOINTMENT_STATUS_COLORS,
    type AppointmentStatus
} from '@/lib/appointment-constants'
import { useToast } from '@/app/dashboard/context/ToastContext'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

const STATUS_OPTIONS: AppointmentStatus[] = ['confirmed', 'attended', 'cancelled', 'absent', 'pending_payment', 'paid']

const CALENDAR_HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 8hs a 19hs

export default function AppointmentsPage() {
    const { organization, profile } = useDashboard()
    const { showToast } = useToast()

    const [activeTab, setActiveTab] = useState<'agenda' | 'calendario' | 'config'>('agenda')

    const [services, setServices] = useState<any[]>([])
    const [schedule, setSchedule] = useState<any[]>([])
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filtros agenda
    const [filterProfessional, setFilterProfessional] = useState<string>('all')
    const [filterStatus, setFilterStatus] = useState<string>('all')

    // Calendario
    const [calendarWeek, setCalendarWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))

    // Form servicios
    const [newService, setNewService] = useState({ name: '', price: '', duration: 60 })

    const loadData = useCallback(async () => {
        if (!organization) return
        setLoading(true)
        try {
            const [srv, sch, app] = await Promise.all([
                getServices(organization.id),
                getWorkingHours(organization.id),
                getAppointments(organization.id)
            ])

            setServices(srv || [])
            setAppointments(app || [])

            if (!sch || sch.length === 0) {
                setSchedule(Array.from({ length: 7 }).map((_, i) => ({
                    day_of_week: i,
                    start_time: '09:00',
                    end_time: '18:00',
                    is_enabled: i > 0 && i < 6
                })))
            } else {
                setSchedule(Array.from({ length: 7 }).map((_, i) => {
                    const existing = sch.find((s: any) => s.day_of_week === i)
                    return existing || { day_of_week: i, start_time: '09:00', end_time: '18:00', is_enabled: false }
                }))
            }
        } catch {
            showToast('Error cargando datos', 'error')
        } finally {
            setLoading(false)
        }
    }, [organization, showToast])

    useEffect(() => {
        if (organization) loadData()
    }, [organization, loadData])

    const handleCreateService = async () => {
        if (!newService.name || !newService.price) return
        try {
            await createService(organization!.id, newService.name, Number(newService.price), newService.duration)
            setNewService({ name: '', price: '', duration: 60 })
            loadData()
            showToast('Servicio creado', 'success')
        } catch {
            showToast('Error al crear servicio', 'error')
        }
    }

    const handleDeleteService = async (id: string) => {
        try {
            await deleteService(id)
            loadData()
            showToast('Servicio eliminado', 'success')
        } catch {
            showToast('Error al eliminar servicio', 'error')
        }
    }

    const handleSaveSchedule = async () => {
        if (!profile) return
        try {
            await saveWorkingHours(organization!.id, profile.id, schedule)
            showToast('Horarios guardados', 'success')
        } catch {
            showToast('Error al guardar horarios', 'error')
        }
    }

    const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
        try {
            await updateAppointmentStatus(appointmentId, newStatus)
            setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a))
            showToast('Estado actualizado', 'success')
        } catch {
            showToast('Error al actualizar estado', 'error')
        }
    }

    const handleScheduleChange = (index: number, field: string, value: any) => {
        const newSchedule = [...schedule]
        newSchedule[index] = { ...newSchedule[index], [field]: value }
        setSchedule(newSchedule)
    }

    // Profesionales únicos de los turnos cargados
    const professionals = Array.from(
        new Map(appointments
            .filter(a => a.profiles?.full_name)
            .map(a => [a.profiles?.id, a.profiles])
        ).values()
    )

    const filteredAppointments = appointments.filter(a => {
        if (filterProfessional !== 'all' && a.profile_id !== filterProfessional) return false
        if (filterStatus !== 'all' && a.status !== filterStatus) return false
        return true
    })

    // Días de la semana del calendario
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(calendarWeek, i))

    // Agrupar turnos por día y hora para el calendario
    const getAppointmentsForDayHour = (day: Date, hour: number) => {
        return appointments.filter(a => {
            const apptDate = new Date(a.start_time)
            return isSameDay(apptDate, day) && apptDate.getHours() === hour
        })
    }

    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

    if (loading) return (
        <div className="p-8 flex items-center gap-3 text-slate-500">
            <Clock className="animate-spin w-5 h-5" /> Cargando módulo de turnos...
        </div>
    )

    return (
        <div className="space-y-6">

            {/* Header y Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Turnos</h1>
                    <p className="text-slate-500">Administra tu agenda y configuración</p>
                </div>

                <a
                    href={`/reservar/${organization?.slug}`}
                    target="_blank"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline bg-blue-50 px-3 py-2 rounded-lg shrink-0"
                >
                    <LinkIcon size={14} />
                    <span>Ver página de turnos</span>
                </a>

                <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                    {(['agenda', 'calendario', 'config'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab === 'agenda' ? 'Agenda' : tab === 'calendario' ? 'Calendario' : 'Configuración'}
                        </button>
                    ))}
                </div>
            </div>

            {/* VISTA AGENDA */}
            {activeTab === 'agenda' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Filtros */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3">
                        <h3 className="font-semibold text-slate-800 flex-1">Turnos</h3>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
                        >
                            <option value="all">Todos los estados</option>
                            {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s}>{APPOINTMENT_STATUS_LABELS[s]}</option>
                            ))}
                        </select>
                        {professionals.length > 0 && (
                            <select
                                value={filterProfessional}
                                onChange={e => setFilterProfessional(e.target.value)}
                                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
                            >
                                <option value="all">Todos los profesionales</option>
                                {professionals.map((p: any) => (
                                    <option key={p?.id} value={p?.id}>{p?.full_name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {filteredAppointments.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-sm">
                            No hay turnos para los filtros seleccionados.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredAppointments.map((appt) => (
                                <div key={appt.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-slate-900">
                                            {format(new Date(appt.start_time), "dd MMM yyyy - HH:mm'hs'", { locale: es })}
                                        </div>
                                        <div className="text-sm text-slate-600 mt-0.5">
                                            <span className="font-medium">{appt.patient_name}</span>
                                            {appt.patient_dni && <span className="text-slate-400"> · DNI {appt.patient_dni}</span>}
                                        </div>
                                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                                            {appt.services?.name && <span className="bg-slate-100 px-1.5 py-0.5 rounded">{appt.services.name}</span>}
                                            {appt.patient_phone && <span>📞 {appt.patient_phone}</span>}
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <select
                                            value={appt.status}
                                            onChange={e => handleStatusChange(appt.id, e.target.value as AppointmentStatus)}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-0 cursor-pointer ${APPOINTMENT_STATUS_COLORS[appt.status as AppointmentStatus] ?? 'bg-slate-100 text-slate-600'}`}
                                        >
                                            {STATUS_OPTIONS.map(s => (
                                                <option key={s} value={s}>{APPOINTMENT_STATUS_LABELS[s]}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* VISTA CALENDARIO */}
            {activeTab === 'calendario' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Nav de semana */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <button
                            onClick={() => setCalendarWeek(d => addDays(d, -7))}
                            className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="font-semibold text-slate-800 text-sm">
                            {format(calendarWeek, "d MMM", { locale: es })} – {format(addDays(calendarWeek, 6), "d MMM yyyy", { locale: es })}
                        </span>
                        <button
                            onClick={() => setCalendarWeek(d => addDays(d, 7))}
                            className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-xs border-collapse">
                            <thead>
                                <tr>
                                    <th className="w-14 p-2 border-r border-b border-slate-100 bg-slate-50 text-slate-400 font-normal"></th>
                                    {weekDays.map(day => (
                                        <th key={day.toISOString()} className={`p-2 border-r border-b border-slate-100 font-semibold text-center ${isSameDay(day, new Date()) ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600'}`}>
                                            <div>{format(day, 'EEE', { locale: es }).toUpperCase()}</div>
                                            <div className={`text-lg mt-0.5 ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center mx-auto' : ''}`}>
                                                {format(day, 'd')}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {CALENDAR_HOURS.map(hour => (
                                    <tr key={hour} className="group">
                                        <td className="border-r border-b border-slate-100 text-slate-400 text-right pr-2 py-1 font-mono align-top" style={{ minHeight: '56px' }}>
                                            {hour}:00
                                        </td>
                                        {weekDays.map(day => {
                                            const appts = getAppointmentsForDayHour(day, hour)
                                            return (
                                                <td key={day.toISOString()} className={`border-r border-b border-slate-100 p-1 align-top ${isSameDay(day, new Date()) ? 'bg-blue-50/30' : 'group-hover:bg-slate-50/50'}`} style={{ minHeight: '56px' }}>
                                                    {appts.map(a => (
                                                        <div
                                                            key={a.id}
                                                            className={`text-[10px] leading-tight p-1.5 rounded-md mb-0.5 font-medium truncate ${APPOINTMENT_STATUS_COLORS[a.status as AppointmentStatus] ?? 'bg-slate-100 text-slate-600'}`}
                                                            title={`${a.patient_name} - ${a.services?.name ?? ''}`}
                                                        >
                                                            <div className="font-bold truncate">{a.patient_name}</div>
                                                            <div className="opacity-75 truncate">{a.services?.name}</div>
                                                        </div>
                                                    ))}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VISTA CONFIGURACIÓN */}
            {activeTab === 'config' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Servicios */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-fit">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Clock size={18} /> Servicios Ofrecidos
                            </h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex gap-2 items-end bg-slate-50 p-3 rounded-lg">
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-slate-500">Nombre</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Sesión Individual"
                                        className="w-full text-sm border border-slate-200 rounded-md mt-1 px-2 py-1.5"
                                        value={newService.name}
                                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs font-medium text-slate-500">Precio</label>
                                    <input
                                        type="number"
                                        placeholder="$"
                                        className="w-full text-sm border border-slate-200 rounded-md mt-1 px-2 py-1.5"
                                        value={newService.price}
                                        onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                                    />
                                </div>
                                <div className="w-20">
                                    <label className="text-xs font-medium text-slate-500">Minutos</label>
                                    <input
                                        type="number"
                                        placeholder="60"
                                        className="w-full text-sm border border-slate-200 rounded-md mt-1 px-2 py-1.5"
                                        value={newService.duration}
                                        onChange={(e) => setNewService({ ...newService, duration: Number(e.target.value) })}
                                    />
                                </div>
                                <button
                                    onClick={handleCreateService}
                                    className="bg-slate-900 text-white p-2 rounded-md hover:bg-slate-700 transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {services.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Sin servicios aún.</p>}
                                {services.map((srv) => (
                                    <div key={srv.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                                        <div>
                                            <div className="font-medium text-sm">{srv.name}</div>
                                            <div className="text-xs text-slate-500">{srv.duration_minutes} min · ${srv.price?.toLocaleString()}</div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteService(srv.id)}
                                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Horarios */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Calendar size={18} /> Horarios de Atención
                            </h3>
                            <button
                                onClick={handleSaveSchedule}
                                className="flex items-center gap-2 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Save size={14} /> Guardar
                            </button>
                        </div>
                        <div className="p-4 space-y-1">
                            {schedule.map((day, index) => (
                                <div key={day.day_of_week} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${day.is_enabled ? 'bg-white' : 'bg-slate-50 opacity-60'}`}>
                                    <div className="w-24 font-medium text-sm text-slate-700">{days[day.day_of_week]}</div>

                                    <input
                                        type="checkbox"
                                        checked={day.is_enabled}
                                        onChange={(e) => handleScheduleChange(index, 'is_enabled', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                                    />

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="time"
                                            value={day.start_time.slice(0, 5)}
                                            disabled={!day.is_enabled}
                                            onChange={(e) => handleScheduleChange(index, 'start_time', e.target.value)}
                                            className="text-sm border border-slate-200 rounded-md px-2 py-1 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                        />
                                        <span className="text-slate-400">–</span>
                                        <input
                                            type="time"
                                            value={day.end_time.slice(0, 5)}
                                            disabled={!day.is_enabled}
                                            onChange={(e) => handleScheduleChange(index, 'end_time', e.target.value)}
                                            className="text-sm border border-slate-200 rounded-md px-2 py-1 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}
        </div>
    )
}