import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Tag, Percent, DollarSign } from "lucide-react";
import { useState } from "react";
import type { PromoCode } from "@shared/schema";

function getStatus(promo: PromoCode): "active" | "expired" | "maxed" {
  if (!promo.isActive) return "expired";
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return "expired";
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return "maxed";
  return "active";
}

function StatusBadge({ promo }: { promo: PromoCode }) {
  const status = getStatus(promo);

  if (status === "active") {
    return (
      <Badge
        data-testid="badge-status-active"
        className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-medium"
      >
        Active
      </Badge>
    );
  }
  if (status === "expired") {
    return (
      <Badge
        data-testid="badge-status-expired"
        className="bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-full text-xs font-medium"
      >
        Expired
      </Badge>
    );
  }
  return (
    <Badge
      data-testid="badge-status-maxed"
      className="bg-zinc-500/20 text-zinc-500 dark:text-zinc-400 border border-zinc-500/30 rounded-full text-xs font-medium"
    >
      Maxed Out
    </Badge>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-amber-200/30 dark:border-amber-900/30 bg-white/40 dark:bg-white/5 backdrop-blur-md p-5 animate-pulse">
      <div className="h-8 w-32 rounded-lg bg-amber-200/50 dark:bg-amber-900/30 mb-3" />
      <div className="h-4 w-20 rounded bg-amber-100/50 dark:bg-amber-900/20 mb-4" />
      <div className="flex justify-between items-center">
        <div className="h-4 w-16 rounded bg-amber-100/50 dark:bg-amber-900/20" />
        <div className="h-4 w-24 rounded bg-amber-100/50 dark:bg-amber-900/20" />
      </div>
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div
      data-testid="empty-state-promo-codes"
      className="col-span-full flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-amber-100/60 dark:bg-amber-900/30 flex items-center justify-center mb-4">
        <Tag className="w-8 h-8 text-amber-500/70" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">No promo codes yet</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs">
        Create your first promo code to start offering discounts to your clients.
      </p>
      <Button
        data-testid="button-empty-create"
        onClick={onCreateClick}
        className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-2"
      >
        <Plus className="w-4 h-4" />
        Create Code
      </Button>
    </div>
  );
}

