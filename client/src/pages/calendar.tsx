import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Appointment, Client, Service } from "@shared/schema";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  checked_in: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  no_show: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
};

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", selectedDate],
    queryFn: () => apiRequest("GET", `/api/appointments?date=${selectedDate}`).then((r) => r.json()),
  });

  const { data: allClients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const { data: allServices = [] } = useQuery<Service[]>({ queryKey: ["/api/services"] });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/appointments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setOpen(false);
      toast({ title: "Appointment created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) =>
      apiRequest("PATCH", `/api/appointments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      clientId: Number(fd.get("clientId")),
      serviceId: Number(fd.get("serviceId")),
      date: selectedDate,
      time: fd.get("time") as string,
      status: "scheduled",
      depositPaid: false,
      notes: (fd.get("notes") as string) || null,
      createdAt: new Date().toISOString().split("T")[0],
    });
  };

  const sorted = [...appointments].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Calendar
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Button size="icon" variant="ghost" onClick={() => changeDate(-1)} data-testid="button-prev-day">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto text-sm"
              data-testid="input-date"
            />
            <Button size="icon" variant="ghost" onClick={() => changeDate(1)} data-testid="button-next-day">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
              data-testid="button-today"
            >
              Today
            </Button>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-appointment">
              <Plus className="w-4 h-4 mr-1" /> New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Appointment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select name="clientId" required>
                  <SelectTrigger data-testid="select-client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {allClients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Service</Label>
                <Select name="serviceId" required>
                  <SelectTrigger data-testid="select-service">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {allServices.filter((s) => s.isActive).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} — ${s.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" name="time" required data-testid="input-time" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea name="notes" placeholder="Optional notes..." data-testid="input-notes" />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-appointment">
                {createMutation.isPending ? "Creating..." : "Create Appointment"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : sorted.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No appointments on this date</p>
            </CardContent>
          </Card>
        ) : (
          sorted.map((appt) => {
            const client = allClients.find((c) => c.id === appt.clientId);
            const service = allServices.find((s) => s.id === appt.serviceId);
            return (
              <Card key={appt.id} data-testid={`card-appointment-${appt.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold tabular-nums mt-0.5">{appt.time}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          <Link href={`/clients/${appt.clientId}`} className="hover:underline">
                            {client ? `${client.firstName} ${client.lastName}` : `Client #${appt.clientId}`}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {service?.name ?? `Service #${appt.serviceId}`}
                          {service && ` — ${service.duration}min — $${service.price}`}
                        </p>
                        {appt.notes && <p className="text-xs text-muted-foreground mt-1">{appt.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${statusColors[appt.status] || ""}`}
                      >
                        {appt.status.replace("_", " ")}
                      </Badge>
                      {appt.status === "scheduled" && (
                        <Link href={`/check-in/${appt.id}`}>
                          <Button size="sm" variant="secondary" data-testid={`button-checkin-${appt.id}`}>
                            Check In
                          </Button>
                        </Link>
                      )}
                      {appt.status === "scheduled" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => updateMutation.mutate({ id: appt.id, status: "cancelled" })}
                          data-testid={`button-cancel-${appt.id}`}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
