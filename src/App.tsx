import React, { useEffect } from "react";
import { BrowserRouter as Router, useRoutes, useLocation } from "react-router-dom";
import { routes } from "./routes";
import config from "../configLoader";
import { Provider, useSelector, useDispatch } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from "../store";
import { LoadingProvider } from "./components/common/LoadingContext";
import MeetingPlayer from "./components/Appointments/MeetingPlayer";
import type { RootState } from "../store";
import { closeMeeting, minimizeMeeting } from "./components/Appointments/meetingSlice";

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const meetingPlayer = useSelector((state: RootState) => state.meeting);

  useEffect(() => {
    // Page-specific titles
    const pageTitles: Record<string, string> = {
      '/': 'Book Appointment - MediConnect',
      '/login': 'Login - MediConnect',
      '/dashboard': 'Dashboard - MediConnect',
      '/patients': 'Patients - MediConnect',
      '/appointments': 'Appointments - MediConnect',
      '/schedules': 'Schedules - MediConnect',
      '/custom-schedules': 'Custom Schedules - MediConnect',
    };

    // Check for dynamic routes
    const path = location.pathname;
    let title = pageTitles[path];

    if (!title) {
      // Handle dynamic routes
      if (path.startsWith('/patients/')) {
        title = 'Patient Details - MediConnect';
      } else if (path.startsWith('/appointments/')) {
        if (path.includes('edit-prescription')) {
          title = 'Edit Prescription - MediConnect';
        } else {
          title = 'Appointment Details - MediConnect';
        }
      }
    }

    // Fallback to default title
    document.title = title || (config.APPLICATION_TITLE || 'MediConnect');

    // Minimize meeting player when navigating to different pages
    if (meetingPlayer.isOpen && !meetingPlayer.isMinimized) {
      dispatch(minimizeMeeting());
    }
  }, [location.pathname, meetingPlayer.isOpen, meetingPlayer.isMinimized, dispatch]);

  return (
    <>
      {useRoutes(routes)}
      {meetingPlayer.isOpen && meetingPlayer.link && (
        <MeetingPlayer
          link={meetingPlayer.link}
          onClose={() => dispatch(closeMeeting())}
        />
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <LoadingProvider>
          <Router>
            <AppRoutes />
          </Router>
        </LoadingProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
