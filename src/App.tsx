import React, { useEffect } from "react";
import { BrowserRouter as Router, useRoutes } from "react-router-dom";
import { routes } from "./routes";
import config from "../configLoader";
import { Provider } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from "../store";
import { LoadingProvider } from "./components/common/LoadingContext";

const AppRoutes: React.FC = () => {
  return useRoutes(routes);
};

const App: React.FC = () => {
  useEffect(() => {
    document.title = config.APPLICATION_TITLE || "Default Title";
  }, []);

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
