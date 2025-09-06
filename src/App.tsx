import React, { useEffect } from "react";
import { BrowserRouter as Router, useRoutes } from "react-router-dom";
import { routes } from "./routes";
import config from "../configLoader";
import { Provider } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from "../store";

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
        <Router>
          <AppRoutes />
        </Router>
      </PersistGate>
    </Provider>
  );
};

export default App;
