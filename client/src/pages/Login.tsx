import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(password);
    setLoading(false);
    if (!result.ok) setError(result.error ?? "Incorrect password");
  }

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(circle at 20% 20%, rgba(231,181,111,0.08), transparent 40%), hsl(30 8% 7%)",
      padding: "20px",
    }}>
      <div style={{
        width: "100%", maxWidth: 380,
        background: "rgba(255,255,255,0.045)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24, padding: "36px 32px",
        backdropFilter: "blur(24px)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18, marginBottom: 14,
            background: "linear-gradient(135deg, rgba(231,181,111,0.9), rgba(231,181,111,0.3))",
            boxShadow: "0 12px 28px rgba(231,181,111,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-label="Bronz Bliss">
              <circle cx="12" cy="9" r="4" fill="hsl(30,8%,8%)" opacity="0.9"/>
              <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="hsl(30,8%,8%)" strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
              <path d="M12 2L12 4M18 5L16.5 6.5M20 11L18 11M18 17L16.5 15.5M12 20L12 22M5.5 15.5L4 17M4 11L6 11M5.5 6.5L7 5"
                stroke="rgba(231,181,111,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.02em" }}>
            Bronz Bliss
          </div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
            Studio Manager
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block", fontSize: "0.78rem", fontWeight: 600,
              color: "rgba(255,255,255,0.5)", marginBottom: 8, letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>
              Password
            </label>
            <input
              data-testid="input-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoFocus
              style={{
                width: "100%", padding: "14px 16px",
                background: "rgba(255,255,255,0.06)",
                border: error ? "1px solid rgba(255,127,141,0.5)" : "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14, color: "rgba(255,255,255,0.92)",
                fontSize: "0.95rem", outline: "none",
                transition: "border-color 0.18s ease",
              }}
              onFocus={e => { if (!error) e.target.style.borderColor = "rgba(231,181,111,0.5)"; }}
              onBlur={e => { if (!error) e.target.style.borderColor = "rgba(255,255,255,0.12)"; }}
            />
          </div>

          {error && (
            <div style={{
              fontSize: "0.8rem", color: "var(--danger, #ff7f8d)",
              marginBottom: 14, textAlign: "center",
            }}>
              {error}
            </div>
          )}

          <button
            data-testid="button-login"
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%", padding: "14px",
              background: loading || !password
                ? "rgba(231,181,111,0.25)"
                : "linear-gradient(180deg, rgba(231,181,111,0.9), rgba(231,181,111,0.65))",
              border: "none", borderRadius: 14,
              color: loading || !password ? "rgba(255,255,255,0.4)" : "hsl(30,8%,10%)",
              fontWeight: 700, fontSize: "0.95rem",
              cursor: loading || !password ? "not-allowed" : "pointer",
              transition: "all 0.18s ease",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={{
          marginTop: 24, paddingTop: 20,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          textAlign: "center", fontSize: "0.72rem",
          color: "rgba(255,255,255,0.25)",
        }}>
          Bronz Bliss · Cedar City, UT
        </div>
      </div>
    </div>
  );
}
