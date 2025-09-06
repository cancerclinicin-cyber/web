// import Home from './components/Home/Home';
import React from 'react';
import Signup from './components/Signup/Signup';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import PatientList from './components/Patients/Patients';
import AppointmentListing from './components/Appointments/Appointments';

// Import other components as needed
// import Login from './components/Login/Login';
// import Dashboard from './components/Dashboard/Dashboard';
// import NotFound from './components/NotFound/NotFound';

interface Route {
  path: string;
  element: React.ReactNode;
}

export const routes: Route[] = [
  { path: '/', element: React.createElement(Signup) },
  { path: '/login', element: React.createElement(Login) },
  { path: '/dashboard', element: React.createElement(Dashboard) },
  { path: '/patients', element: React.createElement(PatientList) },
    { path: '/appointments', element: React.createElement(AppointmentListing) },

  // { path: '/login', element: React.createElement(Login) },
  // { path: '/dashboard', element: React.createElement(Dashboard) },
  // { path: '*', element: React.createElement(NotFound) },
];
