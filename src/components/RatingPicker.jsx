import { RATING_META } from "../utils";

export function RatingPicker({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {["green", "amber", "red"].map((r) => (
        <button key={r} type="button" onClick={() => onChange(r)} style={{
          width: 22, height: 22, borderRadius: "50%", border: `2px solid ${value === r ? RATING_META[r].color : "var(--line)"}`,
          background: value === r ? RATING_META[r].color : "transparent",
          cursor: "pointer", transition: "border-color 0.15s",
        }} title={RATING_META[r].label} />
      ))}
    </div>
  );
}
