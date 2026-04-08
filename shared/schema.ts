import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Services ──────────────────────────────────────────────
export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // minutes
  price: real("price").notNull(),
  category: text("category").notNull(), // spray_tan, booth_tan, bed_tan, other
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// ── Clients ───────────────────────────────────────────────
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  skinType: text("skin_type"), // type I-VI
  allergies: text("allergies"),
  notes: text("notes"),
  preferredFormula: text("preferred_formula"),
  createdAt: text("created_at").notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// ── Appointments ──────────────────────────────────────────
export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  serviceId: integer("service_id").notNull(),
  date: text("date").notNull(), // ISO date YYYY-MM-DD
  time: text("time").notNull(), // HH:mm
  status: text("status").notNull().default("scheduled"), // scheduled, checked_in, completed, cancelled, no_show
  depositPaid: integer("deposit_paid", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// ── Session Records (tanning-specific) ────────────────────
export const sessionRecords = sqliteTable("session_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  appointmentId: integer("appointment_id").notNull(),
  clientId: integer("client_id").notNull(),
  formula: text("formula"), // solution/formula used
  shade: text("shade"), // light, medium, dark, extra dark
  rinseTime: integer("rinse_time"), // minutes until rinse
  aftercareNotes: text("aftercare_notes"),
  sessionNotes: text("session_notes"),
  createdAt: text("created_at").notNull(),
});

export const insertSessionRecordSchema = createInsertSchema(sessionRecords).omit({ id: true });
export type InsertSessionRecord = z.infer<typeof insertSessionRecordSchema>;
export type SessionRecord = typeof sessionRecords.$inferSelect;

// ── Packages ──────────────────────────────────────────────
export const packagePlans = sqliteTable("package_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sessions: integer("sessions").notNull(), // total sessions included
  price: real("price").notNull(),
  validDays: integer("valid_days").notNull().default(90), // days until expiry
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const insertPackagePlanSchema = createInsertSchema(packagePlans).omit({ id: true });
export type InsertPackagePlan = z.infer<typeof insertPackagePlanSchema>;
export type PackagePlan = typeof packagePlans.$inferSelect;

// ── Client Packages (purchased) ───────────────────────────
export const clientPackages = sqliteTable("client_packages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  packagePlanId: integer("package_plan_id").notNull(),
  sessionsRemaining: integer("sessions_remaining").notNull(),
  purchaseDate: text("purchase_date").notNull(),
  expiryDate: text("expiry_date").notNull(),
  status: text("status").notNull().default("active"), // active, expired, used_up
});

export const insertClientPackageSchema = createInsertSchema(clientPackages).omit({ id: true });
export type InsertClientPackage = z.infer<typeof insertClientPackageSchema>;
export type ClientPackage = typeof clientPackages.$inferSelect;

// ── Payments ──────────────────────────────────────────────
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  appointmentId: integer("appointment_id"),
  amount: real("amount").notNull(),
  type: text("type").notNull(), // service, package, deposit, tip
  method: text("method").notNull().default("card"), // card, cash, venmo, other
  createdAt: text("created_at").notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
