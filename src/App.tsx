import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CookieBanner } from './components/CookieBanner';

import { Home } from './pages/Home';
import { Method } from './pages/Method';
import { Pricing } from './pages/Pricing';
import { FAQ } from './pages/FAQ';
import { Contact } from './pages/Contact';
import { Legal } from './pages/Legal';
import { Privacy } from './pages/Privacy';
import { Login } from './pages/Login';
import { Offline } from './pages/Offline';

import { ClientDashboard } from './pages/client/ClientDashboard';
import { ClientAppointments } from './pages/client/ClientAppointments';
import { ClientDocuments } from './pages/client/ClientDocuments';
import { ClientData } from './pages/client/ClientData';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminClients } from './pages/admin/AdminClients';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminDocuments } from './pages/admin/AdminDocuments';
import { ClientDetail } from './pages/admin/ClientDetail';
import { AdminMessages } from './pages/admin/AdminMessages';
import { ClientMessages } from './pages/client/ClientMessages';
import { ResetPassword } from './pages/ResetPassword';
import { ForcePasswordChangePage } from './pages/ForcePasswordChangePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/methode" element={<Method />} />
            <Route path="/tarifs" element={<Pricing />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/mentions-legales" element={<Legal />} />
            <Route path="/politique-confidentialite" element={<Privacy />} />
            <Route path="/connexion" element={<Login />} />
            <Route path="/offline" element={<Offline />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/client/dashboard"
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/force-password-change" element={<ForcePasswordChangePage />} />
            <Route
              path="/client/rendez-vous"
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <ClientAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/documents"
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <ClientDocuments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/mes-donnees"
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <ClientData />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/messages"
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <ClientMessages />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clients"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminClients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rendez-vous"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/parametres"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/documents"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDocuments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clients/:clientId"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ClientDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminMessages />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <CookieBanner />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
