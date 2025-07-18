import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "git-markdown-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use(
    (err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status ?? err.statusCode ?? 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    }
  );

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    log("!!!!!!!! serveStatic");
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5001", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
