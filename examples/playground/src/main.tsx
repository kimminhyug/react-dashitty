import React from "react";
import { createRoot } from "react-dom/client";
import { DashboardExample } from "./DashboardExample";

const App = () => (
  <div style={{ minHeight: "100vh", padding: "24px 16px" }}>
    <header style={{ marginBottom: 24, textAlign: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
        Dashboardity Playground
      </h1>
      <p style={{ marginTop: 8, color: "#8b949e", fontSize: 14 }}>
        위젯/대시보드 테스트
      </p>
    </header>
    <DashboardExample />
  </div>
);

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("root element not found");
createRoot(rootEl).render(<App />);
