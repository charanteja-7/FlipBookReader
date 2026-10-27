'use client';
import { useState, useEffect } from 'react';
import { Sparkles, Pause } from 'lucide-react';
export default function EnchantedAtmosphere() {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.magic = paused ? 'paused' : 'playing';
    return () => {
      delete document.documentElement.dataset.magic;
    };
  }, [paused]);
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
        onClick={() => setPaused(!paused)}
      >
        {paused ? <Sparkles size={15} /> : <Pause size={15} />}
        <span>{paused ? 'Resume magic' : 'Pause magic'}</span>
      </button>
    </>
  );
}
