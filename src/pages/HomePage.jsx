import { Link, useNavigate } from 'react-router-dom'
import AppHeroBanner from '../components/AppHeroBanner.jsx'
import { homeFaqItems } from '../data/homeFaq.js'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="home-page" dir="rtl">
      <AppHeroBanner />

      <section className="home-video-section" aria-label="סרטון הסבר">
        <div className="home-video-frame">
          <iframe
            className="home-video-iframe"
            src="https://player.vimeo.com/video/1188790632?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479"
            title="סרטון הסבר ראיון להצלחה"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
          />
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
