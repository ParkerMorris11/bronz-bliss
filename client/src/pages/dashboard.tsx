import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, DollarSign, Package, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

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

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  checked_in: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  no_show: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400",
};

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard"],
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-today-appointments">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Today</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-10 mt-1" />
                ) : (
                  <p className="text-2xl font-bold tabular-nums">{data?.todayAppointments ?? 0}</p>
                )}
                <p className="text-xs text-muted-foreground">appointments</p>
              </div>
              <div className="p-2 rounded-md bg-primary/10">
                <CalendarDays className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-clients">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Clients</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-10 mt-1" />
                ) : (
                  <p className="text-2xl font-bold tabular-nums">{data?.totalClients ?? 0}</p>
                )}
                <p className="text-xs text-muted-foreground">total</p>
              </div>
              <div className="p-2 rounded-md bg-primary/10">
                <Users className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-month-revenue">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Revenue</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold tabular-nums">${data?.monthRevenue?.toFixed(0) ?? 0}</p>
                )}
                <p className="text-xs text-muted-foreground">this month</p>
              </div>
              <div className="p-2 rounded-md bg-primary/10">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-packages">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-10 mt-1" />
                ) : (
                  <p className="text-2xl font-bold tabular-nums">{data?.activePackages ?? 0}</p>
                )}
                <p className="text-xs text-muted-foreground">packages</p>
              </div>
              <div className="p-2 rounded-md bg-primary/10">
                <Package className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Appointments */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-1">
            <CardTitle className="text-sm font-semibold">Recent Appointments</CardTitle>
            <Link href="/calendar" className="text-xs text-primary flex items-center gap-1">
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
                <p className="p-4 text-sm text-muted-foreground">No appointments yet</p>
              )}
              {data?.recentAppointments?.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between gap-2 px-4 py-3"
                  data-testid={`row-appointment-${appt.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-md bg-muted shrink-0">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        <Link href={`/clients/${appt.clientId}`} className="hover:underline">
                          {appt.clientName}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {appt.serviceName} &middot; {appt.date} at {appt.time}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 text-xs ${statusColors[appt.status] || ""}`}
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
    </div>
  );
}
