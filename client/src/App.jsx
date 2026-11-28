import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import MainLayout from './layouts/MainLayout';
import ApartmentsPage from './pages/ApartmentsPage';
import HouseholdsPage from './pages/HouseholdsPage';
import ResidentsPage from './pages/ResidentsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import ResidentHomePage from './pages/ResidentHomePage';
import FeesPage from './pages/FeesPage';
import UtilitiesPage from './pages/UtilitiesPage';
import BillingCyclesPage from './pages/BillingCyclesPage';
import InvoicesPage from './pages/InvoicesPage';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('accessToken');
  return token ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ allowedRoles, children }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.role) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/apartments' : '/resident/home'} replace />;
  }
  return children;
}

function DefaultHomeRedirect() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return <Navigate to={user.role === 'ADMIN' ? '/apartments' : '/resident/home'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DefaultHomeRedirect />} />

          <Route
            path="apartments"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <ApartmentsPage />
              </RoleRoute>
            }
          />
          <Route
            path="households"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <HouseholdsPage />
              </RoleRoute>
            }
          />
          <Route
            path="residents"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <ResidentsPage />
              </RoleRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminUsersPage />
              </RoleRoute>
            }
          />
          <Route
            path="fees"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <FeesPage />
              </RoleRoute>
            }
          />
          <Route
            path="utilities"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <UtilitiesPage />
              </RoleRoute>
            }
          />
          <Route
            path="billing-cycles"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <BillingCyclesPage />
              </RoleRoute>
            }
          />
          <Route
            path="invoices"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <InvoicesPage />
              </RoleRoute>
            }
          />
          <Route
            path="resident/home"
            element={
              <RoleRoute allowedRoles={['RESIDENT', 'ADMIN']}>
                <ResidentHomePage />
              </RoleRoute>
            }
          />
        </Route>

        <Route path="*" element={<DefaultHomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
