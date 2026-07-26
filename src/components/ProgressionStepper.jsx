import { Check, Circle, X } from "lucide-react";

export function ProgressionStepper({ phaseCount, status, target, compact }) {
  if (phaseCount <= 0) return null;

  const steps = [];
  for (let i = 1; i <= phaseCount; i++) steps.push({ label: `Phase ${i}`, phase: i });
  steps.push({ label: "Funded", phase: "funded" });

  const statusOrder = { phase_1: 0, phase_2: 1, funded: 2, passed: 2, breached: -1 };
  const currentIdx = statusOrder[status] ?? -1;
  const isBreached = status === "breached";
  const targetParts = target ? target.split("/").map((s) => s.trim()) : [];

  const p = compact ? { pad: "p-2", radius: "rounded-md", connector: 16 } : { pad: "p-3", radius: "rounded-lg", connector: 24 };

  return (
    <div className={compact ? "mb-4" : "mb-6"}>
      <div className="pd-label mb-2">Progression</div>
      <div className="flex items-stretch gap-0">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          let state = "pending";
          if (isBreached) state = "breached";
          else if (i < currentIdx) state = "done";
          else if (i === currentIdx) state = "active";

          const colors = {
            done: { bg: "var(--sage-dim)", text: "var(--sage)", border: "var(--sage)" },
            active: { bg: "rgba(206,159,82,0.2)", text: "var(--brass)", border: "var(--brass)" },
            pending: { bg: "transparent", text: "var(--slate)", border: "var(--line)" },
            breached: { bg: "rgba(193,89,75,0.15)", text: "var(--brick)", border: "var(--brick)" },
          };
          const c = colors[state];
          const target = i < targetParts.length ? targetParts[i] : null;

          return (
            <div key={step.label} className="flex items-center" style={{ flex: 1 }}>
              <div className={`flex-1 flex flex-col items-center justify-center ${p.radius} ${p.pad}`} style={{ border: `1.5px solid ${c.border}`, background: c.bg }}>
                <div className="pd-mono text-xs" style={{ color: c.text, fontWeight: state === "active" ? 600 : 500 }}>{step.label}</div>
                {state === "done" && <div className="w-full flex justify-center"><Check size={12} style={{ color: "var(--sage)" }} /></div>}
                {state === "active" && <div className="w-full flex justify-center"><Circle size={8} className={isBreached ? "" : "pd-pulse"} fill="var(--brass)" style={{ color: "var(--brass)" }} /></div>}
                {state === "breached" && <div className="w-full flex justify-center"><X size={12} style={{ color: "var(--brick)" }} /></div>}
                {target && <div className="pd-mono text-xs mt-0.5" style={{ color: "var(--slate)" }}>{target}</div>}
              </div>
              {!isLast && <div style={{ width: p.connector, height: 2, background: state === "done" ? "var(--sage)" : "var(--line)", flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
