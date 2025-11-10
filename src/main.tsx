import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import LearnPage from "./LearnPage";
import { AnimationControllerProvider } from "./context/AnimationController";
import { AnchorsProvider } from "./context/Anchors";

// For debugging
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element");
}

const root = ReactDOM.createRoot(rootElement);
const app = (
  <React.StrictMode>
    <BrowserRouter>
      <AnimationControllerProvider>
        <AnchorsProvider>
          <div className="h-full">
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/learn" element={<LearnPage />} />
            </Routes>
          </div>
        </AnchorsProvider>
      </AnimationControllerProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// For debugging
console.log('Rendering app...');
root.render(app);
