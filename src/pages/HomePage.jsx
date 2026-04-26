import { Link, useNavigate } from 'react-router-dom'
import AppHeroBanner from '../components/AppHeroBanner.jsx'
import { homeFaqItems } from '../data/homeFaq.js'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="home-page" dir="rtl">
      <AppHeroBanner />

      <section className="home-video-section" aria-labelledby="home-video-heading">
        <h2 id="home-video-heading" className="home-video-heading">
          סרטון הסבר — איך להשתמש
        </h2>
        <div
          className="home-video-frame"
          role="img"
          aria-label="מקום לסרטון הסבר. התוכן יתווסף בקרוב."
        >
          <div className="home-video-placeholder-inner">
            <span className="home-video-play-icon" aria-hidden>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            </span>
            <span className="home-video-caption">כאן יוצג סרטון ההדרכה (בקרוב)</span>
            <span className="home-video-hint">יחס 16:9 — גודל טיפוסי לסרטון מוטמע</span>
          </div>
        </div>
      </section>

      <div className="home-actions">
        <Link className="home-card home-card--prep" to="/prepare">
          <div className="home-card-body">
            <span className="home-card-title">הכנה לראיון</span>
            <span className="home-card-desc">מילוי פרטי מועמד.ת, בחירת תפקיד וקבלת שאלות מותאמות</span>
          </div>
          <span className="home-card-footer">
            <span className="home-card-footer-label">המשך</span>
          </span>
        </Link>

        <button
          type="button"
          className="home-card home-card--reference"
          onClick={() => navigate('/reference-check')}
        >
          <div className="home-card-body">
            <span className="home-card-title">שאלון ממליץ</span>
            <span className="home-card-desc">מבנה שיחה ושאלות לשיחת המלצה טלפונית</span>
          </div>
          <span className="home-card-footer">
            <span className="home-card-footer-label">המשך</span>
          </span>
        </button>

        <button
          type="button"
          className="home-card home-card--score"
          onClick={() => navigate('/rating-questionnaire')}
        >
          <div className="home-card-body">
            <span className="home-card-title">שאלון הדירוג</span>
            <span className="home-card-desc">דירוג לפי עוגנים, ניבוי ומסלול מועמד — ציון משוקלל</span>
          </div>
          <span className="home-card-footer">
            <span className="home-card-footer-label">המשך</span>
          </span>
        </button>
      </div>

      <section className="home-faq" aria-labelledby="home-faq-heading">
        <h2 id="home-faq-heading" className="home-faq-title">
          שאלות נפוצות על דיני עבודה
        </h2>
        <p className="home-faq-intro">
          תשובות קצרות לשאלות נפוצות. המידע נועד לסייע למעסיקים לנהל תהליך מיון מקצועי, הוגן ובהתאם
          לחוק.
        </p>
        <div className="home-faq-list">
          {homeFaqItems.map((item) => (
            <details key={item.id} className="home-faq-item">
              <summary className="home-faq-summary">{item.question}</summary>
              <div className="home-faq-answer">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
