'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Moon, Sun, Monitor, AlertCircle } from 'lucide-react';

export default function ReaderControls({ title, currentPage, totalPages, theme, onSetTheme }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            backgroundColor: 'var(--bg-app)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 2rem',
            zIndex: 100,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                    <Home size={20} />
                </Link>
                <h1 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>
                    {title || 'Reading'}
                </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
                <span>Page {currentPage + 1}</span>

                <div style={{ height: '20px', width: '1px', background: '#ccc' }} />

                <button onClick={() => onSetTheme('light')} style={{ background: 'none', border: 'none', color: 'inherit' }} title="Light Mode">
                    <Sun size={18} />
                </button>
                <button onClick={() => onSetTheme('dark')} style={{ background: 'none', border: 'none', color: 'inherit' }} title="Dark Mode">
                    <Moon size={18} />
                </button>
                {/* Sepia/Monitor mode icon if needed, or simple text */}
            </div>
        </div>
    );
}
