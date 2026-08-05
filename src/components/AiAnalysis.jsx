import { useState } from "react";
import { useAction } from "convex/react";
import { RefreshCw, AlertTriangle } from "lucide-react";
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
      <div className="pd-label mb-2">AI Analysis</div>
      {error && (
        <div className="flex items-center gap-2 text-xs rounded-md px-3 py-2 mb-2" style={{ background: "rgba(193,89,75,0.14)", color: "var(--brick)", border: "1px solid var(--brick-dim)" }}>
          <AlertTriangle size={12} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}
      {result ? (
        <p className="text-sm" style={{ color: "var(--sand-dim)", lineHeight: 1.7, whiteSpace: "pre-line" }}>{result}</p>
      ) : loading ? (
        <div aria-label="Analyzing" className="flex flex-col gap-2 py-1">
          <div className="pd-skeleton" style={{ height: 10, width: "92%" }} />
          <div className="pd-skeleton" style={{ height: 10, width: "100%" }} />
          <div className="pd-skeleton" style={{ height: 10, width: "78%" }} />
          <div className="pd-skeleton" style={{ height: 10, width: "85%" }} />
          <div className="pd-skeleton" style={{ height: 10, width: "60%" }} />
        </div>
      ) : (
        !error && (
          <p className="text-sm" style={{ color: "var(--slate)" }}>
            A plain-English read on your edge, risk, and results.
          </p>
        )
      )}
      <div className="flex justify-end mt-3">
        <button onClick={run} disabled={loading} className="pd-btn flex items-center gap-1.5 no-underline" style={{ opacity: loading ? 0.6 : 1 }}>
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          {loading ? "Analyzing…" : result ? "Refresh" : "Generate analysis"}
        </button>
      </div>
    </div>
  );
}
