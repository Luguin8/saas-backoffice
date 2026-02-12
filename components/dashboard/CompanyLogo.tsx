import { Building2 } from 'lucide-react'

interface CompanyLogoProps {
    url?: string | null
    name: string
}

export default function CompanyLogo({ url, name }: CompanyLogoProps) {
    if (url) {
        return (
            <div className="flex items-center gap-3">
                <img
                    src={url}
                    alt={name}
                    className="h-10 w-10 object-contain rounded-lg" // object-contain evita recortes feos
                />
                <span className="font-bold text-lg text-slate-900 truncate max-w-[140px]" title={name}>
                    {name}
                </span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Building2 size={20} className="text-slate-500" />
            </div>
            <span className="font-bold text-lg text-slate-900 truncate max-w-[140px]" title={name}>
                {name}
            </span>
        </div>
    )
}