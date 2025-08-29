import React, { useEffect } from "react";
import { BrowserRouter as Router, useRoutes } from "react-router-dom";
import { routes } from "./routes";
import config from "../configLoader";

const AppRoutes: React.FC = () => {
  return useRoutes(routes);
};

const App: React.FC = () => {
  useEffect(() => {
    document.title = config.APPLICATION_TITLE || "Default Title";
  }, []);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
