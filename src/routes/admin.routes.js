import express from "express";
import prisma from "../prismaclient.js";
import { auth, adminOnly } from "../middleware/auth.js";

const router = express.Router();

/* List users */
router.get("/users", auth, adminOnly, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, verified: true },
  });
  res.json(users);
});

/* Update user role */
router.put("/users/:id/role", auth, adminOnly, async (req, res) => {
  const { role } = req.body;
  if (!["ADMIN", "EMPLOYEE"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  const updated = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
  res.json(updated);
});

/* Delete user */
router.delete("/users/:id", auth, adminOnly, async (req, res) => {
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "User deleted" });
});

/* List all tasks */
router.get("/tasks", auth, adminOnly, async (req, res) => {
  const tasks = await prisma.task.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.json(tasks);
});

/* Update a task */
router.put("/tasks/:id", auth, adminOnly, async (req, res) => {
  const id = Number(req.params.id);
  const { title, dueDate } = req.body;
  const exists = await prisma.task.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "Task not found" });
  const data = {};
  if (typeof title === "string" && title.trim().length) data.title = title;
  if (dueDate) data.dueDate = new Date(dueDate);
  const updated = await prisma.task.update({ where: { id }, data });
  res.json(updated);
});

/* Delete a task */
router.delete("/tasks/:id", auth, adminOnly, async (req, res) => {
  await prisma.task.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Task deleted" });
});

/* Seed admin using env or body fallback */
router.post("/seed", async (req, res) => {
  const name = process.env.ADMIN_NAME || req.body.name || "Admin";
  const email = process.env.ADMIN_EMAIL || req.body.email;
  const password = process.env.ADMIN_PASSWORD || req.body.password;
  if (!email || !password) {
    return res.status(400).json({ error: "Provide ADMIN_EMAIL and ADMIN_PASSWORD" });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "ADMIN") {
      await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN", verified: true } });
    }
    return res.json({ message: "Admin ensured", id: existing.id, email });
  }
  const bcryptjs = await import("bcryptjs");
  const hash = await bcryptjs.default.hash(password, 10);
  const adminUser = await prisma.user.create({
    data: { name, email, password: hash, role: "ADMIN", verified: true },
  });
  res.json({ message: "Admin created", id: adminUser.id, email });
});

export default router;
