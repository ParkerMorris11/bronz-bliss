import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import {
  services, insertServiceSchema, type InsertService, type Service,
  clients, insertClientSchema, type InsertClient, type Client,
  appointments, insertAppointmentSchema, type InsertAppointment, type Appointment,
  sessionRecords, insertSessionRecordSchema, type InsertSessionRecord, type SessionRecord,
  packagePlans, insertPackagePlanSchema, type InsertPackagePlan, type PackagePlan,
  clientPackages, insertClientPackageSchema, type InsertClientPackage, type ClientPackage,
  payments, insertPaymentSchema, type InsertPayment, type Payment,
} from "@shared/schema";

const sqlite = new Database("glowcrm.db");
sqlite.pragma("journal_mode = WAL");
export const db = drizzle(sqlite);

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    skin_type TEXT,
    allergies TEXT,
    notes TEXT,
    preferred_formula TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    deposit_paid INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS session_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    formula TEXT,
    shade TEXT,
    rinse_time INTEGER,
    aftercare_notes TEXT,
    session_notes TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS package_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sessions INTEGER NOT NULL,
    price REAL NOT NULL,
    valid_days INTEGER NOT NULL DEFAULT 90,
    is_active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS client_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    package_plan_id INTEGER NOT NULL,
    sessions_remaining INTEGER NOT NULL,
    purchase_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
  );
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    appointment_id INTEGER,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'card',
    created_at TEXT NOT NULL
  );
