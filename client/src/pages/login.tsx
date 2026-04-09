import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { Lock } from "lucide-react";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", { password });
      const data = await res.json();
      if (data.success) {
        onLogin();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-primary/[0.04] blur-3xl" />
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Bronz Bliss
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage your studio</p>
        </div>

        <div className="rounded-2xl border bg-card/75 backdrop-blur-xl border-white/30 dark:border-white/[0.06] shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="Enter your password"
                  className="pl-9"
                  autoFocus
                  data-testid="input-password"
                />
              </div>
              {error && (
                <p className="text-xs text-destructive">Wrong password. Try again.</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading || !password} data-testid="button-login">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        <p className="text-[10px] text-muted-foreground/50 text-center mt-6">
          Cedar City, UT
        </p>
      </div>
    </div>
  );
}
