import { useLocation, Link } from "wouter";

const navItems = [
  {
    section: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: <GridIcon />, badge: null },
      { href: "/appointments", label: "Appointments", icon: <CalendarIcon />, badge: null },
      { href: "/clients", label: "Clients", icon: <UsersIcon />, badge: null },
    ],
  },
  {
    section: "Business",
    items: [
      { href: "/packages", label: "Packages", icon: <PackageIcon />, badge: null },
      { href: "/messages", label: "Messages", icon: <MessageIcon />, badge: "3" },
    ],
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="sidebar flex flex-col" style={{ minHeight: "100dvh", padding: "24px 16px" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div style={{
          width: 40, height: 40, borderRadius: 14,
          background: "linear-gradient(135deg, rgba(231,181,111,0.9), rgba(231,181,111,0.3))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28), 0 8px 20px rgba(231,181,111,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="Bronz Bliss">
            <circle cx="12" cy="9" r="4" fill="hsl(30,8%,8%)" opacity="0.9"/>
            <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="hsl(30,8%,8%)" strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
            <path d="M12 2 L12 4 M18 5 L16.5 6.5 M20 11 L18 11 M18 17 L16.5 15.5 M12 20 L12 22 M5.5 15.5 L4 17 M4 11 L6 11 M5.5 6.5 L7 5"
              stroke="rgba(231,181,111,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.01em" }}>
            Bronz Bliss
          </div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
            Studio Manager
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {navItems.map(section => (
          <div key={section.section} style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)",
              padding: "0 10px", marginBottom: 8,
            }}>
              {section.section}
            </div>
            {section.items.map(item => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    data-testid={`nav-${item.label.toLowerCase()}`}
                    style={{
                      width: "100%", display: "flex", alignItems: "center",
                      justifyContent: "space-between", gap: 10,
                      padding: "10px 12px", marginBottom: 4,
                      borderRadius: 12, border: "1px solid transparent",
                      background: isActive ? "rgba(231,181,111,0.1)" : "transparent",
                      borderColor: isActive ? "rgba(231,181,111,0.2)" : "transparent",
                      color: isActive ? "rgba(231,181,111,0.95)" : "rgba(255,255,255,0.65)",
                      cursor: "pointer", fontSize: "0.875rem", fontWeight: 500,
                      transition: "all 0.18s ease",
                    }}
                    onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)"; } }}
                    onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)"; } }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span style={{
                        fontSize: "0.7rem", fontWeight: 700, padding: "2px 7px",
                        borderRadius: 999, background: "rgba(231,181,111,0.18)",
                        color: "rgba(231,181,111,0.9)",
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: "14px 12px", borderRadius: 14,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.65)", marginBottom: 2, fontWeight: 500 }}>
          Izzy Morris
        </div>
        <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>
          Cedar City, UT
        </div>
      </div>
    </aside>
  );
}

function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>;
}
function CalendarIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
}
function UsersIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function PackageIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-8 4.5v9L12 21l8-4.5v-9L12 3z"/><path d="m12 12 8-4.5M12 12v9M12 12 4 7.5"/></svg>;
}
function MessageIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
