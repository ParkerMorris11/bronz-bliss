import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Copy, MessageSquare, Send, Clock, CheckCircle, User, Phone } from "lucide-react";
import type { Appointment, Client, Service, MessageLog } from "@shared/schema";
import { formatTime } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageType = "confirmation" | "prep_reminder" | "rinse_reminder" | "aftercare" | "rebooking";

interface MessageTemplate {
  type: MessageType;
  label: string;
  emoji: string;
  build: (name: string, service: string, date: string, time: string, bookingLink: string) => string;
}

// ─── Message Templates ────────────────────────────────────────────────────────

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    type: "confirmation",
    label: "Confirmation",
    emoji: "✅",
    build: (name, service, date, time) =>
      `Hi ${name}! Your ${service} is confirmed for ${date} at ${time}. See you soon! ✨ - BRONZ Bliss`,
  },
  {
    type: "prep_reminder",
    label: "Prep Reminder",
    emoji: "🤎",
    build: (name, _service, _date, time) =>
      `Hey ${name}! Your tan is tomorrow at ${time}. Exfoliate tonight & skip lotions/deodorant day-of for the best results! 🤎 - BRONZ Bliss`,
  },
  {
    type: "rinse_reminder",
    label: "Rinse Reminder",
    emoji: "🚿",
    build: (name) =>
      `Hey ${name}! Time to rinse your tan 🚿 Lukewarm water only — no soap. Pat dry gently. You're gonna love it! ✨ - BRONZ Bliss`,
  },
  {
    type: "aftercare",
    label: "Aftercare",
    emoji: "🌟",
    build: (name) =>
      `Thanks for coming in ${name}! For the best results: avoid water 8 hrs, moisturize daily, and skip exfoliants for 5 days. Enjoy your glow! 🤎 - BRONZ Bliss`,
  },
  {
    type: "rebooking",
    label: "Rebooking",
    emoji: "📅",
    build: (name, _service, _date, _time, bookingLink) =>
      `Hey ${name}! It's been a bit since your last tan. Ready to glow again? Book anytime: ${bookingLink} ✨ - BRONZ Bliss`,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getBookingLink(): string {
  return window.location.origin + window.location.pathname + "#/book";
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr + "T00:00:00");
  return d.toDateString() === today.toDateString();
}

function isFutureOrToday(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  return d >= today;
}

