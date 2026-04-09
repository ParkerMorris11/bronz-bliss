import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { Search, User, Calendar } from "lucide-react";
import { formatTime } from "@/lib/format";

type Client = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  skinType: string | null;
};

type Appointment = {
  id: number;
  clientId: number;
  serviceId: number;
  date: string;
  time: string;
  status: string;
};

type SearchResults = {
  clients: Client[];
  appointments: Appointment[];
};

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced fetch
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await apiRequest("GET", `/api/search?q=${encodeURIComponent(trimmed)}`);
        const data: SearchResults = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch {
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasResults =
    results && (results.clients.length > 0 || results.appointments.length > 0);

  function handleClientClick(id: number) {
    window.location.hash = "#/clients/" + id;
    setIsOpen(false);
    setQuery("");
  }

  function handleAppointmentClick() {
    window.location.hash = "#/calendar";
    setIsOpen(false);
    setQuery("");
  }

  function formatStatusBadge(status: string) {
    const map: Record<string, string> = {
      scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      "no-show": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    };
    return map[status] ?? "bg-muted text-muted-foreground";
  }

  return (
    <div ref={containerRef} className="relative" data-testid="global-search-container">
      {/* Input */}
      <div className="relative flex items-center">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results && query.trim()) setIsOpen(true);
          }}
          placeholder="Search clients..."
          className="pl-8 pr-3 h-8 w-48 text-sm glass-input border-border/60 focus:w-64 transition-all duration-200 rounded-lg placeholder:text-muted-foreground/60"
          data-testid="input-global-search"
          aria-label="Search clients and appointments"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
        />
        {isLoading && (
          <div
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && query.trim() && (
        <div
          role="listbox"
          aria-label="Search results"
          className="absolute top-full left-0 mt-1.5 w-80 z-50 overflow-hidden rounded-xl border border-border/60 shadow-lg"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur))",
            WebkitBackdropFilter: "blur(var(--glass-blur))",
          }}
          data-testid="search-results-dropdown"
        >
          {!hasResults ? (
            /* No results */
            <div
              className="flex flex-col items-center gap-1.5 py-8 px-4 text-center"
              data-testid="search-no-results"
            >
              <Search className="w-8 h-8 text-muted-foreground/30" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground/70">No results found</p>
              <p className="text-xs text-muted-foreground">
                Try a different name or keyword
              </p>
            </div>
          ) : (
            <div className="py-1.5 max-h-80 overflow-y-auto">
              {/* Clients section */}
              {results.clients.length > 0 && (
                <section aria-label="Clients">
                  <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
                    <User className="w-3 h-3 text-primary/70" aria-hidden="true" />
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70">
                      Clients
                    </span>
                  </div>
                  {results.clients.map((client) => (
                    <button
                      key={client.id}
                      role="option"
                      aria-selected="false"
                      onClick={() => handleClientClick(client.id)}
                      className="w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-primary/5 active:bg-primary/10 focus-visible:bg-primary/5 focus-visible:outline-none group"
                      data-testid={`search-client-${client.id}`}
                    >
                      {/* Avatar */}
                      <div
                        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-primary bg-primary/10"
                        aria-hidden="true"
                      >
                        {client.firstName[0]}
                        {client.lastName[0]}
                      </div>
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                          {client.firstName} {client.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {client.phone && (
                            <span className="text-xs text-muted-foreground truncate">
                              {client.phone}
                            </span>
                          )}
                          {client.skinType && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0 font-medium">
                              {client.skinType}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {/* Divider between sections */}
              {results.clients.length > 0 && results.appointments.length > 0 && (
                <div className="mx-3 my-1 h-px bg-border/50" aria-hidden="true" />
              )}

              {/* Appointments section */}
              {results.appointments.length > 0 && (
                <section aria-label="Appointments">
                  <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
                    <Calendar className="w-3 h-3 text-primary/70" aria-hidden="true" />
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70">
                      Appointments
                    </span>
                  </div>
                  {results.appointments.map((appt) => (
                    <button
                      key={appt.id}
                      role="option"
                      aria-selected="false"
                      onClick={handleAppointmentClick}
                      className="w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-primary/5 active:bg-primary/10 focus-visible:bg-primary/5 focus-visible:outline-none group"
                      data-testid={`search-appointment-${appt.id}`}
                    >
                      {/* Icon */}
                      <div
                        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-muted"
                        aria-hidden="true"
                      >
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                          Client #{appt.clientId}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {appt.date} · {formatTime(appt.time)}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${formatStatusBadge(appt.status)}`}
                          >
                            {appt.status}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </section>
              )}
            </div>
          )}

          {/* Footer hint */}
          <div className="px-3 py-1.5 border-t border-border/40 flex items-center gap-1">
            <kbd className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground font-mono leading-none">
              esc
            </kbd>
            <span className="text-[10px] text-muted-foreground/60">to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
