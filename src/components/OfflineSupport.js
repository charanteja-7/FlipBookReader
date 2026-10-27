'use client';
import { useEffect } from 'react';
import { basePath } from '@/lib/pdf-utils';
export default function OfflineSupport() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(`${basePath}/sw.js`, { scope: `${basePath}/` })
        .catch(() => {
          /* Reading works online without offline caching. */
        });
    }
  }, []);
  return null;
}
