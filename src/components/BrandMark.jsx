export function BrandMark({ ...props }) {
  return (
    <svg viewBox="0 0 240 56" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="1" y="1" width="54" height="54" rx="14" style={{ fill: "var(--brass)" }} />
      <text x="28" y="28" textAnchor="middle" dominantBaseline="central"
        fontFamily="'IBM Plex Mono', monospace" fontSize="20" fontWeight="600" letterSpacing="0.5"
        style={{ fill: "var(--ink)" }}>EC</text>
      <text x="68" y="28" textAnchor="start" dominantBaseline="central"
        fontFamily="'IBM Plex Mono', monospace" fontSize="24" fontWeight="600" letterSpacing="1.5"
        style={{ fill: "var(--brass)" }}>PROPFOLIO</text>
    </svg>
  );
}
