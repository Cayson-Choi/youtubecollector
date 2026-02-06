import React from 'react';
import { hexToRgb } from '../utils/colors';

const SlideExample = ({ template }) => {
  const s = template.style;
  const fontFamily = `${s.font}, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;

  const isDark = (() => {
    const { r, g, b } = hexToRgb(s.bg);
    // perceived luminance
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return lum < 0.45;
  })();

  // 스타일별 레이아웃 힌트(대충만)
  const layoutKind = (() => {
    const id = template.id;
    if (id === 'minimal') return 'minimal';
    if (id === 'monochrome' || id === 'cinematic') return 'poster';
    if (id === 'cyberpunk') return 'hud';
    if (id === 'dashboard') return 'dashboard';
    if (id === 'academic') return 'paper';
    if (id === 'cartoon') return 'comic';
    if (id === 'neobrutalism') return 'comic'; // Reuse comic layout for bold feel
    if (id === 'luxury' || id === 'holographic') return 'luxury';
    return isDark ? 'card-dark' : 'card-light';
  })();

  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const border = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';

  return (
    <div className="w-full">
      <div
        className="aspect-video w-full rounded-2xl overflow-hidden relative"
        style={{
          background: s.bg,
          color: s.text,
          fontFamily,
          border: `1px solid ${border}`,
        }}
      >
        {/* accent decoration */}
        <div className="absolute inset-0 pointer-events-none">
          {layoutKind === 'hud' && (
            <>
              <div style={{ position: 'absolute', inset: 16, border: `1px solid ${s.accent}`, opacity: 0.6 }} />
              <div style={{ position: 'absolute', left: 16, top: 16, width: 80, height: 8, background: s.accent, opacity: 0.8 }} />
              <div style={{ position: 'absolute', right: 16, bottom: 16, width: 140, height: 1, background: s.accent, opacity: 0.7 }} />
            </>
          )}
          {layoutKind === 'luxury' && (
            <>
              <div style={{ position: 'absolute', left: 24, right: 24, top: 24, height: 1, background: s.accent, opacity: 0.75 }} />
              <div style={{ position: 'absolute', left: 24, right: 24, bottom: 24, height: 1, background: s.accent, opacity: 0.75 }} />
            </>
          )}
          {layoutKind === 'comic' && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 30% 30%, ${s.accent}22, transparent 55%)` }} />
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 11px)' }} />
          <div style={{ position: 'absolute', right: -20, bottom: -20, width: 100, height: 100, background: s.accent, borderRadius: '50%', opacity: 0.2 }} />
        </>
      )}
          {(layoutKind === 'card-light' || layoutKind === 'card-dark') && (
            <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 10, background: s.accent, opacity: 0.85 }} />
          )}
        </div>

        {/* content */}
        <div className="absolute inset-0 p-8">
          {layoutKind === 'poster' ? (
            <>
              <div className="text-[12px] tracking-[0.25em] opacity-70">EDITORIAL</div>
              <div className="mt-3 text-4xl font-extrabold leading-tight" style={{ letterSpacing: '-0.02em' }}>
                {template.name}
              </div>
              <div className="mt-3 text-sm opacity-80">{template.mood}</div>
              <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
                <div className="text-xs opacity-70">{template.category}</div>
                <div className="text-xs opacity-70">{s.font}</div>
              </div>
            </>
          ) : layoutKind === 'minimal' ? (
            <>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-4xl font-semibold">{template.name}</div>
                <div className="mx-auto mt-4 h-px w-56" style={{ background: s.accent, opacity: 0.85 }} />
                <div className="mt-4 text-sm opacity-70">{template.mood}</div>
              </div>
            </>
          ) : layoutKind === 'dashboard' ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs opacity-70">DASHBOARD</div>
                  <div className="text-2xl font-bold">{template.name}</div>
                </div>
                <div className="text-xs opacity-70">LIVE</div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[1, 2, 3].map((k) => (
                  <div key={k} className="rounded-xl p-3" style={{ background: cardBg, border: `1px solid ${border}` }}>
                    <div className="text-[10px] opacity-70">Metric {k}</div>
                    <div className="mt-2 text-2xl font-extrabold" style={{ color: s.accent }}>
                      {k === 1 ? '84' : k === 2 ? '1.2K' : '97%'}
                    </div>
                    <div className="mt-2 h-1 rounded" style={{ background: s.accent, opacity: 0.35 }} />
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <div className="text-[10px] opacity-70">Trend</div>
                <div className="mt-3 grid grid-cols-12 gap-1 items-end h-24">
                  {[18, 30, 26, 40, 34, 56, 44, 62, 48, 70, 58, 76].map((h, i) => (
                    <div key={i} className="rounded-t" style={{ height: `${h}%`, background: i % 3 === 0 ? s.accent : `${s.accent}88` }} />
                  ))}
                </div>
              </div>
            </>
          ) : layoutKind === 'paper' ? (
            <>
              <div className="text-2xl font-extrabold">{template.name}</div>
              <div className="mt-1 text-sm opacity-80">{template.mood}</div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <div className="text-xs font-semibold" style={{ color: s.accent }}>
                    Abstract
                  </div>
                  <div className="mt-2 text-[12px] leading-relaxed opacity-90">
                    {template.characteristics?.slice(0, 3).join(' · ')}
                  </div>
                </div>
                <div className="rounded-xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <div className="text-xs font-semibold" style={{ color: s.accent }}>
                    Key Points
                  </div>
                  <ul className="mt-2 space-y-1 text-[12px] opacity-90">
                    {(template.characteristics || []).slice(0, 3).map((c) => (
                      <li key={c}>• {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="absolute bottom-6 right-8 text-[10px] opacity-60">p. 1</div>
            </>
          ) : (
            // 기본 카드형
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs opacity-70">{template.category}</div>
                  <div className="mt-1 text-3xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>
                    {template.name}
                  </div>
                  <div className="mt-2 text-sm opacity-80">{template.mood}</div>
                </div>
                <div className="hidden sm:block text-[10px] opacity-60 text-right">
                  <div>{template.texture}</div>
                  <div className="mt-1">{template.layoutGuide}</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {(template.characteristics || []).slice(0, 3).map((c, i) => (
                  <div key={i} className="rounded-2xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                    <div className="text-[10px] opacity-65">Point</div>
                    <div className="mt-2 text-sm font-semibold" style={{ color: s.text }}>
                      {c}
                    </div>
                    <div className="mt-4 h-1 rounded" style={{ background: s.accent, opacity: 0.35 }} />
                  </div>
                ))}
              </div>

              <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between">
                <div className="text-[10px] opacity-60">Font: {s.font}</div>
                <div className="text-[10px] opacity-60">Accent: {s.accent}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* small meta */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
        <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">배경 {template.style.bg}</span>
        <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">강조 {template.style.accent}</span>
        <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">폰트 {template.style.font}</span>
      </div>
    </div>
  );
};

export default SlideExample;
