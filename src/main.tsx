import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import { scene } from "./motion/scene"
import "./styles.css"

// handy for poking at the morph from the browser console while developing
if (import.meta.env.DEV) Object.assign(window, { scene })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
