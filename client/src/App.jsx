import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';

// Social Worker Pages
import SWDashboard from './pages/social_worker/Dashboard';
import CreateTicket from './pages/social_worker/CreateTicket';
import MyTickets from './pages/social_worker/MyTickets';

// Org Admin Pages
import OADashboard from './pages/org_admin/Dashboard';
import Notifications from './pages/org_admin/Notifications';
import SubmitReport from './pages/org_admin/SubmitReport';

// CSR Admin Pages
import CSRDashboard from './pages/csr_admin/Dashboard';
import FundableCamps from './pages/csr_admin/FundableCamps';
import FundingHistory from './pages/csr_admin/FundingHistory';

// Coordinator Pages
import CoordDashboard from './pages/coordinator/Dashboard';
import PendingReports from './pages/coordinator/PendingReports';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          
          <Route element={<MainLayout />}>
            {/* Social Worker Routes */}
            <Route element={<ProtectedRoute allowedRoles={['social_worker']} />}>
              <Route path="/social-worker" element={<SWDashboard />} />
              <Route path="/social-worker/tickets/create" element={<CreateTicket />} />
              <Route path="/social-worker/tickets" element={<MyTickets />} />
            </Route>

            {/* Org Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['org_admin']} />}>
              <Route path="/org-admin" element={<OADashboard />} />
              <Route path="/org-admin/notifications" element={<Notifications />} />
              <Route path="/org-admin/reports/submit" element={<SubmitReport />} />
            </Route>

            {/* CSR Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['csr_admin']} />}>
              <Route path="/csr-admin" element={<CSRDashboard />} />
              <Route path="/csr-admin/camps/fundable" element={<FundableCamps />} />
              <Route path="/csr-admin/funding/history" element={<FundingHistory />} />
            </Route>

            {/* Coordinator Routes */}
            <Route element={<ProtectedRoute allowedRoles={['coordinator']} />}>
              <Route path="/coordinator" element={<CoordDashboard />} />
              <Route path="/coordinator/reports/pending" element={<PendingReports />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;