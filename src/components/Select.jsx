import { ChevronDown } from "lucide-react";

export function Select({ value, onChange, children, style, className = "pd-input" }) {
  return (
    <div className="relative" style={style}>
      <select
        className={`${className} appearance-none pr-8`}
        value={value}
        onChange={onChange}
        style={{ width: "100%", ...style }}
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: "var(--slate)" }} />
    </div>
  );
}
