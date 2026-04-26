import { useMemo } from 'react'

const CONFETTI_COLORS = ['#f4b848', '#e36969', '#6dceb3', '#8a71dd', '#0054a6', '#3a9b9e', '#ffffff']

/**
 * @param {{ burstKey: number }} props — שינוי מפתח יוצר אנימציה חדשה
 */
export default function ConfettiCelebration({ burstKey }) {
  const pieces = useMemo(() => {
    return Array.from({ length: 58 }, (_, i) => {
      const wide = Math.random() > 0.45
      return {
        id: `${burstKey}-${i}`,
        left: `${Math.random() * 100}%`,
        top: `${-8 - Math.random() * 22}vh`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        w: wide ? 10 + Math.random() * 6 : 5 + Math.random() * 3,
        h: wide ? 5 + Math.random() * 4 : 11 + Math.random() * 8,
        drift: `${(Math.random() - 0.5) * 280}px`,
        duration: `${1.85 + Math.random() * 1.35}s`,
        delay: `${Math.random() * 0.35}s`,
        rounded: Math.random() > 0.55 ? '50%' : '2px',
      }
    })
  }, [burstKey])

  return (
    <div className="confetti-root" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.w}px`,
            height: `${p.h}px`,
            backgroundColor: p.color,
            borderRadius: p.rounded,
            '--confetti-drift': p.drift,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  )
}
