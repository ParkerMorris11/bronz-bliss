import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Appointments from "@/pages/Appointments";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function AppShell() {
  const { authenticated } = useAuth();

  // Loading state
  if (authenticated === null) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "hsl(30 8% 7%)",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 14,
          background: "linear-gradient(135deg, rgba(231,181,111,0.9), rgba(231,181,111,0.3))",
          animation: "pulse 1.5s ease-in-out infinite",
        }} />
        <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }`}</style>
      </div>
    );
  }

  // Not logged in
  if (!authenticated) return <Login />;

  // Authenticated app
  return (
    <Router hook={useHashLocation}>
      <div className="dashboard-layout dark">
        <Sidebar />
        <main className="main-area" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/clients" component={Clients} />
            <Route path="/appointments" component={Appointments} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <BottomNav />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
