import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.js";
import "./program.css";

const root = document.querySelector("#root");
if (!root) {
  throw new Error("Missing overlay root element");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
