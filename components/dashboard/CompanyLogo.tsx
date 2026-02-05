'use client';

import { useState } from 'react';

export default function CompanyLogo({ url, name }: { url: string | null, name: string }) {
    const [error, setError] = useState(false);

    // Si no hay URL o si la imagen falló al cargar, mostramos el nombre en texto
    if (!url || error) {
        return <span className="text-white font-bold text-lg truncate">{name}</span>;
    }

    return (
        <img
            src={url}
            alt={name}
            className="h-8 w-auto object-contain brightness-0 invert"
            onError={() => setError(true)}
        />
    );
}