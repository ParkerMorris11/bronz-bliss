import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Appointment } from "../../../shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const TODAY = new Date().toISOString().slice(0, 10);

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${String(m).padStart(2,"0")} ${ampm}`;
}

export default function Appointments() {
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", TODAY],
    queryFn: () => apiRequest("GET", `/api/appointments?date=${TODAY}`).then(r => r.json()),
  });

  const statusColors: Record<string, string> = {
    completed: "var(--success)",
    checked_in: "var(--amber)",
    scheduled: "rgba(255,255,255,0.4)",
    no_show: "var(--danger)",
    cancelled: "var(--danger)",
  };

  return (
    <div style={{ padding: "24px 28px", color: "rgba(255,255,255,0.92)" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Appointments</h1>
        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Today · {TODAY}</p>
      </div>

      {isLoading ? (
        <div style={{ display: "grid", gap: 10 }}>
          {[0,1,2].map(i => <Skeleton key={i} className="h-16 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {(appointments ?? []).sort((a, b) => a.time.localeCompare(b.time)).map(a => (
            <div key={a.id} data-testid={`appointment-${a.id}`} style={{
              padding: "14px 18px", borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 999, flexShrink: 0,
                  background: statusColors[a.status ?? "scheduled"],
                }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Client #{a.clientId}</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                    Service #{a.serviceId} · {fmtTime(a.time)}
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: "0.75rem", fontWeight: 600, padding: "4px 10px", borderRadius: 999,
                background: `${statusColors[a.status ?? "scheduled"]}18`,
                color: statusColors[a.status ?? "scheduled"],
              }}>
                {a.status?.replace("_"," ") ?? "scheduled"}
              </span>
            </div>
          ))}
          {(appointments ?? []).length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: "rgba(255,255,255,0.25)" }}>
              No appointments today
            </div>
          )}
        </div>
      )}
    </div>
  );
}
