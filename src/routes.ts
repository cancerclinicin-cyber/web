import Home from './components/Home/Home';
import React from 'react';

// Import other components as needed
// import Login from './components/Login/Login';
// import Dashboard from './components/Dashboard/Dashboard';
// import NotFound from './components/NotFound/NotFound';

interface Route {
  path: string;
  element: React.ReactNode;
}

export const routes: Route[] = [
  { path: '/', element: React.createElement(Home) },
//   { path: '/about', element: React.createElement(About) },
  // { path: '/login', element: React.createElement(Login) },
  // { path: '/dashboard', element: React.createElement(Dashboard) },
  // { path: '*', element: React.createElement(NotFound) },
];
