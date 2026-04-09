import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHashLocation } from "wouter/use-hash-location";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarDays,
  Users,
  DollarSign,
  Package,
  Clock,
  ArrowRight,
  CalendarPlus,
  UserPlus,
  MessageSquare,
  Download,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardStats {
  todayAppointments: number;
  totalClients: number;
  monthRevenue: number;
  activePackages: number;
  recentAppointments: {
    id: number;
    clientId: number;
    serviceId: number;
    date: string;
    time: string;
    status: string;
    clientName: string;
    serviceName: string;
  }[];
}

interface Client {
  id: number;
  name: string;
  birthday?: string | null;
  intakeCompleted?: boolean;
  waiverSigned?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  scheduled:
    "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  checked_in:
    "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  completed:
    "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  cancelled:
    "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
  no_show:
    "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400 dark:border-gray-700",
};

const CG = { fontFamily: "'Cabinet Grotesk', sans-serif" } as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function GlassActionButton({
  icon: Icon,
  label,
  onClick,
  testId,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  testId: string;
}) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className="
        flex flex-col items-center justify-center gap-2 p-4 rounded-xl w-full
        border border-white/50 dark:border-white/10
        bg-white/60 dark:bg-white/5
        backdrop-blur-md
        text-foreground hover:bg-white/80 dark:hover:bg-white/10
        transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
        group
      "
    >
      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/18 transition-colors">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-xs font-medium leading-tight text-center" style={CG}>
        {label}
      </span>
    </button>
  );
}

// ─── Birthday Alerts ──────────────────────────────────────────────────────────

