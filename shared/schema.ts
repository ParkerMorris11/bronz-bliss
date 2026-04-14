import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Clients ────────────────────────────────────────────────────────────────
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  skinTone: text("skin_tone"),           // "fair" | "medium" | "olive" | "dark"
  tanHistory: text("tan_history"),       // JSON string
  waiverSigned: integer("waiver_signed", { mode: "boolean" }).default(false),
  intakeComplete: integer("intake_complete", { mode: "boolean" }).default(false),
  firstVisitDate: text("first_visit_date"),
  lastVisitDate: text("last_visit_date"),
  totalVisits: integer("total_visits").default(0),
  status: text("status").default("active"), // "active" | "at_risk" | "dormant"
  tags: text("tags"),                    // JSON string of string[]
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// ── Services ───────────────────────────────────────────────────────────────
export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),          // "spray" | "bronzing" | "express" | "luxury" | "custom"
  durationMinutes: integer("duration_minutes").notNull(),
  price: real("price").notNull(),
  description: text("description"),
  active: integer("active", { mode: "boolean" }).default(true),
});

export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// ── Appointments ───────────────────────────────────────────────────────────
export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull().references(() => clients.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  date: text("date").notNull(),          // ISO date YYYY-MM-DD
  time: text("time").notNull(),          // HH:MM
  status: text("status").default("scheduled"), // "scheduled" | "checked_in" | "completed" | "no_show" | "cancelled"
  notes: text("notes"),
  revenue: real("revenue"),
  prepReminderSent: integer("prep_reminder_sent", { mode: "boolean" }).default(false),
  rinseReminderSent: integer("rinse_reminder_sent", { mode: "boolean" }).default(false),
  reviewRequestSent: integer("review_request_sent", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// ── Packages / Memberships ─────────────────────────────────────────────────
export const packages = sqliteTable("packages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),           // e.g. "5-Session Bundle", "Monthly Unlimited"
  type: text("type").notNull(),           // "bundle" | "membership"
  totalSessions: integer("total_sessions"),
  usedSessions: integer("used_sessions").default(0),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  price: real("price").notNull(),
  active: integer("active", { mode: "boolean" }).default(true),
});

export const insertPackageSchema = createInsertSchema(packages).omit({ id: true });
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packages.$inferSelect;
