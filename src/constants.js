import { Clock3, CheckCircle2, AlertTriangle } from "lucide-react";

export const STATUS_META = {
  phase_1: { label: "Phase 1", color: "var(--slate)", bg: "rgba(137,146,163,0.12)", icon: Clock3, pulse: true },
  phase_2: { label: "Phase 2", color: "var(--brass)", bg: "rgba(206,159,82,0.12)", icon: Clock3, pulse: true },
  funded: { label: "Funded", color: "var(--sage)", bg: "rgba(111,176,139,0.12)", icon: CheckCircle2, pulse: false },
  passed: { label: "Passed", color: "var(--sage)", bg: "rgba(111,176,139,0.12)", icon: CheckCircle2, pulse: true },
  breached: { label: "Breached", color: "var(--brick)", bg: "rgba(193,89,75,0.14)", icon: AlertTriangle, pulse: false },
};
