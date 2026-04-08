import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment, Client, Service } from "@shared/schema";

export default function CheckInPage() {
  const [, params] = useRoute("/check-in/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id);
  const { toast } = useToast();

  const { data: appointment, isLoading } = useQuery<Appointment>({
    queryKey: ["/api/appointments", id],
    queryFn: () => apiRequest("GET", `/api/appointments/${id}`).then((r) => r.json()),
    enabled: !!id,
  });

  const { data: client } = useQuery<Client>({
    queryKey: ["/api/clients", appointment?.clientId],
    queryFn: () => apiRequest("GET", `/api/clients/${appointment!.clientId}`).then((r) => r.json()),
    enabled: !!appointment?.clientId,
  });

  const { data: service } = useQuery<Service>({
    queryKey: ["/api/services", appointment?.serviceId],
    queryFn: () => apiRequest("GET", `/api/services/${appointment!.serviceId}`).then((r) => r.json()),
    enabled: !!appointment?.serviceId,
  });

  const completeMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Update appointment status
      await apiRequest("PATCH", `/api/appointments/${id}`, { status: "completed" });

      // Create session record
      await apiRequest("POST", "/api/sessions", {
        appointmentId: id,
        clientId: appointment!.clientId,
        formula: (formData.get("formula") as string) || null,
        shade: (formData.get("shade") as string) || null,
        rinseTime: formData.get("rinseTime") ? Number(formData.get("rinseTime")) : null,
        aftercareNotes: (formData.get("aftercareNotes") as string) || null,
        sessionNotes: (formData.get("sessionNotes") as string) || null,
        createdAt: new Date().toISOString().split("T")[0],
      });

      // Create payment
      if (service) {
        await apiRequest("POST", "/api/payments", {
          clientId: appointment!.clientId,
          appointmentId: id,
          amount: service.price,
          type: "service",
          method: (formData.get("paymentMethod") as string) || "card",
          createdAt: new Date().toISOString().split("T")[0],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Session completed and recorded" });
      navigate("/calendar");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    completeMutation.mutate(new FormData(e.currentTarget));
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!appointment) {
    return <div className="p-6"><p className="text-sm text-muted-foreground">Appointment not found</p></div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/calendar">
          <Button size="icon" variant="ghost" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Session Check-In
          </h1>
          <p className="text-xs text-muted-foreground">
            {client ? `${client.firstName} ${client.lastName}` : "Loading..."} — {service?.name} — {appointment.time}
          </p>
        </div>
      </div>

      {/* Client quick info */}
      {client && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {client.skinType && <div><span className="text-muted-foreground">Skin type:</span> {client.skinType}</div>}
              {client.preferredFormula && <div><span className="text-muted-foreground">Preferred formula:</span> {client.preferredFormula}</div>}
              {client.allergies && <div className="col-span-2 text-amber-600 dark:text-amber-400">Allergies: {client.allergies}</div>}
              {client.notes && <div className="col-span-2 text-muted-foreground">{client.notes}</div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Tan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Formula / Solution</Label>
                <Input
                  name="formula"
                  placeholder="e.g. SunFX Medium"
                  defaultValue={client?.preferredFormula || ""}
                  data-testid="input-formula"
                />
              </div>
              <div className="space-y-2">
                <Label>Shade</Label>
                <Select name="shade">
                  <SelectTrigger data-testid="select-shade">
                    <SelectValue placeholder="Select shade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="extra_dark">Extra Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rinse Time (hours)</Label>
              <Input name="rinseTime" type="number" min="1" max="24" placeholder="e.g. 8" data-testid="input-rinse-time" />
            </div>
            <div className="space-y-2">
              <Label>Session Notes</Label>
              <Textarea name="sessionNotes" placeholder="Application notes, coverage, etc." data-testid="input-session-notes" />
            </div>
            <div className="space-y-2">
              <Label>Aftercare Instructions</Label>
              <Textarea
                name="aftercareNotes"
                placeholder="e.g. Avoid water for 8 hours, moisturize after first rinse..."
                defaultValue="Avoid water for 8 hours. Moisturize after first rinse. Wear loose dark clothing."
                data-testid="input-aftercare"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>{service?.name}</span>
              <span className="font-semibold">${service?.price}</span>
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select name="paymentMethod" defaultValue="card">
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full"
          disabled={completeMutation.isPending}
          data-testid="button-complete-session"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {completeMutation.isPending ? "Completing..." : "Complete Session & Checkout"}
        </Button>
      </form>
    </div>
  );
}
