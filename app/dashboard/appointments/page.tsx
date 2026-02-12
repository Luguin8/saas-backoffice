'use client'

import { useState, useEffect } from 'react'
import { useDashboard } from '@/app/dashboard/context/DashboardContext'
import { Calendar, Clock, Plus, Trash2, Save, Link as LinkIcon } from 'lucide-react'
import {
    getServices,
    createService,
    deleteService,
    getWorkingHours,
    saveWorkingHours,
    getAppointments
} from '@/app/actions/appointment-actions'
import { useToast } from '@/app/dashboard/context/ToastContext'

export default function AppointmentsPage() {
    const { organization, profile } = useDashboard()
    const { showToast } = useToast()

    // Estado de vistas
    const [activeTab, setActiveTab] = useState<'agenda' | 'config'>('agenda')

    // Datos
    const [services, setServices] = useState<any[]>([])
    const [schedule, setSchedule] = useState<any[]>([])
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Forms
    const [newService, setNewService] = useState({ name: '', price: '', duration: 60 })

    useEffect(() => {
        if (organization) loadData()
    }, [organization])

    async function loadData() {
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

            // Inicializar horario si está vacío (Lunes a Viernes default)
            if (!sch || sch.length === 0) {
                const defaultSchedule = Array.from({ length: 7 }).map((_, i) => ({
                    day_of_week: i, // 0 Domingo
                    start_time: '09:00',
                    end_time: '18:00',
                    is_enabled: i > 0 && i < 6 // Lunes a Viernes
                }))
                setSchedule(defaultSchedule)
            } else {
                // Rellenar días que falten
                const completeSchedule = Array.from({ length: 7 }).map((_, i) => {
                    const existing = sch.find((s: any) => s.day_of_week === i)
                    return existing || {
                        day_of_week: i,
                        start_time: '09:00',
                        end_time: '18:00',
                        is_enabled: false
                    }
                })
                setSchedule(completeSchedule)
            }

        } catch (error) {
            console.error(error)
            showToast('Error cargando datos', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateService = async () => {
        if (!newService.name || !newService.price) return
        try {
            await createService(organization!.id, newService.name, Number(newService.price), newService.duration)
            setNewService({ name: '', price: '', duration: 60 })
            loadData()
            showToast('Servicio creado', 'success')
        } catch (e) {
            showToast('Error al crear servicio', 'error')
        }
    }

    const handleSaveSchedule = async () => {
        if (!profile) return
        try {
            await saveWorkingHours(organization!.id, profile.id, schedule)
            showToast('Horarios guardados', 'success')
        } catch (e) {
            showToast('Error al guardar horarios', 'error')
        }
    }

    const handleScheduleChange = (index: number, field: string, value: any) => {
        const newSchedule = [...schedule]
        newSchedule[index] = { ...newSchedule[index], [field]: value }
        setSchedule(newSchedule)
    }

    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

    if (loading) return <div className="p-8">Cargando módulo de turnos...</div>

    return (
        <div className="space-y-6">

            {/* Header y Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Turnos</h1>
                    <p className="text-slate-500">Administra tu agenda y configuración</p>
                </div>

                {/* Link Público */}
                <a
                    href={`/reservar/${organization?.slug}`}
                    target="_blank"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline bg-blue-50 px-3 py-2 rounded-lg"
                >
                    <LinkIcon size={14} />
                    <span>Ver mi página de turnos</span>
                </a>

                {/* Selector de Vistas */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('agenda')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'agenda' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Agenda
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'config' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Configuración
                    </button>
                </div>
            </div>

            {/* VISTA AGENDA */}
            {activeTab === 'agenda' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-semibold text-slate-800">Próximos Turnos</h3>
                    </div>
                    {appointments.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                            No hay turnos agendados aún.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {appointments.map((appt) => (
                                <div key={appt.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                    <div>
                                        <div className="font-medium text-slate-900">
                                            {new Date(appt.start_time).toLocaleDateString()} - {new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="text-sm text-slate-600">{appt.patient_name} ({appt.services?.name})</div>
                                        <div className="text-xs text-slate-400 mt-1">Tel: {appt.patient_phone}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${appt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {appt.status === 'confirmed' ? 'Confirmado' : appt.status}
                                        </span>
                                        {/* Aquí iría el botón de "Cobrar" en el futuro */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* VISTA CONFIGURACIÓN */}
            {activeTab === 'config' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* 1. Servicios */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-fit">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Clock size={18} /> Servicios Ofrecidos
                            </h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* Formulario Crear */}
                            <div className="flex gap-2 items-end bg-slate-50 p-3 rounded-lg">
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-slate-500">Nombre</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Sesión Individual"
                                        className="w-full text-sm border-slate-200 rounded-md mt-1"
                                        value={newService.name}
                                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs font-medium text-slate-500">Precio</label>
                                    <input
                                        type="number"
                                        placeholder="$"
                                        className="w-full text-sm border-slate-200 rounded-md mt-1"
                                        value={newService.price}
                                        onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={handleCreateService}
                                    className="bg-slate-900 text-white p-2 rounded-md hover:bg-slate-800"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {/* Lista */}
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {services.map((srv) => (
                                    <div key={srv.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg">
                                        <div>
                                            <div className="font-medium text-sm">{srv.name}</div>
                                            <div className="text-xs text-slate-500">{srv.duration_minutes} min • ${srv.price}</div>
                                        </div>
                                        <button
                                            onClick={() => deleteService(srv.id)}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 2. Horarios Laborales */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Calendar size={18} /> Horarios de Atención
                            </h3>
                            <button
                                onClick={handleSaveSchedule}
                                className="flex items-center gap-2 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                            >
                                <Save size={14} /> Guardar Cambios
                            </button>
                        </div>
                        <div className="p-4 space-y-1">
                            {schedule.map((day, index) => (
                                <div key={day.day_of_week} className={`flex items-center gap-4 p-2 rounded-lg ${day.is_enabled ? 'bg-white' : 'bg-slate-50 opacity-60'}`}>
                                    <div className="w-24 font-medium text-sm text-slate-700">{days[day.day_of_week]}</div>

                                    <input
                                        type="checkbox"
                                        checked={day.is_enabled}
                                        onChange={(e) => handleScheduleChange(index, 'is_enabled', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                                    />

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="time"
                                            value={day.start_time.slice(0, 5)}
                                            disabled={!day.is_enabled}
                                            onChange={(e) => handleScheduleChange(index, 'start_time', e.target.value)}
                                            className="text-sm border-slate-200 rounded-md px-2 py-1 disabled:bg-slate-100"
                                        />
                                        <span className="text-slate-400">-</span>
                                        <input
                                            type="time"
                                            value={day.end_time.slice(0, 5)}
                                            disabled={!day.is_enabled}
                                            onChange={(e) => handleScheduleChange(index, 'end_time', e.target.value)}
                                            className="text-sm border-slate-200 rounded-md px-2 py-1 disabled:bg-slate-100"
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