// import Home from './components/Home/Home';
import React from 'react';
import NewAppointment from './components/NewAppointment/NewAppointment';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import PatientList from './components/Patients/Patients';
import AppointmentListing from './components/Appointments/Appointments';
import AppointmentDetails from './components/Appointments/AppointmentDetails';
import EditPrescription from './components/Appointments/EditPrescription';

// Import other components as needed
// import Login from './components/Login/Login';
// import Dashboard from './components/Dashboard/Dashboard';
// import NotFound from './components/NotFound/NotFound';

interface Route {
  path: string;
  element: React.ReactNode;
}

export const routes: Route[] = [
  { path: '/', element: React.createElement(NewAppointment) },
  { path: '/login', element: React.createElement(Login) },
  { path: '/dashboard', element: React.createElement(Dashboard) },
  { path: '/patients', element: React.createElement(PatientList) },
  { path: '/appointments', element: React.createElement(AppointmentListing) },
  { path: '/appointments/:id', element: React.createElement(AppointmentDetails) },
  { path: '/appointments/:id/edit-prescription', element: React.createElement(EditPrescription) },

  // { path: '/login', element: React.createElement(Login) },
  // { path: '/dashboard', element: React.createElement(Dashboard) },
  // { path: '*', element: React.createElement(NotFound) },
];
