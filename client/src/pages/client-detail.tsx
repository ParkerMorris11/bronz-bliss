import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Mail, Droplets, AlertTriangle, FileText, Clock, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import type { Client, Appointment, SessionRecord, ClientPackage, Service } from "@shared/schema";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  checked_in: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  no_show: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
};

export default function ClientDetailPage() {
  const [, params] = useRoute("/clients/:id");
  const id = Number(params?.id);

  const { data: client, isLoading } = useQuery<Client>({
    queryKey: ["/api/clients", id],
    queryFn: () => apiRequest("GET", `/api/clients/${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", "client", id],
    queryFn: () => apiRequest("GET", `/api/appointments?clientId=${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  const { data: sessions = [] } = useQuery<SessionRecord[]>({
    queryKey: ["/api/sessions/client", id],
    queryFn: () => apiRequest("GET", `/api/sessions/client/${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  const { data: clientPackages = [] } = useQuery<ClientPackage[]>({
    queryKey: ["/api/client-packages", id],
    queryFn: () => apiRequest("GET", `/api/client-packages?clientId=${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"] });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Client not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/clients">
          <Button size="icon" variant="ghost" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            {client.firstName} {client.lastName}
          </h1>
          <p className="text-xs text-muted-foreground">Client since {client.createdAt}</p>
        </div>
      </div>

      {/* Client Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
            )}
            {client.skinType && (
              <div className="flex items-center gap-2 text-sm">
                <Droplets className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{client.skinType}</span>
              </div>
            )}
            {client.allergies && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{client.allergies}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {client.preferredFormula && (
              <div className="flex items-center gap-2 text-sm">
                <Droplets className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Formula: {client.preferredFormula}</span>
              </div>
            )}
            {client.notes && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                <span>{client.notes}</span>
              </div>
            )}
            {!client.preferredFormula && !client.notes && (
              <p className="text-xs text-muted-foreground">No preferences recorded yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Packages */}
      {clientPackages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="w-4 h-4" /> Active Packages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {clientPackages.map((pkg) => (
                <div key={pkg.id} className="flex items-center justify-between text-sm">
                  <span>{pkg.sessionsRemaining} sessions remaining</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Expires {pkg.expiryDate}</span>
                    <Badge variant="secondary" className="text-xs">
                      {pkg.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Session History</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No session records yet</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{s.createdAt}</span>
                    {s.shade && <Badge variant="secondary" className="text-xs">{s.shade}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {s.formula && <p>Formula: {s.formula}</p>}
                    {s.rinseTime && <p>Rinse time: {s.rinseTime} hours</p>}
                    {s.sessionNotes && <p>{s.sessionNotes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Appointments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {appointments.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4">No appointments</p>
          ) : (
            <div className="divide-y">
              {appointments.map((appt) => {
                const svc = services.find((s) => s.id === appt.serviceId);
                return (
                  <div key={appt.id} className="flex items-center justify-between gap-2 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm">{appt.date} at {appt.time}</p>
                        <p className="text-xs text-muted-foreground">{svc?.name}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`text-xs ${statusColors[appt.status] || ""}`}>
                      {appt.status.replace("_", " ")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