function logTypeBadgeClass(type: string): string {
  switch (type) {
    case "confirmation":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30";
    case "prep_reminder":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30";
    case "rinse_reminder":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-400/30";
    case "aftercare":
      return "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-400/30";
    case "rebooking":
      return "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-400/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function logTypeLabel(type: string): string {
  return MESSAGE_TEMPLATES.find((t) => t.type === type)?.label ?? type;
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function AppointmentCardSkeleton() {
  return (
    <Card className="border border-amber-200/30 dark:border-amber-800/20 bg-white/40 dark:bg-white/5 backdrop-blur-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="space-y-1.5 text-right">
            <Skeleton className="h-3 w-32 ml-auto" />
            <Skeleton className="h-3 w-20 ml-auto" />
          </div>
        </div>
        <div className="h-px bg-amber-100/50 dark:bg-amber-800/20" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Appointment Card ─────────────────────────────────────────────────────────

interface AppointmentCardProps {
  appointment: Appointment;
  client: Client | undefined;
  service: Service | undefined;
  copiedKey: string | null;
  onCopy: (template: MessageTemplate, appointment: Appointment, client: Client, service: Service) => void;
}

function AppointmentCard({ appointment, client, service, copiedKey, onCopy }: AppointmentCardProps) {
  const clientName = client ? `${client.firstName} ${client.lastName}` : "Unknown Client";
  const serviceName = service?.name ?? "service";
  const dateDisplay = formatDateDisplay(appointment.date);
  const timeDisplay = formatTime(appointment.time);
  const todayFlag = isToday(appointment.date);

  return (
    <Card
      className="border border-amber-200/40 dark:border-amber-700/20 bg-white/50 dark:bg-white/5 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-200"
      data-testid={`appointment-card-${appointment.id}`}
    >
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span
                className="font-semibold text-sm text-foreground truncate"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
                data-testid={`client-name-${appointment.id}`}
              >
                {clientName}
              </span>
              {todayFlag && (
                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 flex-shrink-0">
                  Today
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-amber-500 flex-shrink-0" />
              <span
                className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 tracking-wide"
                data-testid={`client-phone-${appointment.id}`}
              >
                {client?.phone ?? "No phone on file"}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-end">
              <Clock className="w-3 h-3" />
              <span data-testid={`appointment-datetime-${appointment.id}`}>
                {dateDisplay} · {timeDisplay}
              </span>
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              {serviceName}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-amber-200/50 via-amber-100/30 to-transparent dark:from-amber-700/30 dark:via-amber-800/20 mb-4" />

        {/* Message buttons */}
        <div className="flex flex-wrap gap-2">
          {MESSAGE_TEMPLATES.map((template) => {
            const key = `${appointment.id}-${template.type}`;
            const isCopied = copiedKey === key;
            const disabled = !client || !service;
            return (
              <button
                key={template.type}
                data-testid={`msg-btn-${appointment.id}-${template.type}`}
                onClick={() => {
                  if (client && service) {
                    onCopy(template, appointment, client, service);
                  }
                }}
                disabled={disabled}
                className={[
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border",
                  "transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                  isCopied
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40 scale-95"
                    : "bg-white/70 dark:bg-white/10 text-foreground border-amber-200/60 dark:border-amber-700/40 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300/70 hover:scale-105 active:scale-95",
                  disabled ? "opacity-40 cursor-not-allowed !scale-100" : "cursor-pointer",
                ].join(" ")}
                aria-label={`Copy ${template.label} message for ${clientName}`}
              >
                {isCopied ? (
                  <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 text-amber-500 flex-shrink-0" />
                )}
                <span>
                  {template.emoji} {template.label}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Log Entry ────────────────────────────────────────────────────────────────

interface LogEntryProps {
  log: MessageLog;
  client: Client | undefined;
}

function LogEntry({ log, client }: LogEntryProps) {
  const clientName = client ? `${client.firstName} ${client.lastName}` : "Unknown Client";
  const sentAt = new Date(log.sentAt);
  const dateStr = sentAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = sentAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-start gap-3 px-4 py-3 rounded-xl bg-white/40 dark:bg-white/5 border border-amber-200/30 dark:border-amber-700/20 hover:bg-white/60 dark:hover:bg-white/8 transition-colors"
      data-testid={`log-entry-${log.id}`}
    >
      {/* Left: type + content */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Badge
          className={`text-[10px] px-2 py-0.5 h-5 border flex-shrink-0 mt-0.5 ${logTypeBadgeClass(log.type)}`}
          data-testid={`log-type-${log.id}`}
        >
          {logTypeLabel(log.type)}
        </Badge>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span
              className="text-sm font-semibold text-foreground"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
              data-testid={`log-client-name-${log.id}`}
            >
              {clientName}
            </span>
            <span className="text-xs font-mono text-amber-600 dark:text-amber-400" data-testid={`log-phone-${log.id}`}>
              {log.to}
            </span>
          </div>
          <p
            className="text-xs text-muted-foreground leading-relaxed"
            data-testid={`log-preview-${log.id}`}
          >
            {truncate(log.body, 80)}
          </p>
        </div>
      </div>

      {/* Right: timestamp + status */}
      <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 flex-shrink-0 pl-0 sm:pl-2">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap" data-testid={`log-timestamp-${log.id}`}>
          {dateStr} · {timeStr}
        </span>
        <Badge
          className={`text-[10px] px-2 py-0.5 h-5 border ${
            log.status === "sent"
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30"
              : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-400/30"
          }`}
          data-testid={`log-status-${log.id}`}
        >
          {log.status === "sent" ? "Sent" : "Copied"}
        </Badge>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: appointments = [], isLoading: aptsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: messageLogs = [], isLoading: logsLoading } = useQuery<MessageLog[]>({
    queryKey: ["/api/message-logs"],
  });

  // ── Derived Data ─────────────────────────────────────────────────────────
  const clientMap = useMemo(() => {
    const map = new Map<number, Client>();
    clients.forEach((c) => map.set(c.id, c));
    return map;
  }, [clients]);

  const serviceMap = useMemo(() => {
    const map = new Map<number, Service>();
    services.forEach((s) => map.set(s.id, s));
    return map;
  }, [services]);

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.status === "scheduled" && isFutureOrToday(a.date))
      .sort((a, b) => {
        const dc = a.date.localeCompare(b.date);
        return dc !== 0 ? dc : a.time.localeCompare(b.time);
      });
  }, [appointments]);

  const sortedLogs = useMemo(() => {
    return [...messageLogs].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
  }, [messageLogs]);

  // ── Log Mutation ─────────────────────────────────────────────────────────
  const logMutation = useMutation({
    mutationFn: (data: Omit<MessageLog, "id">) =>
      apiRequest("POST", "/api/message-logs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-logs"] });
    },
  });

  // ── Copy Handler ─────────────────────────────────────────────────────────
  const handleCopy = (
    template: MessageTemplate,
    appointment: Appointment,
    client: Client,
    service: Service
  ) => {
    const bookingLink = getBookingLink();
    const dateDisplay = formatDateDisplay(appointment.date);
    const timeDisplay = formatTime(appointment.time);
    const body = template.build(
      client.firstName,
      service.name,
      dateDisplay,
      timeDisplay,
      bookingLink
    );

    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(body).catch(() => fallbackCopy(body));
    } else {
      fallbackCopy(body);
    }

    // Copied feedback
    const key = `${appointment.id}-${template.type}`;
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2500);

    // Toast
    toast({
      title: "Copied!",
      description: `Paste in iMessage to ${client.firstName} ${client.lastName}`,
    });

    // Log to backend
    logMutation.mutate({
      clientId: client.id,
      appointmentId: appointment.id,
      type: template.type,
      channel: "sms",
      to: client.phone ?? "",
      body,
      status: "copied",
      sentAt: new Date().toISOString(),
    });
  };

  const isQuickSendLoading = aptsLoading || clientsLoading || servicesLoading;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-xl font-bold text-foreground tracking-tight"
            style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            data-testid="messages-page-title"
          >
            Messages
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Copy &amp; paste to send via text
          </p>
        </div>
        {!isQuickSendLoading && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 flex-shrink-0">
            <MessageSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              {upcomingAppointments.length} upcoming
            </span>
          </div>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="quick-send" className="w-full">
        <TabsList
          className="bg-white/50 dark:bg-white/10 border border-amber-200/40 dark:border-amber-700/20 backdrop-blur-sm p-1 h-auto w-auto"
          data-testid="messages-tabs"
        >
          <TabsTrigger
            value="quick-send"
            className="inline-flex items-center gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium transition-all"
            data-testid="tab-quick-send"
          >
            <Send className="w-3.5 h-3.5" />
            Quick Send
          </TabsTrigger>
          <TabsTrigger
            value="message-log"
            className="inline-flex items-center gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-4 py-1.5 text-sm font-medium transition-all"
            data-testid="tab-message-log"
          >
            <Clock className="w-3.5 h-3.5" />
            Message Log
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Quick Send ───────────────────────────────────────────── */}
        <TabsContent value="quick-send" className="mt-4 space-y-3" data-testid="quick-send-content">
          {isQuickSendLoading ? (
            <>
              <AppointmentCardSkeleton />
              <AppointmentCardSkeleton />
              <AppointmentCardSkeleton />
            </>
          ) : upcomingAppointments.length === 0 ? (
            <Card className="border border-amber-200/30 dark:border-amber-700/20 bg-white/40 dark:bg-white/5 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-amber-500" />
                </div>
                <h3
                  className="text-sm font-semibold text-foreground mb-1"
                  style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
                >
                  No upcoming appointments
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Scheduled appointments will appear here so you can copy pre-built messages in one tap.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3" data-testid="appointment-list">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  client={clientMap.get(appointment.clientId)}
                  service={serviceMap.get(appointment.serviceId)}
                  copiedKey={copiedKey}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab 2: Message Log ──────────────────────────────────────────── */}
        <TabsContent value="message-log" className="mt-4" data-testid="message-log-content">
          <Card className="border border-amber-200/30 dark:border-amber-700/20 bg-white/40 dark:bg-white/5 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-3 px-5 pt-5">
              <CardTitle
                className="text-base font-semibold"
                style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
              >
                All Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {logsLoading || clientsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/30 dark:bg-white/5 border border-amber-200/20"
                    >
                      <Skeleton className="h-5 w-24 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <Skeleton className="h-3 w-36" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                      <Skeleton className="h-4 w-14 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : sortedLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <h3
                    className="text-sm font-semibold text-foreground mb-1"
                    style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
                  >
                    No messages logged yet
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Every time you copy a message from Quick Send, it'll appear here for your records.
                  </p>
                </div>
              ) : (
                <div className="space-y-2" data-testid="message-log-list">
                  {sortedLogs.map((log) => (
                    <LogEntry key={log.id} log={log} client={clientMap.get(log.clientId)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Clipboard Fallback ───────────────────────────────────────────────────────

function fallbackCopy(text: string): void {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.cssText = "position:absolute;left:-9999px;top:-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}
