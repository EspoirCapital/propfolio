import { StrictMode, Component } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", background: "#0a0b0f", color: "#e8dcc8", fontFamily: "'IBM Plex Mono', monospace", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
          <div style={{ maxWidth: 520, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
            <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 600 }}>Something went wrong</h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9a8e7a", lineHeight: 1.6 }}>{this.state.error.message}</p>
            <button onClick={() => { this.setState({ error: null }); location.reload(); }} style={{ background: "#ce9f52", color: "#0a0b0f", border: "none", padding: "10px 24px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