export default function PromoCodesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const { data: promoCodes, isLoading } = useQuery<PromoCode[]>({
    queryKey: ["/api/promo-codes"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<PromoCode>) =>
      apiRequest("POST", "/api/promo-codes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-codes"] });
      toast({ title: "Promo code created", description: `${code} is now live.` });
      resetForm();
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create promo code.", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/promo-codes/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-codes"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update promo code.", variant: "destructive" });
    },
  });

  function resetForm() {
    setCode("");
    setDiscountType("percent");
    setDiscountValue("");
    setMaxUses("");
    setExpiresAt("");
  }

  function handleCreate() {
    if (!code.trim() || !discountValue) {
      toast({ title: "Validation error", description: "Code and discount value are required.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: parseFloat(discountValue),
      maxUses: maxUses ? parseInt(maxUses) : null,
      expiresAt: expiresAt || null,
    });
  }

  function formatDiscount(promo: PromoCode) {
    if (promo.discountType === "percent") return `${promo.discountValue}% off`;
    return `$${promo.discountValue} off`;
  }

  function formatUses(promo: PromoCode) {
    if (promo.maxUses === null) return `${promo.usedCount} uses (unlimited)`;
    return `${promo.usedCount} / ${promo.maxUses} uses`;
  }

  function formatExpiry(promo: PromoCode) {
    if (!promo.expiresAt) return "No expiry";
    return `Expires ${new Date(promo.expiresAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }

  return (
    <div
      data-testid="page-promo-codes"
      className="min-h-screen p-6 md:p-8"
      style={{ fontFamily: "'Satoshi', sans-serif" }}
    >
      {/* Page Header */}
      <div
        data-testid="header-promo-codes"
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1
            data-testid="heading-promo-codes"
            className="text-2xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
          >
            Promo Codes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage discount codes for your clients
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button
              data-testid="button-create-code"
              className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl gap-2 shadow-md shadow-amber-500/20 transition-all duration-150"
            >
              <Plus className="w-4 h-4" />
              Create Code
            </Button>
          </DialogTrigger>

          <DialogContent
            data-testid="dialog-create-code"
            className="rounded-2xl border border-amber-200/40 dark:border-amber-900/40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl max-w-md"
          >
            <DialogHeader>
              <DialogTitle
                data-testid="dialog-title-create-code"
                className="text-lg font-bold"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
              >
                Create Promo Code
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Code */}
              <div className="space-y-1.5">
                <Label data-testid="label-code" htmlFor="promo-code">
                  Code
                </Label>
                <Input
                  id="promo-code"
                  data-testid="input-code"
                  placeholder="e.g. SUMMER20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="rounded-xl font-mono uppercase tracking-widest"
                />
              </div>

              {/* Discount Type */}
              <div className="space-y-1.5">
                <Label data-testid="label-discount-type" htmlFor="discount-type">
                  Discount Type
                </Label>
                <Select
                  value={discountType}
                  onValueChange={(v) => setDiscountType(v as "percent" | "fixed")}
                >
                  <SelectTrigger
                    id="discount-type"
                    data-testid="select-discount-type"
                    className="rounded-xl"
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem data-testid="option-percent" value="percent">
                      <span className="flex items-center gap-2">
                        <Percent className="w-3.5 h-3.5 text-amber-500" />
                        Percentage
                      </span>
                    </SelectItem>
                    <SelectItem data-testid="option-fixed" value="fixed">
                      <span className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                        Fixed Amount
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Discount Value */}
              <div className="space-y-1.5">
                <Label data-testid="label-discount-value" htmlFor="discount-value">
                  {discountType === "percent" ? "Percentage Off" : "Amount Off ($)"}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                    {discountType === "percent" ? <Percent className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                  </span>
                  <Input
                    id="discount-value"
                    data-testid="input-discount-value"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={discountType === "percent" ? "20" : "10.00"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="rounded-xl pl-8"
                  />
                </div>
              </div>

              {/* Max Uses */}
              <div className="space-y-1.5">
                <Label data-testid="label-max-uses" htmlFor="max-uses">
                  Max Uses{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="max-uses"
                  data-testid="input-max-uses"
                  type="number"
                  min="1"
                  placeholder="Leave blank for unlimited"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {/* Expires At */}
              <div className="space-y-1.5">
                <Label data-testid="label-expires-at" htmlFor="expires-at">
                  Expiry Date{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="expires-at"
                  data-testid="input-expires-at"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-2">
                <Button
                  data-testid="button-cancel-create"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => { setDialogOpen(false); resetForm(); }}
                >
                  Cancel
                </Button>
                <Button
                  data-testid="button-submit-create"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                >
                  {createMutation.isPending ? "Creating…" : "Create Code"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Promo Code Grid */}
      <div
        data-testid="grid-promo-codes"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : !promoCodes || promoCodes.length === 0 ? (
          <EmptyState onCreateClick={() => setDialogOpen(true)} />
        ) : (
          promoCodes.map((promo) => {
            const status = getStatus(promo);
            const isToggling = toggleMutation.isPending;

            return (
              <Card
                key={promo.id}
                data-testid={`card-promo-${promo.id}`}
                className="rounded-2xl border border-amber-200/40 dark:border-amber-900/40 bg-white/50 dark:bg-white/[0.04] backdrop-blur-md shadow-sm hover:shadow-md hover:shadow-amber-500/10 transition-all duration-200 group"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top row: code + status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                        <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span
                        data-testid={`text-code-${promo.id}`}
                        className="font-mono font-bold text-lg tracking-widest text-foreground truncate"
                      >
                        {promo.code}
                      </span>
                    </div>
                    <StatusBadge promo={promo} />
                  </div>

                  {/* Discount */}
                  <div className="flex items-center gap-1.5">
                    {promo.discountType === "percent" ? (
                      <Percent className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <DollarSign className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span
                      data-testid={`text-discount-${promo.id}`}
                      className="text-sm font-semibold text-amber-600 dark:text-amber-400"
                    >
                      {formatDiscount(promo)}
                    </span>
                  </div>

                  {/* Uses */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span data-testid={`text-uses-${promo.id}`}>{formatUses(promo)}</span>
                    </div>
                    {promo.maxUses !== null && (
                      <div className="w-full h-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 overflow-hidden">
                        <div
                          data-testid={`bar-uses-${promo.id}`}
                          className="h-full rounded-full bg-amber-400 dark:bg-amber-500 transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (promo.usedCount / promo.maxUses) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Expiry */}
                  <p
                    data-testid={`text-expiry-${promo.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    {formatExpiry(promo)}
                  </p>

                  {/* Divider */}
                  <div className="border-t border-amber-100/60 dark:border-amber-900/30" />

                  {/* Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {promo.isActive ? "Active" : "Inactive"}
                    </span>
                    <Switch
                      data-testid={`switch-active-${promo.id}`}
                      checked={promo.isActive}
                      disabled={isToggling || status === "expired" || status === "maxed"}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: promo.id, isActive: checked })
                      }
                      aria-label={`Toggle ${promo.code} active state`}
                      className="data-[state=checked]:bg-amber-500"
                    />
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
