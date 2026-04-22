
import { useEffect } from "react";

import Router from "./app/router";
import { trackAppOpenOncePerSession } from "./services/analytics";

export default function App() {
  useEffect(() => {
    trackAppOpenOncePerSession();
  }, []);

  return <Router />;
}
