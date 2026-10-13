import React from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, CHAPTERS, FONT, MONO} from './theme';
import {TERMS, TermKey} from './terms';

type Kids = {children?: React.ReactNode};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

export const useSpring = (at: number, durationInFrames = 20) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: Math.max(0, frame - at), fps, config: {damping: 200}, durationInFrames});
};

/** 0→1 progress between two frames, eased. */
export const useProgress = (from: number, to: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, to], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
};

export const Appear: React.FC<Kids & {at?: number; x?: number; y?: number; style?: React.CSSProperties}> = ({
  at = 0,
  x = 0,
  y = 24,
  style,
  children,
}) => {
  const s = useSpring(at);
  return <div style={{opacity: s, transform: `translate(${(1 - s) * x}px, ${(1 - s) * y}px)`, ...style}}>{children}</div>;
};

/** Full-screen chapter frame: title, accent line and the chapter progress bar. */
export const Scene: React.FC<Kids & {no: number; title: string; subtitle?: string}> = ({no, title, subtitle, children}) => {
  const s = useSpring(0, 25);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1300px 760px at 12% -10%, #1c2a5c 0%, ${C.bg} 62%)`,
        fontFamily: FONT,
        color: C.text,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 30,
          left: 100,
          display: 'flex',
          alignItems: 'baseline',
          gap: 20,
          opacity: s,
          transform: `translateX(${(1 - s) * -40}px)`,
        }}
      >
        <span style={{fontFamily: MONO, fontSize: 30, color: C.accent}}>{String(no).padStart(2, '0')}</span>
        <span style={{fontSize: 54, fontWeight: 700, letterSpacing: -1}}>{title}</span>
      </div>
      {subtitle && (
        <div style={{position: 'absolute', top: 104, left: 100, fontSize: 24, color: C.dim, opacity: s}}>{subtitle}</div>
      )}
      <div style={{position: 'absolute', top: 144, left: 100, height: 4, width: 160 * s, background: C.accent, borderRadius: 2}} />
      {children}
      <ChapterBar current={no} />
    </AbsoluteFill>
  );
};

const ChapterBar: React.FC<{current: number}> = ({current}) => (
  <div style={{position: 'absolute', left: 100, right: 100, bottom: 26, display: 'flex', gap: 6}}>
    {CHAPTERS.slice(1).map((c, i) => {
      const n = i + 1;
      const active = n === current;
      return (
        <div key={c} style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0}}>
          <div
            style={{
              height: 5,
              borderRadius: 3,
              background: active ? C.accent : n < current ? hexA(C.accent, 0.45) : C.faint,
            }}
          />
          <div
            style={{
              fontSize: 12.5,
              color: active ? C.text : C.dim,
              fontWeight: active ? 700 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {c}
          </div>
        </div>
      );
    })}
  </div>
);

/** A timed "slide" inside a scene. Fades in/out and owns the content area under the title. */
export const Beat: React.FC<Kids & {from: number; dur: number; terms?: TermKey[]}> = ({from, dur, terms, children}) => (
  <Sequence from={from} durationInFrames={dur} layout="none">
    <BeatInner dur={dur}>
      {terms && <TermBox keys={terms} />}
      {children}
    </BeatInner>
  </Sequence>
);

const BeatInner: React.FC<Kids & {dur: number}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 12, dur - 12, dur], [0, 1, 1, 0], clamp);
  return <div style={{position: 'absolute', top: 170, left: 100, right: 100, bottom: 90, opacity: o}}>{children}</div>;
};

/** Yellow glossary box in the top-right corner: short definitions of the terms used on this screen. */
export const TermBox: React.FC<{keys: readonly TermKey[]; opacity?: number}> = ({keys, opacity = 1}) => {
  const s = useSpring(6);
  return (
    <div style={{position: 'absolute', top: -148, right: 0, width: keys.length > 2 ? 1040 : 720, display: 'flex', flexDirection: 'column', gap: 6, opacity: s * opacity}}>
      {keys.map((k) => {
        const [name, def] = TERMS[k];
        return (
          <div
            key={k}
            style={{
              background: 'rgba(22, 30, 56, 0.92)',
              border: `1px solid ${C.panelBorder}`,
              borderLeft: `4px solid ${C.yellow}`,
              borderRadius: 10,
              padding: '6px 14px',
              fontSize: 19,
              lineHeight: 1.3,
            }}
          >
            <b style={{color: C.yellow}}>{name}</b>
            <span style={{color: C.text}}> — {def}</span>
          </div>
        );
      })}
    </div>
  );
};

export const Lead: React.FC<Kids & {at?: number}> = ({at = 0, children}) => (
  <Appear at={at} style={{fontSize: 34, color: C.dim, textAlign: 'center', marginBottom: 28}}>
    {children}
  </Appear>
);

