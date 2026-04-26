import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import InterviewPrepPage from './pages/InterviewPrepPage.jsx'
import InterviewQuestionsPage from './pages/InterviewQuestionsPage.jsx'
import ReferenceCheckPage from './pages/ReferenceCheckPage.jsx'
import RatingQuestionnairePage from './pages/RatingQuestionnairePage.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app" dir="rtl">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/prepare" element={<InterviewPrepPage />} />
          <Route path="/reference-check" element={<ReferenceCheckPage />} />
          <Route path="/rating-questionnaire" element={<RatingQuestionnairePage />} />
          <Route path="/interview" element={<InterviewQuestionsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
