'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
// CORRECCIÓN 1: Importar la instancia 'supabase' directamente
import { supabase } from '@/lib/supabase'
import { createCompanyUser, getCompanyUsers, deleteCompanyUser } from '@/app/actions/admin-user-actions'
import { UserPlus, Trash2, Stethoscope } from 'lucide-react'

export default function EditCompanyPage() {
    const params = useParams()
    const [org, setOrg] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Estado formulario
    const [newUser, setNewUser] = useState({
        email: '', password: '', fullName: '', role: 'employee', isProfessional: false
    })

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const { data } = await supabase.from('organizations').select('*').eq('id', params.id).single()
        setOrg(data)

        // Cargar usuarios
        const usersData = await getCompanyUsers(params.id as string)
        setUsers(usersData || [])
        setLoading(false)
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        const formData = new FormData()
        Object.entries(newUser).forEach(([k, v]) => formData.append(k, String(v)))
        if (newUser.isProfessional) formData.append('isProfessional', 'on')
        formData.append('organizationId', params.id as string)

        try {
            await createCompanyUser(formData)
            alert('Usuario creado')
            setNewUser({ email: '', password: '', fullName: '', role: 'employee', isProfessional: false })
            loadData()
        } catch (e: any) {
            alert(e.message)
        }
    }

    if (loading) return <div>Cargando...</div>

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Gestionar: {org?.name}</h1>

            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><UserPlus /> Personal</h2>

                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded mb-6">
                    <input required placeholder="Nombre" className="p-2 border rounded"
                        value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} />
                    <input required type="email" placeholder="Email" className="p-2 border rounded"
                        value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                    <input required type="text" placeholder="Contraseña" className="p-2 border rounded"
                        value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                    <select className="p-2 border rounded" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                        <option value="employee">Empleado</option>
                        <option value="owner">Dueño</option>
                    </select>
                    <div className="flex items-center gap-2 md:col-span-2">
                        <input type="checkbox" checked={newUser.isProfessional} onChange={e => setNewUser({ ...newUser, isProfessional: e.target.checked })} />
                        <label>¿Es Profesional? (Aparece en Turnero)</label>
                    </div>
                    <button type="submit" className="bg-black text-white p-2 rounded md:col-span-2">Crear Usuario</button>
                </form>

                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100"><tr><th className="p-2">Nombre</th><th className="p-2">Rol</th><th className="p-2">Turnero</th><th className="p-2"></th></tr></thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b">
                                <td className="p-2">{u.full_name} <br /><span className="text-xs text-gray-400">{u.email}</span></td>
                                <td className="p-2">{u.role}</td>
                                <td className="p-2">{u.is_professional ? <span className="text-green-600 flex gap-1"><Stethoscope size={14} /> Sí</span> : '-'}</td>
                                <td className="p-2"><button onClick={() => deleteCompanyUser(u.id, params.id as string)} className="text-red-500"><Trash2 size={16} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}