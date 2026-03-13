import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "./prismaclient.js";
import config from "./config.js";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

app.get("/", (req, res) => res.send("API running"));
app.get("/api", (req, res) => res.json({ status: "ok", version: "v1" }));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/admin", adminRoutes);

async function ensureAdmin() {
  try {
    const email = config.adminEmail;
    if (!email || !email.includes("@")) {
      console.error("Invalid ADMIN_EMAIL");
      return;
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      let password = config.adminPassword;
      if (!password) {
        password = crypto.randomBytes(12).toString("hex");
      }
      const hash = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          name: "Admin",
          email,
          password: hash,
          role: "ADMIN",
          verified: true,
        },
      });
      if (config.env === "development" && !config.adminPassword) {
        console.log("Admin created", { email, password });
      } else {
        console.log("Admin created", { email });
      }
      return;
    }
    const updateData = {};
    if (existing.role !== "ADMIN" || !existing.verified) {
      updateData.role = "ADMIN";
      updateData.verified = true;
    }
    if (config.adminPassword) {
      const hash = await bcrypt.hash(config.adminPassword, 10);
      updateData.password = hash;
    }
    if (Object.keys(updateData).length) {
      await prisma.user.update({
        where: { id: existing.id },
        data: updateData,
      });
    }
    console.log("Admin ensured", { email });
  } catch (err) {
    console.error("Admin bootstrap error", err);
  }
}

const PORT = config.port || process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