function BirthdayAlerts() {
  const { data: birthdayClients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/birthdays?days=30"],
  });

  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div data-testid="birthday-alerts-loading" className="space-y-2">
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!birthdayClients || birthdayClients.length === 0) {
    return null;
  }

  const handleCopyBirthdayMessage = (client: Client) => {
    const message = `Happy Birthday ${client.name}! 🎂🤎 Enjoy a special treat from BRONZ Bliss — we love having you! ✨`;
    navigator.clipboard.writeText(message).then(() => {
      setCopiedId(client.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const formatBirthday = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      data-testid="section-birthday-alerts"
      className="
        rounded-xl border border-amber-200/60 dark:border-amber-800/30
        bg-gradient-to-br from-amber-50/80 to-orange-50/60
        dark:from-amber-950/30 dark:to-orange-950/20
        backdrop-blur-sm p-4
      "
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg leading-none" aria-hidden="true">🎂</span>
        <h2
          className="text-sm font-semibold text-amber-800 dark:text-amber-300"
          style={CG}
          data-testid="heading-birthday-alerts"
        >
          Upcoming Birthdays
        </h2>
        <Badge
          variant="outline"
          className="ml-auto text-[10px] bg-amber-100/60 border-amber-300/60 text-amber-700 dark:bg-amber-900/40 dark:border-amber-700/40 dark:text-amber-400"
          data-testid="badge-birthday-count"
        >
          {birthdayClients.length} in 30 days
        </Badge>
      </div>

      <div className="space-y-2">
        {birthdayClients.map((client) => (
          <div
            key={client.id}
            data-testid={`row-birthday-${client.id}`}
            className="
              flex items-center justify-between gap-2 px-3 py-2 rounded-lg
              bg-white/60 dark:bg-white/5
              border border-amber-100/80 dark:border-amber-900/40
            "
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                <span className="text-xs" aria-hidden="true">🎉</span>
              </div>
              <div className="min-w-0">
                <p
                  className="text-sm font-medium truncate text-foreground"
                  data-testid={`text-birthday-name-${client.id}`}
                >
                  {client.name}
                </p>
                {client.birthday && (
                  <p
                    className="text-[11px] text-muted-foreground"
                    data-testid={`text-birthday-date-${client.id}`}
                  >
                    {formatBirthday(client.birthday)}
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopyBirthdayMessage(client)}
              data-testid={`button-birthday-message-${client.id}`}
              className="shrink-0 text-[11px] h-7 px-2.5 border-amber-300/60 dark:border-amber-700/40 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400"
            >
              {copiedId === client.id ? "Copied!" : "Send Birthday Message"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Today's Checklist ────────────────────────────────────────────────────────

function TodayChecklist({
  appointments,
  isLoading,
}: {
  appointments: DashboardStats["recentAppointments"] | undefined;
  isLoading: boolean;
}) {
  // Fetch all clients to check intakeCompleted and waiverSigned
  const { data: allClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  if (isLoading) {
    return <Skeleton className="h-28 w-full rounded-xl" data-testid="checklist-loading" />;
  }

  const today = new Date().toISOString().split("T")[0];
  const todayAppts =
    appointments?.filter((a) => {
      const apptDate = a.date?.split("T")[0] ?? a.date;
      return apptDate === today;
    }) ?? [];

  const totalToday = todayAppts.length;
  const checkedIn = todayAppts.filter((a) => a.status === "checked_in" || a.status === "completed").length;
  const completed = todayAppts.filter((a) => a.status === "completed").length;

  // Find clients needing intake/waiver
  const clientMap = new Map<number, Client>(
    allClients?.map((c) => [c.id, c]) ?? []
  );
  const needsIntake = todayAppts.filter((a) => {
    const c = clientMap.get(a.clientId);
    return c && (!c.intakeCompleted || !c.waiverSigned);
  });

  const progressPct = totalToday > 0 ? Math.round((checkedIn / totalToday) * 100) : 0;

  return (
    <Card
      data-testid="section-today-checklist"
      className="overflow-hidden border border-border/60"
    >
      <CardHeader className="pb-2 px-5 pt-4">
        <CardTitle
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          style={CG}
          data-testid="heading-today-checklist"
        >
          Today's Checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4 space-y-3">
        {/* Progress summary */}
        <div className="flex items-end justify-between gap-2">
          <p
            className="text-sm font-semibold text-foreground"
            style={CG}
            data-testid="text-checklist-summary"
          >
            {checkedIn} of {totalToday} checked in today
          </p>
          <span
            className="text-xs text-muted-foreground tabular-nums"
            data-testid="text-checklist-pct"
          >
            {progressPct}%
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="h-1.5 rounded-full bg-muted overflow-hidden"
          data-testid="bar-checklist-progress"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            {
              label: "Scheduled",
              value: totalToday,
              icon: CalendarDays,
              testId: "stat-checklist-scheduled",
            },
            {
              label: "Completed",
              value: completed,
              icon: CheckSquare,
              testId: "stat-checklist-completed",
            },
            {
              label: "Needs Intake",
              value: needsIntake.length,
              icon: needsIntake.length > 0 ? AlertCircle : Square,
              testId: "stat-checklist-intake",
              highlight: needsIntake.length > 0,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              data-testid={stat.testId}
              className={`
                flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-center
                ${
                  stat.highlight
                    ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/30"
                    : "bg-muted/40"
                }
              `}
            >
              <stat.icon
                className={`w-3.5 h-3.5 ${stat.highlight ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
              />
              <span
                className={`text-base font-bold tabular-nums leading-none ${stat.highlight ? "text-amber-700 dark:text-amber-300" : "text-foreground"}`}
              >
                {stat.value}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Needs intake/waiver list */}
        {needsIntake.length > 0 && (
          <div className="pt-1 space-y-1" data-testid="list-needs-intake">
            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">
              Incomplete paperwork
            </p>
            {needsIntake.map((appt) => {
              const c = clientMap.get(appt.clientId);
              return (
                <div
                  key={appt.id}
                  data-testid={`row-intake-${appt.id}`}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="font-medium text-foreground">{appt.clientName}</span>
                  <span className="text-[10px]">
                    {!c?.intakeCompleted && "intake"}
                    {!c?.intakeCompleted && !c?.waiverSigned && " · "}
                    {!c?.waiverSigned && "waiver"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  useHashLocation(); // imported for hash-based navigation in quick actions

  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard"],
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-xl font-bold tracking-tight"
          style={CG}
          data-testid="heading-dashboard"
        >
          Dashboard
        </h1>
        <p
          className="text-xs text-muted-foreground mt-0.5"
          data-testid="text-dashboard-date"
        >
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Today",
            value: data?.todayAppointments ?? 0,
            sub: "appointments",
            icon: CalendarDays,
          },
          { label: "Clients", value: data?.totalClients ?? 0, sub: "total", icon: Users },
          {
            label: "Revenue",
            value: `$${data?.monthRevenue?.toFixed(0) ?? 0}`,
            sub: "this month",
            icon: DollarSign,
          },
          { label: "Active", value: data?.activePackages ?? 0, sub: "packages", icon: Package },
        ].map((kpi, i) => (
          <Card
            key={i}
            data-testid={`card-kpi-${i}`}
            className="relative overflow-hidden"
          >
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                    {kpi.label}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-12 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold tabular-nums mt-0.5">{kpi.value}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-primary/8">
                  <kpi.icon className="w-4.5 h-4.5 text-primary/60" />
                </div>
              </div>
            </CardContent>
            {/* Subtle gradient orb */}
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/[0.04] blur-2xl" />
          </Card>
        ))}
      </div>

      {/* Quick Actions Row */}
      <div data-testid="section-quick-actions">
        <p
          className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2"
          style={CG}
          data-testid="heading-quick-actions"
        >
          Quick Actions
        </p>
        <div className="grid grid-cols-4 gap-3">
          <GlassActionButton
            icon={CalendarPlus}
            label="New Appointment"
            testId="button-new-appointment"
            onClick={() => {
              window.location.hash = "#/calendar";
            }}
          />
          <GlassActionButton
            icon={UserPlus}
            label="New Client"
            testId="button-new-client"
            onClick={() => {
              window.location.hash = "#/clients";
            }}
          />
          <GlassActionButton
            icon={MessageSquare}
            label="Messages"
            testId="button-messages"
            onClick={() => {
              window.location.hash = "#/messages";
            }}
          />

          {/* Export Data — dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="button-export-data"
                className="
                  flex flex-col items-center justify-center gap-2 p-4 rounded-xl w-full
                  border border-white/50 dark:border-white/10
                  bg-white/60 dark:bg-white/5
                  backdrop-blur-md
                  text-foreground hover:bg-white/80 dark:hover:bg-white/10
                  transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
                  group
                "
              >
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/18 transition-colors">
                  <Download className="w-4 h-4 text-primary" />
                </div>
                <span
                  className="text-xs font-medium leading-tight text-center"
                  style={CG}
                >
                  Export Data
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              <DropdownMenuItem
                data-testid="menu-export-clients"
                onClick={() => window.open("/api/export/clients")}
                className="cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                Export Clients
              </DropdownMenuItem>
              <DropdownMenuItem
                data-testid="menu-export-appointments"
                onClick={() => window.open("/api/export/appointments")}
                className="cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                Export Appointments
              </DropdownMenuItem>
              <DropdownMenuItem
                data-testid="menu-export-revenue"
                onClick={() => window.open("/api/export/revenue")}
                className="cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                Export Revenue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Birthday Alerts */}
      <BirthdayAlerts />

      {/* Recent Appointments */}
      <Card>
        <CardHeader className="pb-2 px-5 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              style={CG}
              data-testid="heading-recent-appointments"
            >
              Recent Appointments
            </CardTitle>
            <Link
              href="/calendar"
              className="text-xs text-primary flex items-center gap-1 hover:underline"
              data-testid="link-view-all-appointments"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {data?.recentAppointments?.length === 0 && (
                <p
                  className="p-6 text-sm text-center text-muted-foreground"
                  data-testid="text-no-appointments"
                >
                  No appointments yet
                </p>
              )}
              {data?.recentAppointments?.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between gap-2 px-5 py-3 hover:bg-muted/30 transition-colors"
                  data-testid={`row-appointment-${appt.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-md bg-muted/60 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        <Link
                          href={`/clients/${appt.clientId}`}
                          className="hover:underline"
                          data-testid={`link-client-${appt.clientId}`}
                        >
                          {appt.clientName}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {appt.serviceName}&nbsp;&middot;&nbsp;
                        {formatDateTime(appt.date, appt.time)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] font-medium px-2 py-0.5 ${statusColors[appt.status] || ""}`}
                    data-testid={`badge-status-${appt.id}`}
                  >
                    {appt.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Checklist */}
      <TodayChecklist
        appointments={data?.recentAppointments}
        isLoading={isLoading}
      />
    </div>
  );
}