`);

export interface IStorage {
  // Services
  getServices(): Service[];
  getService(id: number): Service | undefined;
  createService(data: InsertService): Service;
  updateService(id: number, data: Partial<InsertService>): Service | undefined;
  
  // Clients
  getClients(): Client[];
  getClient(id: number): Client | undefined;
  createClient(data: InsertClient): Client;
  updateClient(id: number, data: Partial<InsertClient>): Client | undefined;
  searchClients(query: string): Client[];
  
  // Appointments
  getAppointments(): Appointment[];
  getAppointmentsByDate(date: string): Appointment[];
  getAppointmentsByClient(clientId: number): Appointment[];
  getAppointment(id: number): Appointment | undefined;
  createAppointment(data: InsertAppointment): Appointment;
  updateAppointment(id: number, data: Partial<InsertAppointment>): Appointment | undefined;
  
  // Session Records
  getSessionRecordsByClient(clientId: number): SessionRecord[];
  getSessionRecord(appointmentId: number): SessionRecord | undefined;
  createSessionRecord(data: InsertSessionRecord): SessionRecord;
  
  // Package Plans
  getPackagePlans(): PackagePlan[];
  createPackagePlan(data: InsertPackagePlan): PackagePlan;
  updatePackagePlan(id: number, data: Partial<InsertPackagePlan>): PackagePlan | undefined;
  
  // Client Packages
  getClientPackages(clientId: number): ClientPackage[];
  getAllClientPackages(): ClientPackage[];
  createClientPackage(data: InsertClientPackage): ClientPackage;
  updateClientPackage(id: number, data: Partial<InsertClientPackage>): ClientPackage | undefined;
  
  // Payments
  getPayments(): Payment[];
  getPaymentsByClient(clientId: number): Payment[];
  createPayment(data: InsertPayment): Payment;
  
  // Dashboard stats
  getDashboardStats(): {
    todayAppointments: number;
    totalClients: number;
    monthRevenue: number;
    activePackages: number;
    recentAppointments: (Appointment & { clientName: string; serviceName: string })[];
  };
}

export class DatabaseStorage implements IStorage {
  // Services
  getServices(): Service[] {
    return db.select().from(services).all();
  }
  getService(id: number): Service | undefined {
    return db.select().from(services).where(eq(services.id, id)).get();
  }
  createService(data: InsertService): Service {
    return db.insert(services).values(data).returning().get();
  }
  updateService(id: number, data: Partial<InsertService>): Service | undefined {
    return db.update(services).set(data).where(eq(services.id, id)).returning().get();
  }

  // Clients
  getClients(): Client[] {
    return db.select().from(clients).orderBy(desc(clients.createdAt)).all();
  }
  getClient(id: number): Client | undefined {
    return db.select().from(clients).where(eq(clients.id, id)).get();
  }
  createClient(data: InsertClient): Client {
    return db.insert(clients).values(data).returning().get();
  }
  updateClient(id: number, data: Partial<InsertClient>): Client | undefined {
    return db.update(clients).set(data).where(eq(clients.id, id)).returning().get();
  }
  searchClients(query: string): Client[] {
    const q = `%${query.toLowerCase()}%`;
    return db.select().from(clients)
      .where(sql`lower(${clients.firstName} || ' ' || ${clients.lastName}) LIKE ${q}`)
      .all();
  }

  // Appointments
  getAppointments(): Appointment[] {
    return db.select().from(appointments).orderBy(desc(appointments.date)).all();
  }
  getAppointmentsByDate(date: string): Appointment[] {
    return db.select().from(appointments).where(eq(appointments.date, date)).all();
  }
  getAppointmentsByClient(clientId: number): Appointment[] {
    return db.select().from(appointments)
      .where(eq(appointments.clientId, clientId))
      .orderBy(desc(appointments.date))
      .all();
  }
  getAppointment(id: number): Appointment | undefined {
    return db.select().from(appointments).where(eq(appointments.id, id)).get();
  }
  createAppointment(data: InsertAppointment): Appointment {
    return db.insert(appointments).values(data).returning().get();
  }
  updateAppointment(id: number, data: Partial<InsertAppointment>): Appointment | undefined {
    return db.update(appointments).set(data).where(eq(appointments.id, id)).returning().get();
  }

  // Session Records
  getSessionRecordsByClient(clientId: number): SessionRecord[] {
    return db.select().from(sessionRecords)
      .where(eq(sessionRecords.clientId, clientId))
      .orderBy(desc(sessionRecords.createdAt))
      .all();
  }
  getSessionRecord(appointmentId: number): SessionRecord | undefined {
    return db.select().from(sessionRecords)
      .where(eq(sessionRecords.appointmentId, appointmentId))
      .get();
  }
  createSessionRecord(data: InsertSessionRecord): SessionRecord {
    return db.insert(sessionRecords).values(data).returning().get();
  }

  // Package Plans
  getPackagePlans(): PackagePlan[] {
    return db.select().from(packagePlans).all();
  }
  createPackagePlan(data: InsertPackagePlan): PackagePlan {
    return db.insert(packagePlans).values(data).returning().get();
  }
  updatePackagePlan(id: number, data: Partial<InsertPackagePlan>): PackagePlan | undefined {
    return db.update(packagePlans).set(data).where(eq(packagePlans.id, id)).returning().get();
  }

  // Client Packages
  getClientPackages(clientId: number): ClientPackage[] {
    return db.select().from(clientPackages)
      .where(eq(clientPackages.clientId, clientId))
      .all();
  }
  getAllClientPackages(): ClientPackage[] {
    return db.select().from(clientPackages).all();
  }
  createClientPackage(data: InsertClientPackage): ClientPackage {
    return db.insert(clientPackages).values(data).returning().get();
  }
  updateClientPackage(id: number, data: Partial<InsertClientPackage>): ClientPackage | undefined {
    return db.update(clientPackages).set(data).where(eq(clientPackages.id, id)).returning().get();
  }

  // Payments
  getPayments(): Payment[] {
    return db.select().from(payments).orderBy(desc(payments.createdAt)).all();
  }
  getPaymentsByClient(clientId: number): Payment[] {
    return db.select().from(payments)
      .where(eq(payments.clientId, clientId))
      .orderBy(desc(payments.createdAt))
      .all();
  }
  createPayment(data: InsertPayment): Payment {
    return db.insert(payments).values(data).returning().get();
  }

  // Dashboard
  getDashboardStats() {
    const today = new Date().toISOString().split("T")[0];
    const monthStart = today.substring(0, 7) + "-01";

    const todayAppts = db.select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(eq(appointments.date, today))
      .get();

    const totalCl = db.select({ count: sql<number>`count(*)` })
      .from(clients)
      .get();

    const monthRev = db.select({ total: sql<number>`COALESCE(sum(amount), 0)` })
      .from(payments)
      .where(gte(payments.createdAt, monthStart))
      .get();

    const activePkgs = db.select({ count: sql<number>`count(*)` })
      .from(clientPackages)
      .where(eq(clientPackages.status, "active"))
      .get();

    // Recent appointments with joins done manually (SQLite + Drizzle)
    const recentAppts = db.select().from(appointments)
      .orderBy(desc(appointments.date))
      .limit(5)
      .all();

    const enriched = recentAppts.map(a => {
      const cl = db.select().from(clients).where(eq(clients.id, a.clientId)).get();
      const svc = db.select().from(services).where(eq(services.id, a.serviceId)).get();
      return {
        ...a,
        clientName: cl ? `${cl.firstName} ${cl.lastName}` : "Unknown",
        serviceName: svc ? svc.name : "Unknown",
      };
    });

    return {
      todayAppointments: todayAppts?.count ?? 0,
      totalClients: totalCl?.count ?? 0,
      monthRevenue: monthRev?.total ?? 0,
      activePackages: activePkgs?.count ?? 0,
      recentAppointments: enriched,
    };
  }
}

export const storage = new DatabaseStorage();
