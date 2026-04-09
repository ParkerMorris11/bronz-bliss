import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ChevronLeft, ChevronRight, Clock, CalendarDays } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { formatTime } from "@/lib/format";
import type { Appointment, Client, Service } from "@shared/schema";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  checked_in: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  completed: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  cancelled: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
  no_show: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400 dark:border-gray-700",
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

  const displayDate = new Date(selectedDate + "T12:00:00");
  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Calendar
          </h1>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => changeDate(-1)} data-testid="button-prev-day">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto text-sm h-7"
              data-testid="input-date"
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => changeDate(1)} data-testid="button-next-day">
              <ChevronRight className="w-4 h-4" />
            </Button>
            {!isToday && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                data-testid="button-today"
              >
                Today
              </Button>
            )}
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-new-appointment">
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

      {/* Day heading */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {displayDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </span>
        {isToday && <Badge variant="outline" className="text-[10px] px-1.5 py-0">today</Badge>}
        <span className="text-xs">&middot; {sorted.length} appointment{sorted.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-4"><div className="h-12 bg-muted/30 rounded animate-pulse" /></CardContent></Card>)}
          </div>
        ) : sorted.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No appointments</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Nothing scheduled for this day</p>
            </CardContent>
          </Card>
        ) : (
          sorted.map((appt) => {
            const client = allClients.find((c) => c.id === appt.clientId);
            const service = allServices.find((s) => s.id === appt.serviceId);
            return (
              <Card key={appt.id} data-testid={`card-appointment-${appt.id}`} className="hover:bg-muted/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center shrink-0 pt-0.5">
                        <span className="text-sm font-semibold tabular-nums">{formatTime(appt.time)}</span>
                        <span className="text-[10px] text-muted-foreground">{service?.duration}min</span>
                      </div>
                      <div className="border-l pl-3">
                        <p className="text-sm font-medium">
                          <Link href={`/clients/${appt.clientId}`} className="hover:underline">
                            {client ? `${client.firstName} ${client.lastName}` : `Client #${appt.clientId}`}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {service?.name ?? `Service #${appt.serviceId}`}
                          {service && ` — $${service.price}`}
                        </p>
                        {appt.notes && <p className="text-xs text-muted-foreground/70 mt-1 italic">{appt.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium px-2 py-0.5 ${statusColors[appt.status] || ""}`}
                      >
                        {appt.status.replace("_", " ")}
                      </Badge>
                      {appt.status === "scheduled" && (
                        <Link href={`/check-in/${appt.id}`}>
                          <Button size="sm" variant="secondary" className="h-7 text-xs" data-testid={`button-checkin-${appt.id}`}>
                            Check In
                          </Button>
                        </Link>
                      )}
                      {appt.status === "scheduled" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:text-destructive"
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
