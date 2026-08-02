import { useState } from "react";
import { useAction } from "convex/react";
import { Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { api } from "../../convex/_generated/api";

export function AiAnalysis({ scope, stats }) {
  const analyze = useAction(api.ai.analyze);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const text = await analyze({ scope, ...stats });
      setResult(text);
    } catch (err) {
      setError(err?.message || "Analysis failed. Try again.");
      setResult("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg p-4" style={{ background: "var(--ledger)", border: "1px solid var(--line)" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="pd-label flex items-center gap-1.5">
          <Sparkles size={12} style={{ color: "var(--brass)" }} /> AI Analysis
        </div>
        <button onClick={run} disabled={loading} className="pd-btn flex items-center gap-1.5 no-underline" style={{ opacity: loading ? 0.6 : 1 }}>
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          {loading ? "Analyzing…" : result ? "Refresh" : "Generate analysis"}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-xs rounded-md px-3 py-2 mb-2" style={{ background: "rgba(193,89,75,0.14)", color: "var(--brick)", border: "1px solid var(--brick-dim)" }}>
          <AlertTriangle size={12} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}
      {result ? (
        <p className="text-sm" style={{ color: "var(--sand-dim)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{result}</p>
      ) : (
        !error && (
          <p className="text-sm" style={{ color: "var(--slate)" }}>
            {loading ? "Reviewing your MFE/MAE stats…" : "Generate a plain-English take on market vs limit entry and your take-profit, from your MFE/MAE numbers."}
          </p>
        )
      )}
    </div>
  );
}
