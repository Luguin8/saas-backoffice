'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
    getPublicOrganization,
    getPublicServices,
    getBusySlots,
    createPublicAppointment
} from '@/app/actions/appointment-actions'
import { Calendar, Clock, CheckCircle, User, ChevronRight } from 'lucide-react'

// Definir tipos básicos para evitar errores de TS
interface Service {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
}
// Simulamos profesionales (en el futuro vendrán de DB real vinculados a servicios)
const MOCK_PROFESSIONALS = [
    { id: '1', name: 'Cualquier Profesional Disponible' },
    { id: '2', name: 'Dra. Ana (Psicóloga)' },
    { id: '3', name: 'Lic. Juan (Psicólogo)' }
]

export default function PublicBookingPage() {
    const params = useParams()
    const slug = params.slug as string

    const [step, setStep] = useState(1)
    const [org, setOrg] = useState<any>(null)
    const [services, setServices] = useState<Service[]>([])

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
            const orgData = await getPublicOrganization(slug)
            if (orgData) {
                setOrg(orgData)
                // Inyectamos variables CSS para colores
                if (orgData.primary_color) document.documentElement.style.setProperty('--brand-primary', orgData.primary_color)

                const srvData = await getPublicServices(orgData.id)
                setServices(srvData || [])
            }
        }
        load()
    }, [slug])

    // Cargar slots cuando cambia fecha o profesional
    useEffect(() => {
        if (selectedDate && selectedService && org) {
            loadSlots()
        }
    }, [selectedDate, selectedService, selectedProfessional])

    async function loadSlots() {
        setLoadingSlots(true)
        // Aquí iría la lógica real filtrando por ID de profesional si se eligió uno específico
        // Por ahora usamos la lógica general
        const dayStart = `${selectedDate}T00:00:00`
        const dayEnd = `${selectedDate}T23:59:59`

        // Generación simple de slots 9-20hs
        const possibleSlots = []
        for (let h = 9; h < 20; h++) {
            possibleSlots.push(`${h.toString().padStart(2, '0')}:00`)
            possibleSlots.push(`${h.toString().padStart(2, '0')}:30`)
        }

        const busy = await getBusySlots(org.id, dayStart, dayEnd)

        const free = possibleSlots.filter(slot => {
            const slotTime = new Date(`${selectedDate}T${slot}:00`)
            // Aquí filtraríamos también por profesional si el turno guardado tiene profile_id
            const isBusy = busy.some((b: any) => {
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
                // Si eligió "Cualquiera" (id 1), mandamos null, sino el ID del doc
                profile_id: selectedProfessional?.id === '1' ? null : selectedProfessional.id,
                patient_name: formData.name,
                patient_email: formData.email,
                patient_phone: formData.phone,
                start_time: startTime,
                end_time: endObj.toISOString(),
                status: 'confirmed'
            })

            setStep(5) // Paso final
        } catch (error) {
            alert('Error al reservar. Intente nuevamente.')
        } finally {
            setSubmitting(false)
        }
    }

    if (!org) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

    const primaryColor = org.primary_color || '#000'

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-sans">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">

                {/* Header Branding */}
                <div className="p-6 text-center border-b border-gray-100 relative">
                    {step > 1 && step < 5 && (
                        <button onClick={() => setStep(s => s - 1)} className="absolute left-6 top-7 text-sm text-gray-400 hover:text-gray-900">
                            ← Volver
                        </button>
                    )}
                    <h1 className="text-xl font-bold text-gray-900 mt-2">{org.name}</h1>
                </div>

                <div className="p-6">

                    {/* PASO 1: SERVICIOS */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">¿Qué necesitas?</h2>
                            {services.map((srv) => (
                                <button
                                    key={srv.id}
                                    onClick={() => { setSelectedService(srv); setStep(2) }}
                                    className="w-full text-left p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-gray-300 hover:bg-white hover:shadow-md transition-all group flex justify-between items-center"
                                >
                                    <div>
                                        <span className="font-medium text-gray-900 block">{srv.name}</span>
                                        <span className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                            <Clock size={14} /> {srv.duration_minutes} min
                                        </span>
                                    </div>
                                    <ChevronRight className="text-gray-300 group-hover:text-gray-600" size={20} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* PASO 2: PROFESIONALES (NUEVO) */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Selecciona Profesional</h2>
                            {MOCK_PROFESSIONALS.map((prof) => (
                                <button
                                    key={prof.id}
                                    onClick={() => { setSelectedProfessional(prof); setStep(3) }}
                                    className="w-full text-left p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-gray-300 hover:bg-white hover:shadow-md transition-all flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                        <User size={20} />
                                    </div>
                                    <span className="font-medium text-gray-900">{prof.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* PASO 3: FECHA */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Elige fecha y hora</h2>

                            <input
                                type="date"
                                className="w-full p-3 border border-gray-200 rounded-lg mb-6 outline-none focus:ring-2 focus:ring-opacity-50"
                                style={{ '--tw-ring-color': primaryColor } as any}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />

                            {selectedDate && (
                                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                                    {loadingSlots ? (
                                        <p className="col-span-3 text-center text-gray-400 py-4">Buscando huecos...</p>
                                    ) : availableSlots.map((slot) => (
                                        <button
                                            key={slot}
                                            onClick={() => { setSelectedTime(slot); setStep(4) }}
                                            className="py-2 px-1 text-sm border rounded-lg hover:text-white transition-colors"
                                            style={{
                                                borderColor: primaryColor,
                                                color: primaryColor,
                                                // Al hacer hover, cambiamos el fondo (manejado via CSS classes o style inline condicional complejo, aqui simplificado)
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
                            )}
                        </div>
                    )}

                    {/* PASO 4: DATOS FINAL */}
                    {step === 4 && (
                        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-lg font-semibold text-gray-800 mb-2">Confirmar Datos</h2>

                            <div className="bg-slate-50 p-4 rounded-lg text-sm space-y-1 mb-4 border border-slate-100">
                                <p><span className="text-slate-500">Servicio:</span> <span className="font-medium">{selectedService?.name}</span></p>
                                <p><span className="text-slate-500">Profesional:</span> <span className="font-medium">{selectedProfessional?.name}</span></p>
                                <p><span className="text-slate-500">Fecha:</span> <span className="font-medium">{selectedDate} {selectedTime}hs</span></p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Nombre Completo</label>
                                <input required type="text" className="w-full p-3 border border-gray-200 rounded-lg"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">WhatsApp</label>
                                <input required type="tel" className="w-full p-3 border border-gray-200 rounded-lg"
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full mt-4 py-3 rounded-xl text-white font-bold shadow-lg hover:opacity-90 transition-all"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {submitting ? 'Confirmando...' : 'Confirmar Reserva'}
                            </button>
                        </form>
                    )}

                    {/* PASO 5: ÉXITO */}
                    {step === 5 && (
                        <div className="text-center py-10 animate-in zoom-in duration-300">
                            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle size={40} className="text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Listo!</h2>
                            <p className="text-gray-600">Tu turno ha sido agendado con éxito.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}