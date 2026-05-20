import express, { NextFunction, Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { seed } from "./src/backend/db/seed.ts";
import { initDb } from "./src/backend/db/index.ts";
import apiRoutes from "./src/backend/routes/api.ts";
import { fail } from "./src/backend/utils/response.ts";

dotenv.config();

async function startServer() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be set in .env and contain at least 32 characters.");
    }

    const app = express();
    const PORT = Number(process.env.PORT) || 3000;
    const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:5173")
      .split(",")
      .map(origin => origin.trim());

    initDb();
    if (process.env.SEED_DATABASE === "true") {
      await seed();
    }

    app.use(cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true
    }));
    app.use(express.json({ limit: "1mb" }));

    app.get("/api/health", (_req, res) => {
      res.json({ success: true, message: "Server is running", data: { status: "ok" } });
    });
    app.use("/api", apiRoutes);

    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
    }

    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Unhandled error:", err);
      return fail(res, 500, "Lỗi hệ thống. Vui lòng thử lại sau.");
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