/** Key takeaway pinned to the bottom of the beat. */
export const Caption: React.FC<Kids & {at?: number; color?: string}> = ({at = 0, color = C.accent, children}) => {
  const s = useSpring(at);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 6,
        display: 'flex',
        justifyContent: 'center',
        opacity: s,
        transform: `translateY(${(1 - s) * 20}px)`,
      }}
    >
      <div
        style={{
          background: 'rgba(22, 30, 56, 0.94)',
          border: `1px solid ${C.panelBorder}`,
          borderLeft: `6px solid ${color}`,
          borderRadius: 14,
          padding: '16px 30px',
          fontSize: 30,
          lineHeight: 1.35,
          maxWidth: 1560,
          textAlign: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const Panel: React.FC<Kids & {accent?: string; side?: 'top' | 'left'; style?: React.CSSProperties}> = ({
  accent,
  side = 'top',
  style,
  children,
}) => (
  <div
    style={{
      background: C.panel,
      border: `1px solid ${C.panelBorder}`,
      ...(accent ? (side === 'top' ? {borderTop: `5px solid ${accent}`} : {borderLeft: `6px solid ${accent}`}) : {}),
      borderRadius: 18,
      padding: 26,
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Chip: React.FC<
  Kids & {color?: string; size?: number; filled?: boolean; mono?: boolean; width?: number; style?: React.CSSProperties}
> = ({color = C.accent, size = 30, filled = false, mono = false, width, style, children}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${size * 0.28}px ${size * 0.55}px`,
      borderRadius: size * 0.35,
      border: `2px solid ${color}`,
      background: filled ? color : hexA(color, 0.14),
      color: filled ? C.bg : C.text,
      fontSize: size,
      fontFamily: mono ? MONO : FONT,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      width,
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Badge: React.FC<Kids & {color: string}> = ({color, children}) => (
  <span
    style={{
      display: 'inline-block',
      padding: '6px 16px',
      borderRadius: 999,
      background: hexA(color, 0.18),
      border: `2px solid ${color}`,
      color,
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: 1,
    }}
  >
    {children}
  </span>
);

export const ArrowR: React.FC<{w?: number; color?: string; label?: React.ReactNode}> = ({w = 70, color = C.dim, label}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 8px'}}>
    {label && <div style={{fontSize: 20, color, marginBottom: 4, fontFamily: MONO, whiteSpace: 'nowrap'}}>{label}</div>}
    <svg width={w} height={20}>
      <line x1={0} y1={10} x2={w - 12} y2={10} stroke={color} strokeWidth={3} />
      <polygon points={`${w - 14},2 ${w},10 ${w - 14},18`} fill={color} />
    </svg>
  </div>
);

export const ArrowD: React.FC<{h?: number; color?: string; label?: React.ReactNode}> = ({h = 50, color = C.dim, label}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
    <svg width={20} height={h}>
      <line x1={10} y1={0} x2={10} y2={h - 12} stroke={color} strokeWidth={3} />
      <polygon points={`2,${h - 14} 10,${h} 18,${h - 14}`} fill={color} />
    </svg>
    {label && <span style={{fontSize: 24, color, fontFamily: MONO}}>{label}</span>}
  </div>
);

export const Typewriter: React.FC<{text: string; at: number; cps?: number}> = ({text, at, cps = 30}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const n = Math.max(0, Math.floor(((f - at) * cps) / fps));
  return <>{text.slice(0, n)}</>;
};

export type CellStyle = {text?: React.ReactNode; bg?: string; color?: string; border?: string; scale?: number; opacity?: number};

export const MatrixGrid: React.FC<{
  rows: number;
  cols: number;
  cell: number;
  gap?: number;
  fontSize?: number;
  cellStyle: (r: number, c: number) => CellStyle;
  rowLabels?: string[];
  colLabels?: string[];
  labelSize?: number;
  labelW?: number;
  rowStyle?: (r: number) => React.CSSProperties;
}> = ({rows, cols, cell, gap = 6, fontSize = 22, cellStyle, rowLabels, colLabels, labelSize = 20, labelW = 0, rowStyle}) => (
  <div style={{display: 'inline-block'}}>
    {colLabels && (
      <div style={{display: 'flex', marginLeft: labelW, gap, marginBottom: 8}}>
        {colLabels.map((l, c) => (
          <div key={c} style={{width: cell, textAlign: 'center', fontSize: labelSize, color: C.dim, whiteSpace: 'nowrap'}}>
            {l}
          </div>
        ))}
      </div>
    )}
    {Array.from({length: rows}).map((_, r) => (
      <div key={r} style={{display: 'flex', gap, marginBottom: gap, alignItems: 'center', borderRadius: 10, ...rowStyle?.(r)}}>
        {rowLabels && (
          <div style={{width: labelW - 14, marginRight: 14 - gap, textAlign: 'right', fontSize: labelSize, color: C.dim}}>
            {rowLabels[r]}
          </div>
        )}
        {Array.from({length: cols}).map((__, c) => {
          const s = cellStyle(r, c);
          return (
            <div
              key={c}
              style={{
                width: cell,
                height: cell,
                borderRadius: 8,
                background: s.bg ?? C.panel,
                color: s.color ?? C.text,
                border: s.border ?? `1px solid ${C.panelBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: MONO,
                fontSize,
                fontWeight: 600,
                transform: `scale(${s.scale ?? 1})`,
                opacity: s.opacity ?? 1,
                boxSizing: 'border-box',
              }}
            >
              {s.text}
            </div>
          );
        })}
      </div>
    ))}
  </div>
);

