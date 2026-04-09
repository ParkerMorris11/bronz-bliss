import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, User, CheckCircle, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Client } from "@shared/schema";

const skinTypes = ["Type I", "Type II", "Type III", "Type IV", "Type V", "Type VI"];

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setOpen(false);
      toast({ title: "Client added" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      firstName: fd.get("firstName") as string,
      lastName: fd.get("lastName") as string,
      email: (fd.get("email") as string) || null,
      phone: (fd.get("phone") as string) || null,
      skinType: (fd.get("skinType") as string) || null,
      allergies: (fd.get("allergies") as string) || null,
      notes: (fd.get("notes") as string) || null,
      preferredFormula: null,
      createdAt: new Date().toISOString().split("T")[0],
    });
  };

  const filtered = clients.filter((c) => {
    const name = `${c.firstName} ${c.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Clients
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-new-client">
              <Plus className="w-4 h-4 mr-1" /> New Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input name="firstName" required data-testid="input-first-name" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input name="lastName" required data-testid="input-last-name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" data-testid="input-email" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input name="phone" data-testid="input-phone" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Skin Type</Label>
                <Select name="skinType">
                  <SelectTrigger data-testid="select-skin-type">
                    <SelectValue placeholder="Select skin type" />
                  </SelectTrigger>
                  <SelectContent>
                    {skinTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Allergies / Sensitivities</Label>
                <Input name="allergies" data-testid="input-allergies" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea name="notes" data-testid="input-client-notes" />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-client">
                {createMutation.isPending ? "Adding..." : "Add Client"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search-clients"
        />
      </div>

      <div className="space-y-1.5">
        {isLoading ? (
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-4"><div className="h-10 bg-muted/30 rounded animate-pulse" /></CardContent></Card>)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {search ? "No clients match your search" : "No clients yet"}
              </p>
              {!search && <p className="text-xs text-muted-foreground/60 mt-1">Add your first client to get started</p>}
            </CardContent>
          </Card>
        ) : (
          filtered.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="cursor-pointer hover:bg-muted/20 transition-colors" data-testid={`card-client-${client.id}`}>
                <CardContent className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{client.firstName} {client.lastName}</p>
                        {client.waiverSigned && client.intakeCompleted && (
                          <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                        )}
                        {(!client.waiverSigned || !client.intakeCompleted) && (
                          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {[client.phone, client.email, client.skinType].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {client.preferredFormula && (
                        <span className="text-[11px] text-muted-foreground">{client.preferredFormula}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
