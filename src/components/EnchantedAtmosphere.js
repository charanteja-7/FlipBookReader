'use client';
import { useState, useEffect } from 'react';
import { Sparkles, Pause } from 'lucide-react';
export default function EnchantedAtmosphere({ onPauseChange }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    try {
      setPaused(localStorage.getItem('flip-magic-paused') === 'yes');
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.dataset.magic = paused ? 'paused' : 'playing';
    onPauseChange?.(paused);
    return () => {
      delete document.documentElement.dataset.magic;
    };
  }, [paused, onPauseChange]);
  return (
    <>
      <div className="magic-dust" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <i
            key={i}
            style={{
              '--i': i,
              '--x': `${(i * 37 + 11) % 100}%`,
              '--delay': `${-i * 1.7}s`,
            }}
          />
        ))}
      </div>
      <button
        className="magic-toggle"
        aria-label={paused ? 'Resume magic' : 'Pause magic'}
        aria-pressed={paused}
        onClick={() => {
          const next = !paused;
          setPaused(next);
          onPauseChange?.(next);
          try {
            localStorage.setItem('flip-magic-paused', next ? 'yes' : 'no');
          } catch {}
        }}
      >
        {paused ? <Sparkles size={15} /> : <Pause size={15} />}
        <span>{paused ? 'Resume magic' : 'Pause magic'}</span>
      </button>
    </>
  );
}
