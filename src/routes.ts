// import Home from './components/Home/Home';
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import type { RootState } from '../store';
import NewAppointment from './components/NewAppointment/NewAppointment';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import PatientList from './components/Patients/Patients';
import PatientDetails from './components/Patients/PatientDetails';
import AppointmentListing from './components/Appointments/Appointments';
import AppointmentDetails from './components/Appointments/AppointmentDetails';
import EditPrescription from './components/Appointments/EditPrescription';
import Schedules from './components/Schedules/Schedules';
import CustomSchedules from './components/Schedules/CustomSchedules';

// Import other components as needed
// import Login from './components/Login/Login';
// import Dashboard from './components/Dashboard/Dashboard';
// import NotFound from './components/NotFound/NotFound';

interface Route {
  path: string;
  element: React.ReactNode;
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const accessToken = useSelector((state: RootState) => state.auth.access_token);
  const refreshTokenExpiresAt = useSelector((state: RootState) => state.auth.user?.refresh_token_expires_at);
  const location = useLocation();

  // If no token, redirect to login
  if (!accessToken) {
    return React.createElement(Navigate, { to: "/login", state: { from: location }, replace: true });
  }

  // Check if refresh token is expired
  if (refreshTokenExpiresAt) {
    const refreshExpiry = new Date(refreshTokenExpiresAt);
    const now = new Date();

    if (now > refreshExpiry) {
      // Refresh token expired, redirect to login
      return React.createElement(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
  }

  return React.createElement(React.Fragment, null, children);
};

export const routes: Route[] = [
  // Public routes (no authentication required)
  { path: '/', element: React.createElement(NewAppointment) },
  { path: '/register', element: React.createElement(NewAppointment) },
  { path: '/login', element: React.createElement(Login) },

  // Protected routes (authentication required)
  {
    path: '/dashboard',
    element: React.createElement(ProtectedRoute, null, React.createElement(Dashboard))
  },
  {
    path: '/patients',
    element: React.createElement(ProtectedRoute, null, React.createElement(PatientList))
  },
  {
    path: '/patients/:id',
    element: React.createElement(ProtectedRoute, null, React.createElement(PatientDetails))
  },
  {
    path: '/appointments',
    element: React.createElement(ProtectedRoute, null, React.createElement(AppointmentListing))
  },
  {
    path: '/appointments/:id',
    element: React.createElement(ProtectedRoute, null, React.createElement(AppointmentDetails))
  },
  {
    path: '/appointments/:id/edit-prescription',
    element: React.createElement(ProtectedRoute, null, React.createElement(EditPrescription))
  },
  {
    path: '/schedules',
    element: React.createElement(ProtectedRoute, null, React.createElement(Schedules))
  },
  {
    path: '/custom-schedules',
    element: React.createElement(ProtectedRoute, null, React.createElement(CustomSchedules))
  },

  // { path: '*', element: React.createElement(NotFound) },
];
