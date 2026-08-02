import { formatEv } from "../utils";
import { KpiTile } from "./KpiTile";

export function DayEdgeTile({ dayEdge }) {
  return (
    <KpiTile
      label="Day Edge"
      value={dayEdge.best ? `${dayEdge.best.label} ${formatEv(dayEdge.best.avg)}` : "—"}
      accent={!dayEdge.best ? "var(--sand)" : dayEdge.best.avg >= 0 ? "var(--sage)" : "var(--brick)"}
      sub={
        !dayEdge.best ? (
          <span style={{ color: "var(--slate)" }}>No trades with risk</span>
        ) : dayEdge.worst && dayEdge.best.day === dayEdge.worst.day ? (
          <span style={{ color: "var(--slate)" }}>{dayEdge.best.n} trade{dayEdge.best.n !== 1 ? "s" : ""} · only day traded</span>
        ) : (
          <span className="flex items-center justify-end gap-1" style={{ color: "var(--brick)" }}>
            worst {dayEdge.worst.label} {formatEv(dayEdge.worst.avg)}
          </span>
        )
      }
    />
  );
}
