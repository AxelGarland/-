import { anchorKeys, anchorLabelByKey, anchorLegendSubtextByKey } from '../data/questionBank.js'

export default function AnchorColorLegend({ className = '' }) {
  const legendItems = [
    ...anchorKeys.map((key) => ({
      key,
      label: anchorLabelByKey[key],
      sub: anchorLegendSubtextByKey[key],
      className: `anchor-legend-item--${key} anchor-q--${key}`,
    })),
    {
      key: 'prediction',
      label: 'ניבוי המראיין',
      sub: 'הערכת המראיין לגבי התאמת המועמד.ת לתפקיד',
      className: 'anchor-legend-item--prediction anchor-q--prediction',
    },
  ]

  return (
    <div className={`anchor-legend ${className}`.trim()} aria-label="מקרא צבעי עוגנים">
      <span className="anchor-legend-title">מקרא עוגנים:</span>
      <ul className="anchor-legend-list">
        {legendItems.map((item) => {
          const { key, label, sub } = item
          const ariaLabel = sub ? `${label}. ${sub}` : label
          return (
            <li
              key={key}
              tabIndex={0}
              aria-label={ariaLabel}
              className={`anchor-legend-item ${item.className}`}
            >
              <span className="anchor-legend-swatch" aria-hidden />
              <span className="anchor-legend-copy" aria-hidden>
                <span className="anchor-legend-label">{label}</span>
                {sub ? <span className="anchor-legend-sub">{sub}</span> : null}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
