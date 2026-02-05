'use client';
import { useState } from 'react';

export default function CompanyLogo({ url, name }: { url: string | null, name: string }) {
    const [error, setError] = useState(false);

    if (!url || error) {
        return <span className="text-white font-bold text-lg truncate">{name}</span>;
    }

    return (
        <div className="flex items-center gap-2">
            {/* Renderizamos la imagen tal cual. Agregamos bg-white/10 por si es un logo negro en fondo oscuro */}
            <img
                src={url}
                alt={name}
                className="h-10 w-auto object-contain p-1 rounded bg-white/5"
                onError={() => setError(true)}
            />
            <span className="text-white font-bold text-lg truncate hidden md:block">{name}</span>
        </div>
    );
}