export const ProbBars: React.FC<{
  items: {label: string; v: number; color?: string}[];
  at: number;
  width?: number;
  labelW?: number;
  fontSize?: number;
  pct?: boolean;
}> = ({items, at, width = 700, labelW = 200, fontSize = 28, pct = false}) => {
  const frame = useCurrentFrame();
  const max = Math.max(...items.map((i) => i.v));
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      {items.map((it, k) => {
        const p = interpolate(frame, [at + k * 8, at + k * 8 + 30], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
        return (
          <div key={it.label} style={{display: 'flex', alignItems: 'center', gap: 16, opacity: Math.min(1, p * 3)}}>
            <div style={{width: labelW, textAlign: 'right', fontSize}}>{it.label}</div>
            <div style={{width, height: fontSize * 1.1, background: C.panel2, borderRadius: 8}}>
              <div style={{width: (width * it.v * p) / max, height: '100%', borderRadius: 8, background: it.color ?? C.accent}} />
            </div>
            <div style={{fontFamily: MONO, fontSize, width: 110}}>
              {pct ? `%${Math.round(it.v * 100 * p)}` : (it.v * p).toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export type Arc = {to: number; weight: number; at: number; label?: string; color?: string};

export const tokenWidth = (t: string, fs: number) => t.length * fs * 0.55 + fs * 1.1;

/** A row of tokens with attention arcs drawn from one query token to others. */
export const ArcSentence: React.FC<{
  tokens: string[];
  from: number;
  arcs: Arc[];
  width: number;
  top: number;
  fontSize?: number;
  fromAt?: number;
  fromColor?: string;
  tokenColor?: (i: number) => string | undefined;
}> = ({tokens, from, arcs, width, top, fontSize = 36, fromAt = 0, fromColor = C.q, tokenColor}) => {
  const frame = useCurrentFrame();
  const hi = useSpring(fromAt);
  const gap = fontSize * 0.45;
  const ws = tokens.map((t) => tokenWidth(t, fontSize));
  const total = ws.reduce((a, b) => a + b, 0) + gap * (tokens.length - 1);
  let cursor = (width - total) / 2;
  const xs = ws.map((w) => {
    const left = cursor;
    cursor += w + gap;
    return left;
  });
  const cx = (i: number) => xs[i] + ws[i] / 2;
  const th = fontSize * 1.9;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height: top + th}}>
      <svg width={width} height={top + th} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {arcs.map((a, k) => {
          const p = interpolate(frame, [a.at, a.at + 25], [0, 1], clamp);
          const x0 = cx(from);
          const x1 = cx(a.to);
          const y0 = top - 4;
          const h = Math.min(top - 40, 50 + Math.abs(x1 - x0) * 0.32);
          const cy = y0 - h;
          const color = a.color ?? C.yellow;
          return (
            <g key={k} opacity={p > 0 ? 1 : 0}>
              <path
                d={`M ${x0} ${y0} Q ${(x0 + x1) / 2} ${cy} ${x1} ${y0}`}
                fill="none"
                stroke={color}
                strokeWidth={2 + a.weight * 16}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - p}
                opacity={0.4 + a.weight * 0.6}
              />
            </g>
          );
        })}
      </svg>
      {arcs.map((a, k) =>
        a.label ? (
          <div
            key={`l${k}`}
            style={{
              position: 'absolute',
              left: xs[a.to],
              width: ws[a.to],
              top: top + th + 8,
              textAlign: 'center',
              fontSize: fontSize * 0.72,
              fontWeight: 700,
              fontFamily: MONO,
              color: a.color ?? C.yellow,
              opacity: interpolate(frame, [a.at + 15, a.at + 30], [0, 1], clamp),
            }}
          >
            {a.label}
          </div>
        ) : null,
      )}
      {tokens.map((t, i) => {
        const isFrom = i === from;
        const col = isFrom ? fromColor : tokenColor?.(i);
        const amount = isFrom ? hi : col ? 1 : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: xs[i],
              top,
              width: ws[i],
              height: th,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize,
              fontWeight: 600,
              background: col ? hexA(col, 0.22 * amount) : 'rgba(255,255,255,0.04)',
              border: `2px solid ${col ? hexA(col, Math.max(0.25, amount)) : C.panelBorder}`,
              boxSizing: 'border-box',
            }}
          >
            {t}
          </div>
        );
      })}
    </div>
  );
};
