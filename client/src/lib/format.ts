/** Format ISO date string to a friendly display */
export function formatDate(dateStr: string): string {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  if (dateStr === tomorrow) return "Tomorrow";

  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Format time string "HH:MM" to "9:00 AM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
}

/** Format date + time together: "Today, 9:00 AM" or "Apr 8, 2:00 PM" */
export function formatDateTime(dateStr: string, time: string): string {
  return `${formatDate(dateStr)}, ${formatTime(time)}`;
}

/** Format currency */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(0)}`;
}
