import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PackagePlan, ClientPackage, Client } from "@shared/schema";

export default function PackagesPage() {
  const [openPlan, setOpenPlan] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const { toast } = useToast();

  const { data: plans = [] } = useQuery<PackagePlan[]>({ queryKey: ["/api/package-plans"] });
  const { data: clientPackages = [] } = useQuery<ClientPackage[]>({ queryKey: ["/api/client-packages"] });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });

  const createPlanMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/package-plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/package-plans"] });
      setOpenPlan(false);
      toast({ title: "Package plan created" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const pkg = await apiRequest("POST", "/api/client-packages", data).then((r) => r.json());
      // Also create payment
      const plan = plans.find((p) => p.id === data.packagePlanId);
      if (plan) {
        await apiRequest("POST", "/api/payments", {
          clientId: data.clientId,
          amount: plan.price,
          type: "package",
          method: "card",
          createdAt: new Date().toISOString().split("T")[0],
        });
      }
      return pkg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-packages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setOpenAssign(false);
      toast({ title: "Package assigned" });
    },
  });

  const handleCreatePlan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createPlanMutation.mutate({
      name: fd.get("name") as string,
      sessions: Number(fd.get("sessions")),
      price: Number(fd.get("price")),
      validDays: Number(fd.get("validDays")),
      isActive: true,
    });
  };

  const handleAssign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const planId = Number(fd.get("planId"));
    const plan = plans.find((p) => p.id === planId);
    const today = new Date();
    const expiry = new Date(today);
    expiry.setDate(expiry.getDate() + (plan?.validDays ?? 90));

    assignMutation.mutate({
      clientId: Number(fd.get("clientId")),
      packagePlanId: planId,
      sessionsRemaining: plan?.sessions ?? 0,
      purchaseDate: today.toISOString().split("T")[0],
      expiryDate: expiry.toISOString().split("T")[0],
      status: "active",
    });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Packages
        </h1>
        <div className="flex gap-2">
          <Dialog open={openAssign} onOpenChange={setOpenAssign}>
            <DialogTrigger asChild>
              <Button variant="secondary" data-testid="button-assign-package">
                <Users className="w-4 h-4 mr-1" /> Assign to Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Package to Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAssign} className="space-y-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select name="clientId" required>
                    <SelectTrigger data-testid="select-assign-client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.firstName} {c.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Package Plan</Label>
                  <Select name="planId" required>
                    <SelectTrigger data-testid="select-assign-plan">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.filter((p) => p.isActive).map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} — {p.sessions} sessions — ${p.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={assignMutation.isPending} data-testid="button-submit-assign">
                  {assignMutation.isPending ? "Assigning..." : "Assign Package"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={openPlan} onOpenChange={setOpenPlan}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-plan">
                <Plus className="w-4 h-4 mr-1" /> New Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Package Plan</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div className="space-y-2">
                  <Label>Plan Name</Label>
                  <Input name="name" required placeholder="e.g. Glow 5-Pack" data-testid="input-plan-name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Sessions</Label>
                    <Input name="sessions" type="number" min="1" required data-testid="input-plan-sessions" />
                  </div>
                  <div className="space-y-2">
                    <Label>Price ($)</Label>
                    <Input name="price" type="number" min="0" step="0.01" required data-testid="input-plan-price" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Valid Days</Label>
                  <Input name="validDays" type="number" min="1" defaultValue="90" required data-testid="input-plan-valid-days" />
                </div>
                <Button type="submit" className="w-full" disabled={createPlanMutation.isPending} data-testid="button-submit-plan">
                  {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Package Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.isActive ? "opacity-50" : ""} data-testid={`card-plan-${plan.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className="text-sm font-semibold">{plan.name}</p>
                    <p className="text-2xl font-bold tabular-nums mt-1">${plan.price}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {plan.sessions} sessions · {plan.validDays} days
                    </p>
                  </div>
                  <div className="p-2 rounded-md bg-primary/10 shrink-0">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Active Client Packages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Active Client Packages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {clientPackages.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4">No active packages</p>
          ) : (
            <div className="divide-y">
              {clientPackages.map((cp) => {
                const client = clients.find((c) => c.id === cp.clientId);
                const plan = plans.find((p) => p.id === cp.packagePlanId);
                return (
                  <div key={cp.id} className="flex items-center justify-between gap-2 px-4 py-3" data-testid={`row-client-package-${cp.id}`}>
                    <div>
                      <p className="text-sm font-medium">
                        {client ? `${client.firstName} ${client.lastName}` : `Client #${cp.clientId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {plan?.name} · {cp.sessionsRemaining} sessions left · Expires {cp.expiryDate}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${cp.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : ""}`}
                    >
                      {cp.status}
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
