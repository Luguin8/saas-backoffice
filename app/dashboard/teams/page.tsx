'use client'

import { useEffect, useState } from 'react'
import { useDashboard } from '@/app/dashboard/context/DashboardContext'
import { getOrganizationTeam } from '@/app/actions/team-actions'
import { User, Shield, Stethoscope } from 'lucide-react'

export default function TeamPage() {
    const { organization } = useDashboard()
    const [team, setTeam] = useState<any[]>([])

    useEffect(() => {
        if (organization) {
            getOrganizationTeam(organization.id).then(data => setTeam(data || []))
        }
    }, [organization])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Equipo</h1>
                <p className="text-slate-500">Contacta a soporte para gestionar altas y bajas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {team.map((member) => (
                    <div key={member.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold">
                            {member.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h3 className="font-semibold">{member.full_name}</h3>
                            <div className="flex gap-2 text-xs mt-1">
                                <span className="bg-slate-100 px-2 py-0.5 rounded capitalize">{member.role === 'owner' ? 'Dueño' : 'Empleado'}</span>
                                {member.is_professional && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1"><Stethoscope size={10} /> Pro</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}