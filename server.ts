import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { prisma } from "./lib/prisma.js";
import menuRoutes from "./routes/menuRoutes.js";

const app = express();
const port = Number(process.env.PORT ?? 8000);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/health/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready", database: "connected" });
  } catch {
    res.status(503).json({ status: "not-ready", database: "unavailable" });
  }
});

app.use("/api/menu", menuRoutes);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled request error", error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
