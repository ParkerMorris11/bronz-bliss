import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Client } from "../../../shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Clients() {
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest("GET", "/api/clients").then(r => r.json()),
  });

  const statusColors: Record<string, string> = {
    active: "var(--success)",
    at_risk: "var(--warning)",
    dormant: "var(--danger)",
  };
  const statusLabels: Record<string, string> = {
    active: "Active",
    at_risk: "At Risk",
    dormant: "Dormant",
  };

  return (
    <div style={{ padding: "24px 28px", color: "rgba(255,255,255,0.92)" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Clients</h1>
        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
          {clients?.length ?? 0} total clients
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: "grid", gap: 10 }}>
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {clients?.map(c => (
            <div key={c.id} data-testid={`client-row-${c.id}`} style={{
              padding: "14px 18px", borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 999,
                  background: "linear-gradient(135deg, rgba(231,181,111,0.3), rgba(231,181,111,0.1))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: "0.9rem", color: "rgba(231,181,111,0.9)",
                  flexShrink: 0,
                }}>
                  {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{c.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{c.phone}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>{c.totalVisits ?? 0} visits</div>
                  {c.lastVisitDate && (
                    <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
                      Last: {c.lastVisitDate}
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: "0.72rem", fontWeight: 600, padding: "4px 10px", borderRadius: 999,
                  background: `${statusColors[c.status ?? "active"]}18`,
                  color: statusColors[c.status ?? "active"],
                  border: `1px solid ${statusColors[c.status ?? "active"]}30`,
                }}>
                  {statusLabels[c.status ?? "active"]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
