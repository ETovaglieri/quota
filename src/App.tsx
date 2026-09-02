import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ListaGruppi from './viaggio/screens/ListaGruppi'
import DashboardViaggio from './viaggio/screens/DashboardViaggio'
import FeedSpese from './viaggio/screens/FeedSpese'
import Saldi from './viaggio/screens/Saldi'
import RiepilogoFinale from './viaggio/screens/RiepilogoFinale'

// App pubblica, nessun login: chi entra da link basta il nome (vedi
// src/viaggio/lib/miGruppi.ts). Ogni viaggio è raggiungibile solo con il suo
// slug, che funge da chiave d'accesso condivisa.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ListaGruppi />} />
        <Route path="/:slug" element={<DashboardViaggio />} />
        <Route path="/:slug/spese" element={<FeedSpese />} />
        <Route path="/:slug/saldi" element={<Saldi />} />
        <Route path="/:slug/riepilogo" element={<RiepilogoFinale />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
