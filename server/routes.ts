import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(server: Server, app: Express) {
  // ── Dashboard ─────────────────────────────────────────
  app.get("/api/dashboard", (_req, res) => {
    const stats = storage.getDashboardStats();
    res.json(stats);
  });

  // ── Services ──────────────────────────────────────────
  app.get("/api/services", (_req, res) => {
    res.json(storage.getServices());
  });
  app.get("/api/services/:id", (req, res) => {
    const svc = storage.getService(Number(req.params.id));
    if (!svc) return res.status(404).json({ error: "Service not found" });
    res.json(svc);
  });
  app.post("/api/services", (req, res) => {
    const svc = storage.createService(req.body);
    res.status(201).json(svc);
  });
  app.patch("/api/services/:id", (req, res) => {
    const svc = storage.updateService(Number(req.params.id), req.body);
    if (!svc) return res.status(404).json({ error: "Service not found" });
    res.json(svc);
  });

  // ── Clients ───────────────────────────────────────────
  app.get("/api/clients", (req, res) => {
    const q = req.query.q as string | undefined;
    if (q) {
      res.json(storage.searchClients(q));
    } else {
      res.json(storage.getClients());
    }
  });
  app.get("/api/clients/:id", (req, res) => {
    const client = storage.getClient(Number(req.params.id));
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  });
  app.post("/api/clients", (req, res) => {
    const client = storage.createClient(req.body);
    res.status(201).json(client);
  });
  app.patch("/api/clients/:id", (req, res) => {
    const client = storage.updateClient(Number(req.params.id), req.body);
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  });

  // ── Appointments ──────────────────────────────────────
  app.get("/api/appointments", (req, res) => {
    const date = req.query.date as string | undefined;
    const clientId = req.query.clientId as string | undefined;
    if (date) {
      res.json(storage.getAppointmentsByDate(date));
    } else if (clientId) {
      res.json(storage.getAppointmentsByClient(Number(clientId)));
    } else {
      res.json(storage.getAppointments());
    }
  });
  app.get("/api/appointments/:id", (req, res) => {
    const appt = storage.getAppointment(Number(req.params.id));
    if (!appt) return res.status(404).json({ error: "Appointment not found" });
    res.json(appt);
  });
  app.post("/api/appointments", (req, res) => {
    const appt = storage.createAppointment(req.body);
    res.status(201).json(appt);
  });
  app.patch("/api/appointments/:id", (req, res) => {
    const appt = storage.updateAppointment(Number(req.params.id), req.body);
    if (!appt) return res.status(404).json({ error: "Appointment not found" });
    res.json(appt);
  });

  // ── Session Records ───────────────────────────────────
  app.get("/api/sessions/client/:clientId", (req, res) => {
    res.json(storage.getSessionRecordsByClient(Number(req.params.clientId)));
  });
  app.get("/api/sessions/appointment/:appointmentId", (req, res) => {
    const rec = storage.getSessionRecord(Number(req.params.appointmentId));
    res.json(rec || null);
  });
  app.post("/api/sessions", (req, res) => {
    const rec = storage.createSessionRecord(req.body);
    res.status(201).json(rec);
  });

  // ── Package Plans ─────────────────────────────────────
  app.get("/api/package-plans", (_req, res) => {
    res.json(storage.getPackagePlans());
  });
  app.post("/api/package-plans", (req, res) => {
    const plan = storage.createPackagePlan(req.body);
    res.status(201).json(plan);
  });
  app.patch("/api/package-plans/:id", (req, res) => {
    const plan = storage.updatePackagePlan(Number(req.params.id), req.body);
    if (!plan) return res.status(404).json({ error: "Package plan not found" });
    res.json(plan);
  });

  // ── Client Packages ───────────────────────────────────
  app.get("/api/client-packages", (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    if (clientId) {
      res.json(storage.getClientPackages(Number(clientId)));
    } else {
      res.json(storage.getAllClientPackages());
    }
  });
  app.post("/api/client-packages", (req, res) => {
    const pkg = storage.createClientPackage(req.body);
    res.status(201).json(pkg);
  });
  app.patch("/api/client-packages/:id", (req, res) => {
    const pkg = storage.updateClientPackage(Number(req.params.id), req.body);
    if (!pkg) return res.status(404).json({ error: "Client package not found" });
    res.json(pkg);
  });

  // ── Payments ──────────────────────────────────────────
  app.get("/api/payments", (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    if (clientId) {
      res.json(storage.getPaymentsByClient(Number(clientId)));
    } else {
      res.json(storage.getPayments());
    }
  });
  app.post("/api/payments", (req, res) => {
    const payment = storage.createPayment(req.body);
    res.status(201).json(payment);
  });

  // ── Seed demo data ────────────────────────────────────
  app.post("/api/seed", (_req, res) => {
    const existingServices = storage.getServices();
    if (existingServices.length > 0) {
      return res.json({ message: "Already seeded" });
    }

    // Services
    const s1 = storage.createService({ name: "Full Body Spray Tan", description: "Custom airbrush full body application", duration: 30, price: 45, category: "spray_tan", isActive: true });
    const s2 = storage.createService({ name: "Express Spray Tan", description: "Quick dry formula, 1-hour rinse", duration: 20, price: 35, category: "spray_tan", isActive: true });
    const s3 = storage.createService({ name: "Booth Tan - Standard", description: "UV-free booth session", duration: 10, price: 20, category: "booth_tan", isActive: true });
    const s4 = storage.createService({ name: "Tanning Bed - 15 min", description: "Standard UV bed session", duration: 15, price: 15, category: "bed_tan", isActive: true });
    const s5 = storage.createService({ name: "Rapid Spray Tan", description: "2-hour develop, darker result", duration: 25, price: 55, category: "spray_tan", isActive: true });

    // Clients
    const today = new Date().toISOString().split("T")[0];
    const c1 = storage.createClient({ firstName: "Sarah", lastName: "Johnson", email: "sarah@email.com", phone: "435-555-0101", skinType: "Type II", allergies: null, notes: "Prefers medium shade", preferredFormula: "SunFX Medium", createdAt: "2026-01-15" });
    const c2 = storage.createClient({ firstName: "Emily", lastName: "Chen", email: "emily@email.com", phone: "435-555-0102", skinType: "Type III", allergies: "Sensitive to DHA above 10%", notes: null, preferredFormula: "Aviva Pure 8%", createdAt: "2026-02-01" });
    const c3 = storage.createClient({ firstName: "Jessica", lastName: "Martinez", email: "jess@email.com", phone: "435-555-0103", skinType: "Type I", allergies: null, notes: "First-time client, nervous", preferredFormula: null, createdAt: "2026-03-10" });
    const c4 = storage.createClient({ firstName: "Olivia", lastName: "Taylor", email: "olivia@email.com", phone: "435-555-0104", skinType: "Type IV", allergies: null, notes: "Bride - wedding June 20", preferredFormula: "SunFX Dark", createdAt: "2026-03-20" });
    const c5 = storage.createClient({ firstName: "Megan", lastName: "Anderson", email: "megan@email.com", phone: "435-555-0105", skinType: "Type II", allergies: null, notes: "Package member", preferredFormula: "SunFX Medium", createdAt: "2026-01-05" });

    // Appointments (today and upcoming)
    storage.createAppointment({ clientId: c1.id, serviceId: s1.id, date: today, time: "09:00", status: "scheduled", depositPaid: true, notes: null, createdAt: today });
    storage.createAppointment({ clientId: c2.id, serviceId: s2.id, date: today, time: "10:30", status: "scheduled", depositPaid: false, notes: "Touch-up from last week", createdAt: today });
    storage.createAppointment({ clientId: c4.id, serviceId: s5.id, date: today, time: "14:00", status: "scheduled", depositPaid: true, notes: "Bridal trial", createdAt: today });
    storage.createAppointment({ clientId: c3.id, serviceId: s3.id, date: today, time: "16:00", status: "scheduled", depositPaid: false, notes: null, createdAt: today });

    // Past appointments
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
    storage.createAppointment({ clientId: c5.id, serviceId: s1.id, date: yesterday, time: "11:00", status: "completed", depositPaid: true, notes: null, createdAt: yesterday });
    storage.createAppointment({ clientId: c1.id, serviceId: s4.id, date: twoDaysAgo, time: "13:00", status: "completed", depositPaid: false, notes: null, createdAt: twoDaysAgo });

    // Package plans
    const pp1 = storage.createPackagePlan({ name: "Glow 5-Pack", sessions: 5, price: 175, validDays: 90, isActive: true });
    const pp2 = storage.createPackagePlan({ name: "Glow 10-Pack", sessions: 10, price: 300, validDays: 180, isActive: true });
    const pp3 = storage.createPackagePlan({ name: "Monthly Unlimited", sessions: 30, price: 99, validDays: 30, isActive: true });

    // Client packages
    storage.createClientPackage({ clientId: c5.id, packagePlanId: pp1.id, sessionsRemaining: 3, purchaseDate: "2026-03-01", expiryDate: "2026-05-30", status: "active" });
    storage.createClientPackage({ clientId: c1.id, packagePlanId: pp2.id, sessionsRemaining: 8, purchaseDate: "2026-03-15", expiryDate: "2026-09-10", status: "active" });

    // Payments
    storage.createPayment({ clientId: c5.id, appointmentId: 5, amount: 45, type: "service", method: "card", createdAt: yesterday });
    storage.createPayment({ clientId: c1.id, appointmentId: 6, amount: 15, type: "service", method: "cash", createdAt: twoDaysAgo });
    storage.createPayment({ clientId: c5.id, amount: 175, type: "package", method: "card", createdAt: "2026-03-01" });
    storage.createPayment({ clientId: c1.id, amount: 300, type: "package", method: "card", createdAt: "2026-03-15" });

    // Session records
    storage.createSessionRecord({ appointmentId: 5, clientId: c5.id, formula: "SunFX Medium", shade: "medium", rinseTime: 8, aftercareNotes: "Avoid water for 8 hours. Moisturize after first rinse.", sessionNotes: "Even application, client happy with shade.", createdAt: yesterday });
    storage.createSessionRecord({ appointmentId: 6, clientId: c1.id, formula: null, shade: null, rinseTime: null, aftercareNotes: null, sessionNotes: "Standard bed session, 15 min.", createdAt: twoDaysAgo });

    res.json({ message: "Demo data seeded" });
  });
}
