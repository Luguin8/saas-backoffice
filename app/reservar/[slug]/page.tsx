'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
    getPublicOrganization,
    getPublicServices,
    getBusySlots,
    createPublicAppointment
} from '@/app/actions/appointment-actions'
import { Calendar, Clock, CheckCircle } from 'lucide-react'

export default function PublicBookingPage() {
    const params = useParams()
    const slug = params.slug as string

    // Estado
    const [step, setStep] = useState(1) // 1: Servicio, 2: Fecha, 3: Datos, 4: Éxito
    const [org, setOrg] = useState<any>(null)
    const [services, setServices] = useState<any[]>([])

    // Selección
    const [selectedService, setSelectedService] = useState<any>(null)
    const [selectedDate, setSelectedDate] = useState<string>('')
    const [selectedTime, setSelectedTime] = useState<string>('')
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)

    // Formulario final
    const [formData, setFormData] = useState({ name: '', phone: '', email: '' })
    const [submitting, setSubmitting] = useState(false)

    // Carga inicial
    useEffect(() => {
        async function load() {
            const orgData = await getPublicOrganization(slug)
            if (orgData) {
                setOrg(orgData)
                const srvData = await getPublicServices(orgData.id)
                setServices(srvData || [])
            }
        }
        load()
    }, [slug])

    // Cargar slots cuando cambia la fecha
    useEffect(() => {
        if (selectedDate && selectedService && org) {
            loadSlots()
        }
    }, [selectedDate, selectedService])

    async function loadSlots() {
        setLoadingSlots(true)
        // Lógica simplificada de slots: Generamos cada 30 min y filtramos con backend
        // En producción ideal: backend genera la lógica completa con working_hours
        // Aquí simulamos para el MVP usando la RPC de "ocupados"

        // 1. Definir rango del día (ej: 09:00 a 20:00 hardcodeado o general)
        const possibleSlots = []
        let startHour = 9
        const endHour = 20

        for (let h = startHour; h < endHour; h++) {
            possibleSlots.push(`${h.toString().padStart(2, '0')}:00`)
            possibleSlots.push(`${h.toString().padStart(2, '0')}:30`) // Intervalos de 30m
        }

        // 2. Traer ocupados
        const dayStart = `${selectedDate}T00:00:00`
        const dayEnd = `${selectedDate}T23:59:59`
        const busy = await getBusySlots(org.id, dayStart, dayEnd)

        // 3. Filtrar
        const free = possibleSlots.filter(slot => {
            // Comparar contra busy (simplificado)
            const slotTime = new Date(`${selectedDate}T${slot}:00`)
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
            const startTime = `${selectedDate}T${selectedTime}:00`
            // Calcular fin basado en duración
            const startObj = new Date(startTime)
            const endObj = new Date(startObj.getTime() + selectedService.duration_minutes * 60000)

            await createPublicAppointment({
                organization_id: org.id,
                service_id: selectedService.id,
                patient_name: formData.name,
                patient_email: formData.email,
                patient_phone: formData.phone,
                start_time: startTime,
                end_time: endObj.toISOString()
            })

            setStep(4)
        } catch (error) {
            alert('Error al reservar. Intente nuevamente.')
        } finally {
            setSubmitting(false)
        }
    }

    if (!org) return <div className="flex justify-center items-center h-screen">Cargando...</div>

    // Estilo dinámico con color de la marca
    const brandStyle = {
        borderColor: org.primary_color || '#000',
        color: org.primary_color || '#000'
    }
    const bgBrandStyle = {
        backgroundColor: org.primary_color || '#000'
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">

            {/* Tarjeta Principal */}
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">

                {/* Header */}
                <div className="p-6 text-center border-b border-gray-100">
                    {org.logo_url && (
                        <img src={org.logo_url} alt={org.name} className="h-16 w-auto mx-auto mb-4 object-contain" />
                    )}
                    <h1 className="text-xl font-bold text-gray-900">{org.name}</h1>
                    <p className="text-gray-500 text-sm mt-1">Reserva tu turno online</p>
                </div>

                <div className="p-6">

                    {/* PASO 1: SERVICIOS */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Selecciona un servicio</h2>
                            {services.map((srv) => (
                                <button
                                    key={srv.id}
                                    onClick={() => { setSelectedService(srv); setStep(2) }}
                                    className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all group"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-900">{srv.name}</span>
                                        <span className="font-bold" style={brandStyle}>${srv.price}</span>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                        <Clock size={14} /> {srv.duration_minutes} min
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* PASO 2: FECHA Y HORA */}
                    {step === 2 && (
                        <div>
                            <button onClick={() => setStep(1)} className="text-sm text-gray-500 mb-4 hover:underline">← Volver</button>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Elige fecha y hora</h2>

                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                            <input
                                type="date"
                                className="w-full p-3 border border-gray-200 rounded-lg mb-6"
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />

                            {selectedDate && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Horarios Disponibles</label>
                                    {loadingSlots ? (
                                        <div className="text-center py-4 text-gray-400">Buscando horarios...</div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="text-center py-4 text-red-400">No hay horarios este día.</div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {availableSlots.map((slot) => (
                                                <button
                                                    key={slot}
                                                    onClick={() => { setSelectedTime(slot); setStep(3) }}
                                                    className="py-2 px-1 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                                                    style={{ borderColor: org.primary_color }} // Borde sutil del color marca
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PASO 3: DATOS */}
                    {step === 3 && (
                        <form onSubmit={handleSubmit}>
                            <button type="button" onClick={() => setStep(2)} className="text-sm text-gray-500 mb-4 hover:underline">← Volver</button>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Tus Datos</h2>

                            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm">
                                <p><strong>Servicio:</strong> {selectedService.name}</p>
                                <p><strong>Fecha:</strong> {selectedDate} a las {selectedTime}</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                                    <input
                                        required type="text"
                                        className="w-full mt-1 p-3 border border-gray-200 rounded-lg"
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                                    <input
                                        required type="tel"
                                        className="w-full mt-1 p-3 border border-gray-200 rounded-lg"
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email (Opcional)</label>
                                    <input
                                        type="email"
                                        className="w-full mt-1 p-3 border border-gray-200 rounded-lg"
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full mt-8 py-3 rounded-xl text-white font-semibold shadow-lg hover:opacity-90 transition-opacity"
                                style={bgBrandStyle}
                            >
                                {submitting ? 'Confirmando...' : 'Confirmar Reserva'}
                            </button>
                        </form>
                    )}

                    {/* PASO 4: ÉXITO */}
                    {step === 4 && (
                        <div className="text-center py-10">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={32} className="text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reserva Confirmada!</h2>
                            <p className="text-gray-600 mb-8">Te esperamos el {selectedDate} a las {selectedTime}.</p>

                            <a href={`/reservar/${slug}`} className="text-blue-600 hover:underline">
                                Realizar otra reserva
                            </a>
                        </div>
                    )}

                </div>
            </div>

            <div className="mt-8 text-gray-400 text-xs">
                Powered by <strong>Cajix</strong>
            </div>
        </div>
    )
}