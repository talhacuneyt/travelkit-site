import './App.css'
import Navbar from './components/navbar'
import HomeContent from './components/homecontent'
import Footer from './components/footer'
import DocumentTitle from './components/DocumentTitle'
import ScrollToTopButton from './components/ScrollToTopButton'
import { LanguageProvider } from './contexts/LanguageContext'
import { DarkModeProvider } from './contexts/DarkModeContext'

import { Routes, Route, useLocation } from 'react-router-dom'

import Hakkimizda from './pages/hakkimizda'
import Iletisim from './pages/iletisim'
import SSS from './pages/sss'
import EkonomikDetay from './pages/ekonomik'
import KonforluDetay from './pages/konforlu'
import LuxDetay from './pages/lux'
import SatinAl from './pages/satin-al'
import Admin from './pages/admin'
import NotFound from './pages/NotFound'

function App() {
  const location = useLocation()
  const isAdminPage = location.pathname === '/admin'
  const isNotFoundPage = location.pathname !== '/' && 
    !location.pathname.startsWith('/paket/') && 
    !['/hakkimizda', '/sss', '/iletisim', '/admin', '/ekonomik', '/konforlu', '/lux', '/satin-al'].includes(location.pathname)

  return (
    <LanguageProvider>
      <DarkModeProvider>
        <div>
          <DocumentTitle />
          {!isNotFoundPage && <Navbar />}
          <Routes>
            <Route path="/" element={<HomeContent />} />
            <Route path="/ekonomik" element={<EkonomikDetay />} />
            <Route path="/konforlu" element={<KonforluDetay />} />
            <Route path="/lux" element={<LuxDetay />} />
            <Route path="/hakkimizda" element={<Hakkimizda />} />
            <Route path="/sss" element={<SSS />} />
            <Route path="/iletisim" element={<Iletisim />} />
            <Route path="/satin-al" element={<SatinAl />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/paket/ekonomik" element={<Admin />} />
            <Route path="/admin/paket/konforlu" element={<Admin />} />
            <Route path="/admin/paket/lux" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          {!isAdminPage && !isNotFoundPage && <Footer />}
          {!isNotFoundPage && <ScrollToTopButton />}
        </div>
      </DarkModeProvider>
    </LanguageProvider>
  );
}

export default App;
