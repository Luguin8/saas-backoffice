'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
    getPublicOrganization,
    getPublicServices,
    getBusySlots,
    createPublicAppointment,
    getPublicProfessionals
} from '@/app/actions/appointment-actions'
import { Calendar, Clock, CheckCircle, User, ChevronRight, MapPin, Phone } from 'lucide-react'

interface Service {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
}

export default function PublicBookingPage() {
    const params = useParams()
    const slug = params.slug as string

    const [step, setStep] = useState(1)
    const [org, setOrg] = useState<any>(null)
    const [services, setServices] = useState<Service[]>([])
    // CORREGIDO: Ahora está ADENTRO del componente
    const [professionals, setProfessionals] = useState<any[]>([])

    // Selecciones
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [selectedProfessional, setSelectedProfessional] = useState<any>(null)
    const [selectedDate, setSelectedDate] = useState<string>('')
    const [selectedTime, setSelectedTime] = useState<string>('')
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)

    const [formData, setFormData] = useState({ name: '', phone: '', email: '' })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        async function load() {
            try {
                const orgData = await getPublicOrganization(slug)
                if (orgData) {
                    setOrg(orgData)
                    if (orgData.primary_color) document.documentElement.style.setProperty('--brand-primary', orgData.primary_color)

                    const srvData = await getPublicServices(orgData.id)
                    setServices(srvData || [])

                    // Cargamos profesionales también
                    const profData = await getPublicProfessionals(orgData.id)
                    setProfessionals(profData || [])
                }
            } catch (error) {
                console.error("Error cargando datos públicos:", error)
            }
        }
        load()
    }, [slug])

    // Cargar slots cuando cambia fecha o profesional
    useEffect(() => {
        if (selectedDate && selectedService && org) {
            loadSlots()
        }
    }, [selectedDate, selectedService, selectedProfessional]) // eslint-disable-line react-hooks/exhaustive-deps

    async function loadSlots() {
        setLoadingSlots(true)
        const dayStart = `${selectedDate}T00:00:00`
        const dayEnd = `${selectedDate}T23:59:59`

        // Generación simple de slots 9-20hs (Idealmente esto vendría de la config de horarios de la empresa)
        const possibleSlots = []
        for (let h = 9; h < 20; h++) {
            possibleSlots.push(`${h.toString().padStart(2, '0')}:00`)
            possibleSlots.push(`${h.toString().padStart(2, '0')}:30`)
        }

        const busy = await getBusySlots(org.id, dayStart, dayEnd)

        const free = possibleSlots.filter(slot => {
            const slotTime = new Date(`${selectedDate}T${slot}:00`)

            const isBusy = busy.some((b: any) => {
                // Si el turno ocupado es de OTRO profesional, no me bloquea a mí (a menos que el cliente quiera bloquear todo)
                // Aquí asumimos bloqueo simple por ahora.
                const busyStart = new Date(b.start_time)
                const busyEnd = new Date(b.end_time)
                return slotTime >= busyStart && slotTime < busyEnd
            })
            return !isBusy
        })

        setAvailableSlots(free)
        setLoadingSlots(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            if (!selectedService) return;
            const startTime = `${selectedDate}T${selectedTime}:00`
            const endObj = new Date(new Date(startTime).getTime() + selectedService.duration_minutes * 60000)

            await createPublicAppointment({
                organization_id: org.id,
                service_id: selectedService.id,
                profile_id: selectedProfessional?.id === '1' ? null : selectedProfessional?.id,
                patient_name: formData.name,
                patient_email: formData.email,
                patient_phone: formData.phone,
                start_time: startTime,
                end_time: endObj.toISOString(),
                status: 'confirmed' // O 'pending' si quisieras aprobación manual
            })

            setStep(5)
        } catch (error) {
            console.error(error)
            alert('Error al reservar. Intente nuevamente.')
        } finally {
            setSubmitting(false)
        }
    }

    if (!org) return <div className="min-h-screen flex items-center justify-center text-slate-500"><Clock className="animate-spin mr-2" /> Cargando...</div>

    const primaryColor = org.primary_color || '#0f172a' // Fallback a slate-900

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 font-sans text-slate-900">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-100">

                {/* Header Branding */}
                <div className="p-6 text-center border-b border-slate-100 relative bg-white">
                    {step > 1 && step < 5 && (
                        <button onClick={() => setStep(s => s - 1)} className="absolute left-6 top-7 text-sm text-slate-400 hover:text-slate-800 transition-colors font-medium">
                            ← Volver
                        </button>
                    )}
                    {org.logo_url && <img src={org.logo_url} alt="Logo" className="h-12 w-auto mx-auto mb-3 object-contain" />}
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">{org.name}</h1>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Reserva de Turnos</p>
                </div>

                <div className="p-6 min-h-[400px]">

                    {/* PASO 1: SERVICIOS */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-lg font-semibold text-slate-800 mb-1">Selecciona un servicio</h2>
                            <p className="text-sm text-slate-500 mb-6">Elige el tratamiento o consulta que deseas realizar.</p>

                            <div className="space-y-3">
                                {services.length === 0 ? (
                                    <p className="text-center text-slate-400 py-8 text-sm">No hay servicios disponibles.</p>
                                ) : services.map((srv) => (
                                    <button
                                        key={srv.id}
                                        onClick={() => { setSelectedService(srv); setStep(2) }}
                                        className="w-full text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-slate-300 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all group flex justify-between items-center"
                                    >
                                        <div>
                                            <span className="font-semibold text-slate-900 block">{srv.name}</span>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                                                    <Clock size={12} /> {srv.duration_minutes} min
                                                </span>
                                                {srv.price > 0 && (
                                                    <span className="text-xs font-bold text-emerald-600">
                                                        ${srv.price.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-slate-600 group-hover:border-slate-300 transition-colors">
                                            <ChevronRight size={18} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PASO 2: PROFESIONALES */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-lg font-semibold text-slate-800 mb-1">Selecciona un profesional</h2>
                            <p className="text-sm text-slate-500 mb-6">¿Con quién te gustaría atenderte?</p>

                            <div className="space-y-3">
                                {/* Opción "Cualquiera" */}
                                <button
                                    onClick={() => { setSelectedProfessional({ id: '1', full_name: 'Primer disponible', role: 'system' }); setStep(3) }}
                                    className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-slate-300 hover:bg-white hover:shadow-md transition-all flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                        <Calendar size={18} />
                                    </div>
                                    <span className="font-medium text-slate-700">Cualquiera disponible</span>
                                </button>

                                {professionals.map((prof: any) => (
                                    <button
                                        key={prof.id}
                                        onClick={() => { setSelectedProfessional(prof); setStep(3) }}
                                        className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-slate-300 hover:bg-white hover:shadow-md transition-all flex items-center gap-3"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden border border-white shadow-sm">
                                            {prof.avatar_url ? (
                                                <img src={prof.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                                            ) : (
                                                <User size={18} />
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-900 block">{prof.full_name}</span>
                                            <span className="text-xs text-slate-400">Especialista</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PASO 3: FECHA */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">Elige fecha y hora</h2>

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha</label>
                                <input
                                    type="date"
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-medium text-slate-700"
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>

                            {selectedDate && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Horarios Disponibles</label>
                                    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                        {loadingSlots ? (
                                            <div className="col-span-3 py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                                                <Clock className="animate-spin w-5 h-5" />
                                                <span className="text-sm">Buscando huecos...</span>
                                            </div>
                                        ) : availableSlots.length === 0 ? (
                                            <div className="col-span-3 py-8 text-center text-sm text-slate-400 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                                                No hay horarios para esta fecha.
                                            </div>
                                        ) : availableSlots.map((slot) => (
                                            <button
                                                key={slot}
                                                onClick={() => { setSelectedTime(slot); setStep(4) }}
                                                className="py-2.5 px-1 text-sm font-medium border rounded-lg transition-all hover:scale-105 active:scale-95"
                                                style={{
                                                    borderColor: primaryColor,
                                                    color: primaryColor,
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = primaryColor;
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.color = primaryColor;
                                                }}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PASO 4: DATOS FINAL */}
                    {step === 4 && (
                        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-lg font-semibold text-slate-800">Confirmar Datos</h2>

                            <div className="bg-slate-50 p-5 rounded-2xl text-sm space-y-3 border border-slate-100">
                                <div className="flex justify-between border-b border-slate-200 pb-2">
                                    <span className="text-slate-500">Servicio</span>
                                    <span className="font-semibold text-slate-900">{selectedService?.name}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-200 pb-2">
                                    <span className="text-slate-500">Profesional</span>
                                    <span className="font-semibold text-slate-900">{selectedProfessional?.full_name || 'Cualquiera'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Cuándo</span>
                                    <span className="font-semibold text-slate-900">{selectedDate} a las {selectedTime}hs</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre Completo</label>
                                    <input required type="text" placeholder="Ej: Juan Pérez" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email (Opcional)</label>
                                    <input type="email" placeholder="juan@ejemplo.com" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono / WhatsApp</label>
                                    <input required type="tel" placeholder="Ej: 11 1234 5678" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full mt-2 py-3.5 rounded-xl text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2"><Clock size={18} className="animate-spin" /> Procesando...</span>
                                ) : 'Confirmar Reserva'}
                            </button>
                        </form>
                    )}

                    {/* PASO 5: ÉXITO */}
                    {step === 5 && (
                        <div className="text-center py-12 animate-in zoom-in duration-300 flex flex-col items-center">
                            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <CheckCircle size={48} className="text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Reserva Exitosa!</h2>
                            <p className="text-slate-500 max-w-xs mx-auto mb-8">
                                Te esperamos el <strong>{selectedDate}</strong> a las <strong>{selectedTime}hs</strong>.
                            </p>

                            <button onClick={() => window.location.reload()} className="text-slate-400 text-sm hover:text-slate-600 underline">
                                Hacer otra reserva
                            </button>
                        </div>
                    )}

                </div>
            </div>

            <div className="mt-8 text-center text-slate-300 text-xs">
                Powered by <strong>Cajix</strong>
            </div>
        </div>
    )
}