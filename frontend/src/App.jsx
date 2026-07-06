import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Financeiro } from './pages/Financeiro'
import { Materiais } from './pages/Materiais'
import { Membros } from './pages/Membros'
import { Agenda } from './pages/Agenda'
import { MinhasMensalidades } from './pages/MinhasMensalidades'
import { Login } from './pages/Login'
import { getToken, getUser } from './lib/api'
import './App.css'

// Componente para proteção de rotas com base em autenticação e cargo (role)
function ProtectedRoute({ children, adminOnly = false }) {
  const token = getToken()
  const user = getUser()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/financeiro" element={
            <ProtectedRoute adminOnly>
              <Financeiro />
            </ProtectedRoute>
          } />
          
          <Route path="/minhas-mensalidades" element={
            <ProtectedRoute>
              <MinhasMensalidades />
            </ProtectedRoute>
          } />

          <Route path="/materiais" element={
            <ProtectedRoute>
              <Materiais />
            </ProtectedRoute>
          } />
          
          <Route path="/membros" element={
            <ProtectedRoute>
              <Membros />
            </ProtectedRoute>
          } />
          
          <Route path="/agenda" element={
            <ProtectedRoute>
              <Agenda />
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
