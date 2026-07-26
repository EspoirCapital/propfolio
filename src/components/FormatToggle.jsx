export function FormatToggle({ value, onChange, options }) {
  const opts = options || ["dollar", "percent", "rr"];
  const labels = { dollar: "$", percent: "%", rr: "RR" };
  return (
    <div className="flex gap-0.5">
      {opts.map((o) => (
        <button key={o} type="button" className="pd-btn" style={{
          padding: "2px 6px", fontSize: 11, minWidth: 0,
          borderColor: value === o ? "var(--brass)" : undefined,
          color: value === o ? "var(--brass)" : "var(--slate)",
        }} onClick={() => onChange(o)}>{labels[o]}</button>
      ))}
    </div>
  );
}
