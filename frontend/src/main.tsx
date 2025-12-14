import { createRoot } from "react-dom/client";
import { SemesterProvider } from "@/contexts/SemesterContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <SemesterProvider>
    <App />
  </SemesterProvider>
);
