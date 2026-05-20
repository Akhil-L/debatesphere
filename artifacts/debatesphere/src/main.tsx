import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// In production, use the VITE_API_URL env variable
// In development, use relative URLs (proxied by Vite)
const apiUrl = import.meta.env.VITE_API_URL ?? "";
setBaseUrl(apiUrl);

createRoot(document.getElementById("root")!).render(<App />);